# Prerequiste Software
- MySQL Community Server (https://dev.mysql.com/downloads/mysql/)
- MySQL Workbench (https://dev.mysql.com/downloads/workbench/)
- Node.js (https://nodejs.org/en/download/prebuilt-installer/current)

# Installation
1. Navigate to the 'charitycentral' directory.
2. Create and activate a python virtual environment.
   
   Windows (cmd):
   > python -m venv venv  
   > venv\Scripts\activate
   
   Mac (terminal):
   > python3 -m venv venv  
   > source ./venv/bin/activate
   
4. Run the following command:
   > pip install -r requirements.txt
   (If there is an issue with mysqlclient, do a apt install pkg-config)
   

# Initial Setup (for first time setup ONLY)
Skip to the next section ("Run the Project") if you have completed the initial setup before.

1. Navigate to the 'charitycentral' directory and run the following command:
   > xcopy backend\backend\logger venv\Lib\site-packages\logger /E /I

1. Open MySQL Workbench.
   
2. Setup a new connection and give it a connection name. The rest of the parameters can be left as default.

3. Open the connection that you just created and create a new database with the following SQL query:
   > CREATE DATABASE charity_central

4. Open a terminal/cmd window, navigate to the **backend** directory and run the follow commands:
   > python manage.py makemigrations api  
   > python manage.py migrate

   This will populate the charity_central database you just created with the necessary tables.

5. Create an admin account by running:
   > python manage.py createsuperuser

   This will create an admin account to access the Django admin dashboard.

6. Start the Django development server:
   > python manage.py runserver

7. Finally, open http://127.0.0.1:8000/admin/ in the browser and login as the superuser.

8. Next, follow step 2 in "Run the Project" to start the React server.


# Run the Project
To run the project, open **two** terminal/cmd windows.

1. In the first window, navigate to the **backend** directory and run the following commands:
   > python manage.py makemigrations api  
   > python manage.py migrate
   
   This will update the MySQL database schema with the latest migrations.
   
   > python manage.py runserver
   
   This will start the Django development server.

   ***ALWAYS run ALL 3 commands to ensure that there will be no conflicts in the DB schema!!***

2. In the second window, navigate to the **frontend** directory and run the following commands:
   > npm install
   > npm install jwt-decode
   > npm start
   
   This will start the React development server.

   Open your web browser and navigate to **http://localhost:3000/**. 


## References
https://medium.com/@devsumitg/how-to-connect-reactjs-django-framework-c5ba268cb8be
