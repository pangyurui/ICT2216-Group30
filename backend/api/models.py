from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import os
import hashlib
import pyotp
import qrcode

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email)
        
        # Generate a salt
        salt = os.urandom(16)
        # Iteratively Hash the password with the salt
        hashed_password = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000).hex()

        user = self.model(
            email=email,
            username=username,
            password=hashed_password,
            salt=salt.hex(),
            **extra_fields
        )
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # Prompt for OTP setup
        otp_secret = pyotp.random_base32()
        totp = pyotp.TOTP(otp_secret)
        provisioning_uri = totp.provisioning_uri(username, issuer_name='CharityCentral')
        print(f"OTP Secret: {otp_secret}")
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Display QR code in the terminal
        qr.print_ascii()
        
        # Prompt for OTP token
        otp_token = input("Enter the OTP token from your authenticator app: ")
        if not totp.verify(otp_token):
            raise ValueError("Invalid OTP token")
        
        extra_fields['otp_secret'] = otp_secret
        extra_fields['verified_twofactor'] = True
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser):

    current_session_token = models.CharField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    salt = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    verified_twofactor = models.BooleanField(default=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    def check_password(self, raw_password):
        hashed_password = hashlib.pbkdf2_hmac('sha256', raw_password.encode('utf-8'), bytes.fromhex(self.salt), 100000).hex()
        return self.password == hashed_password

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser
    
class UserAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    session_token = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.address_line1}, {self.city}, {self.country}"
    
class UserPayment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('card', "Card"),
    ]

    PROVIDER_CHOICES = [
        ('visa', "Visa"),
        ('mastercard', "Mastercard")
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_type = models.CharField(max_length=255, choices=PAYMENT_TYPE_CHOICES)
    provider = models.CharField(max_length=255, choices=PROVIDER_CHOICES)
    account_no = models.CharField(max_length=255)
    expiry = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.payment_type} - {self.provider}"

class Organisation(models.Model):
    name = models.CharField(max_length=255)
    desc = models.CharField(max_length=255)
    image = models.ImageField(upload_to='organisation_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='orgs', default=1)

    def __str__(self):
        return self.name
    
class ProductReview(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    desc = models.CharField(max_length=255)
    rating = models.PositiveIntegerField(default=1)
    image = models.ImageField(upload_to='review_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f"{self.title} by {self.user.first_name} {self.user.last_name}"



class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart {self.id} for {self.user.email}"

class CartItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True) 
    deleted_at = models.DateTimeField(null=True, blank=True) 

    def __str__(self):
        return f"{self.quantity} of {self.product.name} in cart {self.cart.id}"
    
class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} for {self.user.username}"
    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} of {self.product.name} in order {self.order.id}"