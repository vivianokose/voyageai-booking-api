@Library('voyageai-lib') _

pipeline {
    agent any

    environment {
        APP_NAME        = 'voyageai-booking-api'
        APP_VERSION     = "1.${BUILD_NUMBER}"
        DOCKER_IMAGE    = "${APP_NAME}:${APP_VERSION}"
        APP_SERVER_IP   = credentials('app-server-ip')
        APP_SERVER_USER = 'root'
        APP_PORT        = '3000'
        DOCKERHUB_USER  = 'vivianokose'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out the latest code"
                checkout scm
            }
        }

        stage('Lint') {
            steps {
                echo 'Running lint checks...'
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                echo 'Running unit tests...'
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build & Push Image') {
            steps {
                buildAndPushImage(image: env.APP_NAME, tag: env.APP_VERSION)
            }
        }

        stage('Deploy to App Server') {
            when { branch 'main' }
            steps {
                sshagent(credentials: ['jenkins-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER_USER}@${APP_SERVER_IP} '
                            docker stop ${APP_NAME} 2>/dev/null || true
                            docker rm ${APP_NAME} 2>/dev/null || true
                            docker pull ${DOCKERHUB_USER}/${APP_NAME}:${APP_VERSION}
                            docker run -d --name ${APP_NAME} --restart unless-stopped -p ${APP_PORT}:3000 -e APP_VERSION=${APP_VERSION} ${DOCKERHUB_USER}/${APP_NAME}:${APP_VERSION}
                        '
                    """
                }
            }
        }

        stage('Verify Deployment') {
            when { branch 'main' }
            steps {
                sshagent(credentials: ['jenkins-deploy-key']) {
                    sh """
                        sleep 10
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER_USER}@${APP_SERVER_IP} 'curl -sf http://localhost:3000/health || exit 1'
                    """
                }
                echo "Deployment verified. App is healthy at version ${APP_VERSION}."
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded. VoyageAI Booking API v${APP_VERSION} is live."
        }
        failure {
            echo "Pipeline failed. Review the stage logs above."
        }
        always {
            echo "Pipeline complete. Build: ${BUILD_NUMBER}"
        }
    }
}
