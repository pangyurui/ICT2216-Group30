pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', 
                          branches: [[name: '*/main']], 
                          doGenerateSubmoduleConfigurations: false, 
                          extensions: [[$class: 'DisableRemotePoll']], 
                          userRemoteConfigs: [[credentialsId: env.GIT_CREDENTIALS, url: env.GIT_REPO_URL]]])
            }
        }
        stage('Upload Files to Remote Server') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        rsync -avz --exclude=node_modules --exclude=venv -e "ssh -o StrictHostKeyChecking=no" ./ ${env.REMOTE_USER}@${env.REMOTE_HOST}:${env.REMOTE_DIR}
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
