from rest_framework import serializers
from .models import Product, CartItem, Cart, Organisation, User, ProductReview, \
    UserPayment, UserAddress, Order, OrderItem
import pyotp
import os
import hashlib
import datetime


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_superuser')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')

        # Generate a salt
        salt = os.urandom(16)
        # Iteratively Hash the password with the salt
        hashed_password = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        # 2FA
        # secret_generated = pyotp.random_base32()
        # print(secret_generated)  # this is what is used to register google auth

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            password=hashed_password.hex(),
            salt=salt.hex(),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            # otp_secret=secret_generated

        )

        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            salt = instance.salt  # Assuming salt is stored with user model
            instance.password = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt),
                                                    100000).hex()
        return super().update(instance, validated_data)
    

class UserPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPayment
        fields = ['id', 'payment_type', 'provider', 'account_no', 'expiry']

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = ['id', 'address_line1', 'address_line2', 'city', 'postal_code', 'country']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        otp = data.get('otp')
        if username and password and otp:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid username or password")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid username or password")

            totp = pyotp.TOTP(user.otp_secret)

            if not totp.verify(otp):
                raise serializers.ValidationError("Invalid username or password")
        else:
            raise serializers.ValidationError("Must include both username and password")

        data['user'] = user
        return data

class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())  # Automatically set user to the current user
    class Meta:
        model = ProductReview
        fields = '__all__'
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super(ProductReviewSerializer, self).create(validated_data)

class ProductSerializer(serializers.ModelSerializer):
    reviews = ProductReviewSerializer(many=True, read_only=True)
    # category_id = serializers.PrimaryKeyRelatedField(
    #     queryset=ProductCategory.objects.all(),
    #     source='category',
    #     write_only=False,
    #     required=False,  # If not always required
    #     allow_null=True,  # If null is allowed
    # )
    organisation_id = serializers.PrimaryKeyRelatedField(
        queryset=Organisation.objects.all(),
        source='organisation',
        write_only=False,
        required=False,  # If not always required
        allow_null=True,  # If null is allowed
    )

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'price', 'image', 'organisation_id', 'created_at',
            'modified_at',
            'deleted_at', 'reviews')

    def create(self, validated_data):
        # Extracting and handling the relationships separately if needed
        # category = validated_data.pop('category', None)
        organisation = validated_data.pop('organisation', None)
        # product = Product.objects.create(category=category, organisation=organisation, **validated_data)
        product = Product.objects.create(organisation=organisation, **validated_data)
        return product

    def update(self, instance, validated_data):
        # update logic for your fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.price = validated_data.get('price', instance.price)
        # instance.category = validated_data.get('category', instance.category)
        instance.organisation = validated_data.get('organisation', instance.organisation)
        instance.save()
        return instance

    def validate_deleted_at(self, value):
        if isinstance(value, datetime.datetime):
            return value  # Return the datetime object if it's already a datetime

        if value in ['null', None, '']:  # Handle 'null' as a string, actual None, and empty string
            return None

        try:
            # Convert string to datetime object
            return datetime.datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%fZ')
        except ValueError:
            raise serializers.ValidationError(
                "Datetime has wrong format. Use this format instead: YYYY-MM-DDThh:mm:ss.ssssssZ")

    def validate_image(self, value):
        if value.size > 1024 * 1024 * 5:  # limit to 5MB
            raise serializers.ValidationError("Image file too large ( > 5MB )")
        return value


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = '__all__'
        read_only_fields = ['cart']


class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'total', 'created_at', 'items']

class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = '__all__'


class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())  # Automatically set user to the current user
    class Meta:
        model = ProductReview
        fields = '__all__'
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super(ProductReviewSerializer, self).create(validated_data)
    
class CheckoutSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField())

    def create(self, validated_data):
        user = self.context['request'].user
        items = validated_data['items']

        order = Order.objects.create(user=user, total=0)
        total = 0

        for item in items:
            product_id = item['product_id']
            quantity = item['quantity']
            product = Product.objects.get(id=product_id)
            order_item = OrderItem.objects.create(order=order, product=product, quantity=quantity)
            total += product.price * quantity

        order.total = total
        order.save()

        CartItem.objects.filter(cart__user=user).delete()

        return order


class TwoFactorSetupSerializer(serializers.Serializer):
    otp_token = serializers.CharField(write_only=True)
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_otp_token(self, value):

        username = value.get('username')
        password = value.get('password')
        otp_token = value.get('otp_token')

        if username and password:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid username or password")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid username or password")
        else:
            raise serializers.ValidationError("Must include both username and password")
        value['user'] = user

        otp_secret = user.otp_secret
        totp = pyotp.TOTP(otp_secret)
        if not totp.verify(otp_token):
            raise serializers.ValidationError("Invalid OTP token")

        return value


class TwoFactorLoginVerification(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        if username and password:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid username or password")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid username or password")

        else:
            raise serializers.ValidationError("Must include both username and password")

        data['user'] = user
        return data

