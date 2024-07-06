pipeline {
    agent any

    stages {
        stage('Upload Files to Remote Server') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        rsync -avz --exclude=node_modules --exclude=venv -e "ssh -o StrictHostKeyChecking=no" ./ ${env.REMOTE_USER}@${env.REMOTE_HOST}:${env.REMOTE_DIR}
                    """
                }
            }
        }
        stage('Build Backend for Production') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST} "
                        cd ${env.REMOTE_DIR} &&
                        source ${env.VENV_PATH}/bin/activate &&
                        pip install -r requirements.txt &&
                        cd ${env.BACKEND_PATH} &&
                        export DJANGO_SECRET_KEY=\\"${env.DJANGO_SECRET_KEY}\\" &&
                        export DATABASE_NAME=\\"${env.DATABASE_NAME}\\" &&
                        export DATABASE_USER=\\"${env.DATABASE_USER}\\" &&
                        export DATABASE_PASSWORD=\\"${env.DATABASE_PASSWORD}\\" &&
                        export DATABASE_HOST=\\"${env.DATABASE_HOST}\\" &&
                        export DATABASE_PORT=\\"${env.DATABASE_PORT}\\" &&
                        python3 manage.py makemigrations api &&
                        python3 manage.py migrate &&
                        python3 manage.py collectstatic --noinput &&
                        mkdir -p media &&
                        cd ${env.BACKEND_PATH}/media &&
                        mkdir -p organisation_images &&
                        mkdir -p product_images && 
			sudo chmod -R 755 ${env.BACKEND_PATH}/assets &&
                        sudo chown -R ${env.WWW_USER}:${env.WWW_USER} ${env.BACKEND_PATH}/assets &&
                        sudo chmod -R 764 ${env.BACKEND_PATH}/media &&
                        sudo chown -R ${env.REMOTE_USER}:${env.REMOTE_USER} ${env.BACKEND_PATH}/media && 
			cd ${env.BACKEND_PATH} &&
                        pkill gunicorn || true
                        nohup gunicorn --workers 4 backend.wsgi:application > gunicorn.log 2>&1 &
                        "
                    """
                }
            }
        }
        stage('Build Frontend for Production') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST} "
                        cd ${env.FRONTEND_PATH} &&
                        npm install &&
                        npm install jwt-decode js-cookie qrcode.react dompurify &&
                        sudo npm run build
                        sudo chmod -R 755 ${env.FRONTEND_PATH}/build &&
                        sudo chown -R ${env.WWW_USER}:${env.WWW_USER} ${env.FRONTEND_PATH}/build			
                        "
                    """
                }
            }
        }
        stage('Copy and Overwrite Logger File') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST} "
                        cp -rf ${env.BACKEND_PATH}/backend/logger ${env.VENV_PATH}/lib/python3.12/site-packages
                        "
                    """
                }
            }
        }
	stage('Integration Testing') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST} "
                        cd ${env.BACKEND_PATH} &&
                        export DJANGO_SECRET_KEY=\\"${env.DJANGO_SECRET_KEY}\\" &&
                        export DATABASE_NAME=\\"${env.DATABASE_NAME}\\" &&
                        export DATABASE_USER=\\"${env.DATABASE_USER}\\" &&
                        export DATABASE_PASSWORD=\\"${env.DATABASE_PASSWORD}\\" &&
                        export DATABASE_HOST=\\"${env.DATABASE_HOST}\\" &&
                        export DATABASE_PORT=\\"${env.DATABASE_PORT}\\" &&
                        python manage.py test api.tests
                        "
                    """
                }
            }
        }        
        stage('Check and Restart Nginx') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST} "
                        sudo nginx -t &&
                        sudo systemctl restart nginx
                        "
                    """
                }
            }
        }
        stage('UI Testing') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.REMOTE_USER}@${env.REMOTE_HOST} "
                        cd ${env.REMOTE_DIR} &&
                        source ${env.VENV_PATH}/bin/activate &&
                        python testUi.py
                        "
                    """
                }
            }
        }
        stage('OWASP Dependency-Check') {
            steps {
                dependencyCheck additionalArguments: '''
                    --noupdate
                    -o './'
                    -s './'
                    -f 'ALL'
                    --prettyPrint''', odcInstallation: "${env.ODC}"
            }
        }
    }
    post {
        always {
            dependencyCheckPublisher pattern: 'dependency-check-report.xml'
            cleanWs()
        }
    }
}
