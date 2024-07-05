from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, NotFound
from rest_framework.views import APIView
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction, IntegrityError
from .models import Product, Cart, CartItem, Organisation, User, ProductReview

from django.db import transaction
from .models import Product, Cart, CartItem, Organisation, User, ProductReview, \
    UserPayment, UserAddress
from .serializers import ProductSerializer, CartItemSerializer, CartSerializer, \
    OrganisationSerializer, UserSerializer, LoginSerializer, \
    UserUpdateSerializer, ProductReviewSerializer, TwoFactorLoginVerification, \
    UserPaymentSerializer, UserAddressSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from logger import logging_library
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from django_ratelimit.decorators import ratelimit
import pyotp
import logging

logger = logging.getLogger(__name__)

from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.authentication import JWTAuthentication
import re
from rest_framework.exceptions import ValidationError
import requests


import jwt
from django.conf import settings
from django.contrib.auth import authenticate
import os

@api_view(['GET'])
def hello_world(request):
    return Response({'message': 'Hello, world!'})

@ensure_csrf_cookie
@require_http_methods(["GET", "OPTIONS"])
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

@csrf_exempt
def OrganisationCreateView(request):
    if request.method == 'POST':

        # Authentication
        jwt_authenticator = JWTAuthentication()
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'detail': 'Authorization header is missing'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token_str = auth_header.split()[1]
            validated_token = jwt_authenticator.get_validated_token(token_str)
            is_super_user = validated_token.get('is_superuser')
            if not is_super_user:
                return JsonResponse({'detail': 'You cannot perform this action'}, status=status.HTTP_403_FORBIDDEN)

            # Parse multipart form data
            data = request.POST
            files = request.FILES

            serializer = OrganisationSerializer(data=data)
            if serializer.is_valid():
                # Handle the file upload
                org_name = data.get('name')
                org_desc = data.get('desc')
                org_image = files.get('image')
                org_createdat = data.get('created_at')
                org_modifiedat = data.get('modified_at')

                # Save the file if it's provided
                if org_image:
                    organisation = Organisation(
                        name=org_name,
                        desc=org_desc,
                        image=org_image,
                        created_at=org_createdat,
                        modified_at=org_modifiedat
                    )
                else:
                    organisation = Organisation(
                        name=org_name,
                        desc=org_desc,
                        created_at=org_createdat,
                        modified_at=org_modifiedat
                    )

                try:
                    organisation.save()
                    return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
                except IntegrityError as e:
                    return JsonResponse({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, IndexError, KeyError) as e:
            return JsonResponse({'detail': 'Invalid token or user not found'}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return JsonResponse({'detail': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


# Read User
class UserAccountView(generics.RetrieveAPIView):
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

@method_decorator(csrf_protect, name='post')
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

@method_decorator(csrf_protect, name='post')
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST'), name='dispatch')
    def post(self, request, *args, **kwargs):
        try:
            sanitized_data = self.sanitize_and_validate_data(request.data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # serializer = self.get_serializer(data=request.data)
        serializer = LoginSerializer(data=sanitized_data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate a new session token
        session_token = jwt.encode({'username': user.username}, settings.SECRET_KEY, algorithm='HS256')
        user.session_token = session_token
        user.save()

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

    def sanitize_input(self, input):
        input = re.sub(r'<script.*?>.*?</script>', '', input, flags=re.IGNORECASE)  # Remove script tags
        input = re.sub(r'<[^>]+>', '', input)  # Remove all HTML tags
        input = input.replace('"', '')  # Remove double quotes
        input = input.replace("'", '')  # Remove single quotes
        return input.strip()  # Remove whitespace from both ends


    def validate_length(self, input, field_name, max_length):
        if len(input) > max_length:
            raise ValidationError(f"{field_name} must not exceed {max_length} characters.")
        return input

    def validate_username(self, username):
        username = username.strip()
        if len(username) == 0:
            raise ValidationError("Username is required.")
        return self.validate_length(username, 'Username', 255)

    def validate_password(self, password):
        if len(password) == 0:
            raise ValidationError("Password is required.")
        return self.validate_length(password, 'Password', 255)

    def validate_otp(self, otp):
        otp = otp.strip()
        if len(otp) == 0:
            raise ValidationError("OTP Password is required.")
        if len(otp) != 6:
            raise ValidationError("OTP Password must be exactly 6 characters long.")
        return otp

    def sanitize_and_validate_data(self, data):
        sanitized_data = {}
        sanitized_data['username'] = self.sanitize_input(data.get('username', ''))
        sanitized_data['password'] = self.sanitize_input(data.get('password', ''))
        sanitized_data['otp'] = self.sanitize_input(data.get('otp', ''))

        sanitized_data['username'] = self.validate_username(sanitized_data['username'])
        sanitized_data['password'] = self.validate_password(sanitized_data['password'])
        sanitized_data['otp'] = self.validate_otp(sanitized_data['otp'])

        return sanitized_data
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def sanitize_input(self, input):
        input = re.sub(r'<script.*?>.*?</script>', '', input, flags=re.IGNORECASE)  # Remove script tags
        input = re.sub(r'<[^>]+>', '', input)  # Remove all HTML tags
        input = input.replace('"', '')  # Remove double quotes
        input = input.replace("'", '')  # Remove single quotes
        return input.strip()  # Remove whitespace from both ends

    def validate_length(self, input, field_name):
        if len(input) > 255:
            raise ValidationError(f"{field_name} must not exceed 255 characters.")
        return input

    def validate_username(self, username):
        username = username.strip()
        if len(username) == 0:
            raise ValidationError("Username is required.")
        if len(username) < 3:
            raise ValidationError("Username must be at least 3 characters long.")
        return self.validate_length(username, 'Username')

    def validate_email(self, email):
        email = email.strip()
        email_regex = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
        if len(email) == 0:
            raise ValidationError("Email is required.")
        if not email_regex.match(email):
            raise ValidationError("Invalid email format.")
        return self.validate_length(email, 'Email')

    def validate_password(self, password):
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        common_passwords = self.get_common_passwords()
        if password in common_passwords:
            raise ValidationError("Password is too common. Please choose a more secure password.")
        return self.validate_length(password, 'Password')

    def validate_name(self, name, field_name):
        name = name.strip()
        if len(name) == 0:
            raise ValidationError(f"{field_name} is required.")
        if len(name) < 2:
            raise ValidationError(f"{field_name} must be at least 2 characters long.")
        return self.validate_length(name, field_name)

    def get_common_passwords(self):
        try:
            response = requests.get('http://127.0.0.1:8000/api/common-passwords/')
            response.raise_for_status()  # Will raise an HTTPError for bad responses
            return response.json()
        except requests.RequestException as e:
            logging.error(f"Error fetching common passwords: {e}")
            return []

    def sanitize_and_validate_data(self, data):
        sanitized_data = {}
        sanitized_data['username'] = self.sanitize_input(data.get('username'))
        sanitized_data['email'] = self.sanitize_input(data.get('email'))
        sanitized_data['password'] = self.sanitize_input(data.get('password'))
        sanitized_data['first_name'] = self.sanitize_input(data.get('first_name'))
        sanitized_data['last_name'] = self.sanitize_input(data.get('last_name'))

        sanitized_data['username'] = self.validate_username(sanitized_data['username'])
        sanitized_data['email'] = self.validate_email(sanitized_data['email'])
        sanitized_data['password'] = self.validate_password(sanitized_data['password'])
        sanitized_data['first_name'] = self.validate_name(sanitized_data['first_name'], 'First Name')
        sanitized_data['last_name'] = self.validate_name(sanitized_data['last_name'], 'Last Name')

        return sanitized_data

    @method_decorator(csrf_protect)
    def create(self, request, *args, **kwargs):
        logging.info("Access register")
        
        try:
            sanitized_data = self.sanitize_and_validate_data(request.data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            serializer = self.get_serializer(data=sanitized_data)
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
    @method_decorator(csrf_protect)
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




class TwoFactorLoginView(generics.GenericAPIView):
    serializer_class = TwoFactorLoginVerification

    @method_decorator(csrf_protect)
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
    file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'user', 'pages', 'register', '1000-most-common-passwords.txt')
    with open(file_path, 'r') as file:
        common_passwords = file.read().splitlines()
    return JsonResponse(common_passwords, safe=False)
