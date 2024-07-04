import pyotp
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, NotFound
from rest_framework.views import APIView
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction, connection, IntegrityError
from .models import Product, Cart, CartItem, Organisation, User, ProductCategory, ProductReview, \
    UserPayment, UserAddress, Organisation
from .serializers import ProductSerializer, CartItemSerializer, CartSerializer, \
    OrganisationSerializer, UserSerializer, LoginSerializer, ProductCategorySerializer, \
    UserUpdateSerializer, ProductReviewSerializer, TwoFactorLoginVerification, \
    UserPaymentSerializer, UserAddressSerializer
from django.http import JsonResponse
import os, json
from django.views.decorators.csrf import csrf_exempt

from django.contrib.auth import get_user_model



from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import User

import logging
from logger import logging_library

from django.db import IntegrityError
from django.core.files.storage import default_storage

from .models import Product
from .serializers import ProductSerializer

from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser

logger = logging.getLogger(__name__)

from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

@api_view(['GET'])
def hello_world(request):
    return Response({'message': 'Hello, world!'})


# Read User
class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# Update User
class UserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# Delete User
class UserDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()
        return Response(status=204)
    
    
class UserPaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = UserPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPayment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserPaymentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPayment.objects.filter(user=self.request.user)
    
class UserAddressListCreateView(generics.ListCreateAPIView):
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserAddressRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)



