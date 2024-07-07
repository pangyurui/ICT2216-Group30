from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch
from api.models import User
import json

class BaseTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.client = APIClient()
        cls.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'testpassword',
            'first_name': 'Test',
            'last_name': 'User'
        }
        cls.superuser_data = {
            'username': 'adminuser',
            'email': 'admin@example.com',
            'password': 'adminpassword',
            'first_name': 'Admin',
            'last_name': 'User'
        }

        # Create normal user
        cls.user = User.objects.create_user(**cls.user_data)

        # Mock the OTP verification process
        with patch('pyotp.TOTP.verify', return_value=True), \
             patch('builtins.input', return_value='123456'), \
             patch('qrcode.QRCode.print_ascii', return_value=None):  # Mock the QR code printing
            cls.superuser = User.objects.create_superuser(**cls.superuser_data)

    def setUp(self):
        self.client = APIClient()  # Ensure APIClient is used here

    def get_csrf_token(self):
        response = self.client.get(reverse('get_csrf_token'))
        return response.cookies['csrftoken'].value

    def authenticate(self, user_data):
        login_data = {
            'username': user_data['username'],
            'password': user_data['password'],
            'otp': '123456'  # This is the mocked OTP value
        }
        csrf_token = self.get_csrf_token()
        response = self.client.post(reverse('login'), data=json.dumps(login_data), content_type='application/json', headers={'X-CSRFToken': csrf_token})
        
        # Check if login was successful and tokens are present
        if response.status_code != status.HTTP_200_OK:
            print("Login failed with status code:", response.status_code)
            print("Response content:", response.content)
            return None
        
        if 'access' not in response.data or 'refresh' not in response.data:
            print("Access or refresh token missing in the response")
            print("Response data:", response.data)
            return None
        
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
        return True

class UserTests(BaseTestCase):
    @patch('api.views.RegisterView.get_common_passwords', return_value=[])
    def test_user_registration(self, mock_get_common_passwords):
        new_user_data = {
            'username': 'newtestuser',
            'email': 'newtestuser@example.com',
            'password': 'newtestpassword',
            'first_name': 'NewTest',
            'last_name': 'User'
        }
        csrf_token = self.get_csrf_token()
        response = self.client.post(reverse('register'), data=json.dumps(new_user_data), content_type='application/json', headers={'X-CSRFToken': csrf_token})
        if response.status_code != status.HTTP_201_CREATED:
            print("Registration response content:", response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        print("test_user_registration passed.")

    @patch('pyotp.TOTP.verify', return_value=True)
    def test_user_login(self, mock_verify):
        login_data = {
            'username': self.superuser_data['username'],
            'password': self.superuser_data['password'],
            'otp': '123456'  # This is the mocked OTP value
        }
        csrf_token = self.get_csrf_token()
        response = self.client.post(reverse('login'), data=json.dumps(login_data), content_type='application/json', headers={'X-CSRFToken': csrf_token})
        if response.status_code != status.HTTP_200_OK:
            print("Login response content:", response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        print("test_user_login passed.")

class OrganisationTests(BaseTestCase):
    @patch('pyotp.TOTP.verify', return_value=True)
    def test_create_organisation_as_admin(self, mock_verify):
        self.authenticate(self.superuser_data)
        
        organisation_data = {
            'name': 'Test Organisation',
            'desc': 'A test organisation',
            'created_at': '2024-07-05 16:55:49.251618',
            'modified_at': '2024-07-05 16:55:49.251618'
        }
        response = self.client.post(reverse('organisation-create'), data=organisation_data)
        print("Admin create organisation response:", response.json())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['name'], 'Test Organisation')
        print("test_create_organisation_as_admin passed.")

    @patch('pyotp.TOTP.verify', return_value=True)
    def test_create_organisation_as_normal_user(self, mock_verify):
        self.authenticate(self.user_data)
        
        organisation_data = {
            'name': 'Test Organisation',
            'desc': 'A test organisation',
            'created_at': '2024-07-05 16:55:49.251618',
            'modified_at': '2024-07-05 16:55:49.251618'
        }
        response = self.client.post(reverse('organisation-create'), data=organisation_data)
        print("Normal user create organisation response:", response.json())
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.json())
        self.assertEqual(response.json()['detail'], 'You cannot perform this action')
        print("test_create_organisation_as_normal_user passed.")
