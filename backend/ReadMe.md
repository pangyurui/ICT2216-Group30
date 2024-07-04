# Set Up
First go to settings.py in backend/settings.py and configure the MYSQL connection
> DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'charity_central',         # Replace with your database name
        'USER': 'root',             # Replace with your database user
        'PASSWORD': 'root',     # Replace with your database password
        'HOST': 'localhost',          # Set to your database host
        'PORT': '3306',               # Default MySQL port
    }
}

Run the following commands in order in the backend folder
> 1. python manage.py makemigrations api
> 2. python manage.py migrate
> 3. python manage.py runserver 

# to fix logger error, move logger library to venv/lib
Ensure middleware_logger's import statement is
"from logger.logging_library import log_exception, log_access"


# Admin Panel
Create an admin account by running 
> python manage.py createsuperuser

This will create an admin account to access the admin dashboard.