class UserList(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST'), name='post') #rate limit

    def post(self, request, *args, **kwargs):
        # serializer = self.get_serializer(data=request.data)
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        access_token['is_superuser'] = user.is_superuser
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "access": str(access_token),
            "refresh": str(refresh),
            "is_superuser": user.is_superuser
        })


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        print(request.data)
        logging_library.log_access_register(request, "register")
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            Cart.objects.create(user=user)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class CartItemListCreateView(generics.ListCreateAPIView):
    queryset = CartItem.objects.all()
    authentication_classes = [JWTAuthentication]
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated

    def get_user_from_token(self, request):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            user_id = validated_token.get('user_id')
            user = User.objects.get(id=user_id)
            return user
        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')

    def get_cart_for_user(self, user):
        try:
            cart = Cart.objects.get(user_id=user.id)

            return cart
        except Cart.DoesNotExist:
            raise NotFound(detail="Cart not found for the user", code=status.HTTP_404_NOT_FOUND)

    def get(self, request, *args, **kwargs):
        user = self.get_user_from_token(request)
        cart = self.get_cart_for_user(user)

        cart_items = CartItem.objects.filter(cart_id=cart.id)
        serializer = self.get_serializer(cart_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        user = self.get_user_from_token(request)
        cart = self.get_cart_for_user(user)

        data = request.data
        product_id = data.get('product')
        quantity = data.get('quantity', 1)

        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Invalid product ID.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if created:
            cart_item.quantity = quantity
        else:
            cart_item.quantity += quantity
        cart_item.save()

        serializer = self.get_serializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartItemRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_user_from_token(self, request):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            user_id = validated_token.get('user_id')
            user = User.objects.get(id=user_id)
            return user
        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')

    def get_cart_for_user(self, user):
        try:
            cart = Cart.objects.get(user=user)
            return cart
        except Cart.DoesNotExist:
            raise NotFound(detail="Cart not found for the user", code=status.HTTP_404_NOT_FOUND)

    def get_queryset(self):
        user = self.get_user_from_token(self.request)
        cart = self.get_cart_for_user(user)
        return CartItem.objects.filter(cart=cart)

    def get_object(self):
        queryset = self.get_queryset()
        obj = queryset.filter(id=self.kwargs['pk']).first()
        if not obj:
            raise NotFound(detail="Cart item not found", code=status.HTTP_404_NOT_FOUND)
        return obj

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data

        # Check for quantity in the update request
        quantity = data.get('quantity')
        if quantity is not None and int(quantity) == 0:
            instance.delete()
            return Response({'message': 'Cart item deleted due to zero quantity.'}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)


class CartCreateView(generics.CreateAPIView):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer

    # permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user = request.user
        cart, created = Cart.objects.get_or_create(user_id=user.id)
        if created:
            return Response({'cart_id': cart.id, 'created': created}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Cart already exists for this user'}, status=status.HTTP_400_BAD_REQUEST)


# User = get_user_model()
class CartAPIView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    authentication_classes = [JWTAuthentication]

    def get(self, request, *args, **kwargs):
        jwt_authenticator = JWTAuthentication()

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            user_id = validated_token.get('user_id')
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed(f'{user_id} User not found')

        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            raise NotFound(detail="Cart not found for the user", code=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    def get(self, request, *args, **kwargs):
        # Manually authenticate the user using JWT
        jwt_authenticator = JWTAuthentication()
        try:
            # Extract the token from the Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                raise AuthenticationFailed('Authorization header is missing')
            token_str = auth_header.split()[1]

            # Validate and decode the token
            validated_token = jwt_authenticator.get_validated_token(token_str)
            user_id = validated_token.get('user_id')
            if not user_id:
                raise AuthenticationFailed('User ID not found in token')

            # Get the user from the custom user model
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
        except AuthenticationFailed as auth_fail:
            logger.debug(f"Authentication failed: {auth_fail}")
            return Response({'detail': 'Authentication credentials were not provided or are invalid.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.debug(f"Error extracting user_id: {e}")
            return Response({'detail': 'Invalid token format.'},
                            status=status.HTTP_400_BAD_REQUEST)

        logger.debug(f"Authenticated user_id: {user_id}")

        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            logger.debug(f"Cart not found for user_id: {user_id}")
            raise NotFound(detail="Cart not found for the user", code=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(cart)
        return Response(serializer.data)


class OrganisationCreateView(generics.CreateAPIView):
    queryset = Organisation.objects.all()
    serializer_class = OrganisationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def create(self, request, *args, **kwargs):

        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                raise AuthenticationFailed('You cannot perform this action')
            else:
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    try:
                        serializer.save()
                        return Response(serializer.data, status=status.HTTP_201_CREATED)
                    except IntegrityError as e:
                        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    print("Received data: ", request.data)  # Log received data
                    print("Errors: ", serializer.errors)  # Log validation errors
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')

# Product view

class ProductDetail(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ProductList(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ProductDeleteView(generics.DestroyAPIView):
    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, *args, **pk):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                raise AuthenticationFailed('You cannot perform this action')
            else:
                product = self.get_object()
                product.delete()
                return Response({"message": "Product deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')


# class ProductUpdateView(generics.UpdateAPIView):
#     queryset = Product.objects.all()
#     serializer_class = ProductSerializer
#     parser_classes = (MultiPartParser, FormParser)

#     def put(self, request, *args, **kwargs):
#         product = self.get_object()
#         serializer = self.serializer_class(product, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         else:
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def put(self, request, *args, **kwargs):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                raise AuthenticationFailed('You cannot perform this action')
            else:
                product = self.get_object()
                serializer = self.get_serializer(product, data=request.data, partial=True)
                if serializer.is_valid():
                    if 'image' in request.FILES:
                        image_file = request.FILES['image']
                        saved_path = default_storage.save(image_file.name, image_file)
                        product.image = saved_path  # Save the path to your image field
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')
    # queryset = Product.objects.all()
    # serializer_class = ProductSerializer
    # parser_classes = (MultiPartParser, FormParser)  

    # def put(self, request, *args, **kwargs):
    #     self.serializer_class = ProductSerializer
    #     product = self.get_object()
    #     serializer = self.serializer_class(product, data=request.data, partial=True)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data, status=status.HTTP_200_OK)
    #     else:
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, *args, **kwargs):

        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                raise AuthenticationFailed('You cannot perform this action')
            else:
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    try:
                        serializer.save()
                        return Response(serializer.data, status=status.HTTP_201_CREATED)
                    except IntegrityError as e:
                        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    print("Received data: ", request.data)  # Log received data
                    print("Errors: ", serializer.errors)  # Log validation errors
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')


class ProductCategoryCreateView(generics.CreateAPIView):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer

class OrganisationListView(generics.ListAPIView):
   queryset = Organisation.objects.all()
   serializer_class = OrganisationSerializer



class OrganisationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
   queryset = Organisation.objects.all()
   serializer_class = OrganisationSerializer
   permission_classes = [permissions.IsAuthenticated]
   authentication_classes = [JWTAuthentication]
   def put(self, request, *args, **kwargs):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                raise AuthenticationFailed('You cannot perform this action')
            else:
                organisation = self.get_object()
                serializer = self.get_serializer(organisation, data=request.data, partial=True)
                if serializer.is_valid():
                    if 'image' in request.FILES:
                        image_file = request.FILES['image']
                        saved_path = default_storage.save(image_file.name, image_file)
                        organisation.image = saved_path  # Save the path to your image field
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')
   def delete(self, request, *args, **pk):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                raise AuthenticationFailed('You cannot perform this action')
            else:
                organisation = self.get_object()
                organisation.delete()
                return Response({"message": "Organisation deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except (User.DoesNotExist, IndexError, KeyError):
            raise AuthenticationFailed('Invalid token or user not found')

# class ProductReviewListCreateView(generics.ListCreateAPIView):
#     queryset = ProductReview.objects.all()
#     serializer_class = ProductReviewSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user) 

# class ProductReviewRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
#    queryset = ProductReview.objects.all()
#    serializer_class = ProductReviewSerializer

class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        product_id = self.kwargs['pk']
        return ProductReview.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        product_id = self.kwargs['pk']
        product = get_object_or_404(Product, id=product_id)
        serializer.save(user=self.request.user, product=product)


class ProductReviewRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def put(self, request, *args, **kwargs):
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            raise AuthenticationFailed('Authorization header is missing')

        try:
            # Extract the token from the Authorization header
            token_str = auth_header.split()[1]
            # Validate and decode the token
            validated_token = jwt_authenticator.get_validated_token(token_str)
            user_id = validated_token.get('user_id')

            if not user_id:
                raise AuthenticationFailed('Invalid token or user ID not found')

            # Get the product review object by its ID
            review_id = kwargs.get('pk')
            try:
                review = ProductReview.objects.get(pk=review_id)
            except ProductReview.DoesNotExist:
                raise NotFound(detail="Product Review does not exist", code=status.HTTP_404_NOT_FOUND)

            # Check if the review belongs to the authenticated user
            if review.user_id != user_id:
                raise AuthenticationFailed('You do not have permission to update this review')

            # Proceed with updating the review
            serializer = self.get_serializer(review, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data)

        except (AuthenticationFailed, IndexError, KeyError) as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)



class CategoryList(generics.ListAPIView):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer

class TwoFactorLoginView(generics.GenericAPIView):
    serializer_class = TwoFactorLoginVerification

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        access_token['is_superuser'] = user.is_superuser

        #check if user has 2FA enabled, if yes then dont allow
        if user.verified_twofactor == 1:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Generate OTP secret for user each time page is accessed
        user.otp_secret = pyotp.random_base32()
        user.save()

        otp_secret = user.otp_secret
        totp = pyotp.TOTP(otp_secret)
        provisioning_uri = totp.provisioning_uri(user.username, issuer_name='CharityCentral')

        return Response({
            "otp_secret": otp_secret,
            "otp_provisioning_uri": provisioning_uri,
        }, status=status.HTTP_200_OK)


class TwoFactorSetupView(generics.GenericAPIView):

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        otp_token = request.data.get('otpToken')
        print("Username: ", username)
        print("OTP Token: ", otp_token)
        if not username or not otp_token:
            return Response({'detail': 'Username and OTP token are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.otp_secret:
            return Response({'detail': 'OTP secret not set for this user.'}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(user.otp_secret)
        if not totp.verify(otp_token):
            return Response({'detail': 'Invalid OTP token.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Update the verified_twofactor flag
        user.verified_twofactor = True
        user.save()

        return Response( status=status.HTTP_200_OK)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

def get_common_passwords(request):
    file_path = os.path.join(os.path.dirname(__file__), r'C:\Users\jinyu\Desktop\charitycentral\frontend\src\user\pages\register\1000-most-common-passwords.txt')
    with open(file_path, 'r') as file:
        common_passwords = file.read().splitlines()
    return JsonResponse(common_passwords, safe=False)
