from django.test import TestCase
from django.urls import reverse
from decimal import Decimal
from .models import ProductCategory, Product

class ProductCategoryTestCase(TestCase):
    def setUp(self):
        self.category = ProductCategory.objects.create(name="Electronics")

    def test_category_creation(self):
        """Test if a ProductCategory instance can be created."""
        category = ProductCategory.objects.get(name="Electronics")
        self.assertEqual(category.name, "Electronics")

class ProductTestCase(TestCase):
    def setUp(self):
        self.category = ProductCategory.objects.create(name="Electronics")
        self.product = Product.objects.create(
            name="Laptop",
            description="A powerful laptop",
            price=Decimal('999.99'),
            categoryId=self.category
        )

    def test_product_creation(self):
        """Test if a Product instance can be created."""
        product = Product.objects.get(name="Laptop")
        self.assertEqual(product.name, "Laptop")
        self.assertEqual(product.description, "A powerful laptop")
        self.assertEqual(product.price, Decimal('999.99'))
        self.assertEqual(product.categoryId.name, "Electronics")
        print(f"Product created: {product.name}, Price: {product.price}, Category: {product.categoryId.name}")

    def test_product_view(self):
        """Test the product view to ensure it displays product details."""
        response = self.client.get(reverse('product-detail', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['name'], self.product.name)
        self.assertEqual(data['description'], self.product.description)
        self.assertEqual(data['price'], str(self.product.price))

class ProductFunctionalTest(TestCase):
    def setUp(self):
        self.category = ProductCategory.objects.create(name="Electronics")
        self.product = Product.objects.create(
            name="Laptop",
            description="A powerful laptop",
            price=Decimal('999.99'),
            categoryId=self.category
        )

    def test_can_view_product_page(self):
        """Test if a user can view the product page."""
        response = self.client.get(reverse('product-detail', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('Laptop', data['name'])
