import unittest
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import pyotp
import time
import random
import string
import cv2
from PIL import Image
from pyzbar.pyzbar import decode
import urllib.parse as urlparse
from urllib.parse import parse_qs
from django.conf import settings

os.environ["DJANGO_SETTINGS_MODULE"] = "backend.backend.settings"
def generate_random_username(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for i in range(length))

def generate_random_email(username_length=8, domain="example.com"):
    username = generate_random_username(username_length)
    return f"{username}@{domain}"

class UITest(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--remote-debugging-port=9222")
    
        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.implicitly_wait(10)
        cls.driver.maximize_window()
        cls.host = 'https://ict2216group30.store'
        cls.qr_code_image_path = 'qrcode.png'
        cls.totp = None
        cls.username = generate_random_username()
        cls.password = generate_random_password()
        cls.email = generate_random_email()
        
    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        # Remove the QR code image after all tests
        if os.path.exists(cls.qr_code_image_path):
            os.remove(cls.qr_code_image_path)
    
    def tearDown(self):
        # Add a 1-second delay after each test
        time.sleep(1)

    def test_home_page(self):
        self.driver.get(self.host)
        page_title = self.driver.title
        print(f"Page title is: {page_title}") 
        self.assertIn(page_title, self.driver.title)  

    def test_register(self):
        self.driver.get(self.host + "/register/")  # Registration Page url

        # Fill in the registration form
        username_field = self.driver.find_element(By.NAME, 'username')
        email_field = self.driver.find_element(By.NAME, 'email')
        password_field = self.driver.find_element(By.NAME, 'password')
        first_name_field = self.driver.find_element(By.NAME, 'first_name')
        last_name_field = self.driver.find_element(By.NAME, 'last_name')
    
        username_field.send_keys(self.username)
        password_field.send_keys(self.password)
        email_field.send_keys(self.email)
        first_name_field.send_keys('Test')
        last_name_field.send_keys('User')

        # Submit the form
        submit_button = self.driver.find_element(By.XPATH, '//button[@type="submit"]')
        submit_button.click()

        # Wait for Sweet Alert modal and confirm
        WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, '//button[text()="Setup 2 Factor Authentication"]')))
        sweet_alert_button = self.driver.find_element(By.XPATH, '//button[text()="Setup 2 Factor Authentication"]')
        sweet_alert_button.click()

        # Wait for the redirection to the 2FA setup page
        WebDriverWait(self.driver, 10).until(EC.url_contains('/2fa'))

        # Log in to set up OTP
        username_field = self.driver.find_element(By.NAME, 'username')
        password_field = self.driver.find_element(By.NAME, 'password')

        username_field.send_keys(self.username)
        password_field.send_keys(self.password)
        password_field.send_keys(Keys.RETURN)

        # Wait for the OTP setup page
        WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, 'canvas')))

        # Screenshot of the QR code
        qr_code_element = self.driver.find_element(By.TAG_NAME, 'canvas')
        qr_code_element.screenshot(self.qr_code_image_path)
        
        try:
            # Decode the QR code to get the provisioning URI
            img = cv2.imread(self.qr_code_image_path)
            decoded_objects = decode(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))

            provisioning_uri = None
            for obj in decoded_objects:
                if obj.type == 'QRCODE':
                    provisioning_uri = obj.data.decode('utf-8')
                    break

            if provisioning_uri is None:
                raise Exception('QR code not found or not decoded properly.')

            # Extract the secret from the provisioning URI
            parsed_uri = urlparse.urlparse(provisioning_uri)
            secret_key = parse_qs(parsed_uri.query)['secret'][0]

            if len(secret_key) % 8 != 0:
                secret_key += '=' * (8 - len(secret_key) % 8)  # Add padding to the base32 secret key if necessary
            
            self.__class__.totp = pyotp.TOTP(secret_key) # Generate the TOTP object using the secret key and store it for later use

            otp = self.totp.now() # Generate the OTP using the secret key

            # Enter the OTP for verification
            otp_field = self.driver.find_element(By.NAME, 'otpToken')
            otp_field.send_keys(otp)
            verify_button = self.driver.find_element(By.XPATH, '//button[@type="submit"]')
            verify_button.click()

            # Check if the registration and OTP verification were successful
            WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, '//button[text()="OK"]')))
            sweet_alert_button = self.driver.find_element(By.XPATH, '//button[text()="OK"]')
            sweet_alert_button.click()
        except Exception as e:
            print(f"Error during registration: {e}")
        finally:
            # Remove the QR code image after the test if it exists
            if os.path.exists(self.qr_code_image_path):
                os.remove(self.qr_code_image_path)

    def test_login(self):
        if self.totp is None:
            self.fail("TOTP is not set. Run the registration test first.")

        self.driver.get(self.host + "/login/")  # Login url
        username = self.username
        password = self.password
        
        # Fill in the login form
        username_field = self.driver.find_element(By.NAME, 'username')
        password_field = self.driver.find_element(By.NAME, 'password')
        otp_field = self.driver.find_element(By.NAME, 'otp')

        username_field.send_keys(username)
        password_field.send_keys(password)

        # Generate the OTP using the stored TOTP object
        otp = self.totp.now()
        otp_field.send_keys(otp)
        
        # Submit the form
        login_button = self.driver.find_element(By.XPATH, '//button[@type="submit"]')
        login_button.click()

        # Wait for Sweet Alert modal and confirm
        WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, '//button[text()="OK"]')))
        sweet_alert_button = self.driver.find_element(By.XPATH, '//button[text()="OK"]')
        sweet_alert_button.click()
    
    def test_add_to_cart(self):
    # Navigate to the home page or the page where the "Add To Cart" button is located
        self.driver.get(self.host)

        # Find the first "Add To Cart" button and click it
        add_to_cart_button = self.driver.find_element(By.XPATH, '//button[text()="Add To Cart "]')
        add_to_cart_button.click()

        # Wait for alert to finish flashing
        time.sleep(2)


    def test_check_cart(self):
        self.driver.get(self.host+ "/cart/")

    def test_logout(self):
        self.driver.get(self.host+ "/logout/")

if __name__ == "__main__":
    suite = unittest.TestSuite()
    suite.addTest(UITest('test_home_page'))
    suite.addTest(UITest('test_register'))
    suite.addTest(UITest('test_login'))
    suite.addTest(UITest('test_add_to_cart'))
    suite.addTest(UITest('test_check_cart'))
    suite.addTest(UITest('test_logout'))
    runner = unittest.TextTestRunner()
    runner.run(suite)
