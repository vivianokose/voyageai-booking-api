@Library('voyageai-lib') _

pipeline {
    agent any

    environment {
        APP_NAME        = 'voyageai-booking-api'
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

        stage('Compute Version') {
            steps {
                script {
                    def lastTag = sh(
                        script: 'git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0',
                        returnStdout: true
                    ).trim()

                    def parts = lastTag.replaceFirst('v', '').tokenize('.').collect { it.toInteger() }

                    def commitMsg = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()

                    if (commitMsg.startsWith('feat')) {
                        parts[1] = parts[1] + 1
                        parts[2] = 0
                    } else if (commitMsg.startsWith('fix')) {
                        parts[2] = parts[2] + 1
                    } else {
                        parts[2] = parts[2] + 1
                    }

                    env.NEW_VERSION = parts.join('.')
                    echo "Version bump: ${lastTag} -> v${env.NEW_VERSION} (commit: ${commitMsg.take(50)})"
                }
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
                buildAndPushImage(image: env.APP_NAME, tag: env.NEW_VERSION)
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
                            docker pull ${DOCKERHUB_USER}/${APP_NAME}:${NEW_VERSION}
                            docker run -d --name ${APP_NAME} --restart unless-stopped -p ${APP_PORT}:3000 -e APP_VERSION=${NEW_VERSION} ${DOCKERHUB_USER}/${APP_NAME}:${NEW_VERSION}
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
                echo "Deployment verified. App is healthy at version ${NEW_VERSION}."
            }
        }

        stage('Tag Release') {
            when { branch 'main' }
            steps {
                withCredentials([usernamePassword(
                        credentialsId: 'github-token',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_TOKEN')]) {
                    sh '''
                        git config user.email "jenkins@voyageai.com"
                        git config user.name "Jenkins CI"
                        git tag -a v${NEW_VERSION} -m "release v${NEW_VERSION}"
                        git push https://${GIT_USER}:${GIT_TOKEN}@github.com/vivianokose/voyageai-booking-api.git v${NEW_VERSION}
                    '''
                }
                echo "Tagged and pushed release v${NEW_VERSION}"
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded. VoyageAI Booking API v${NEW_VERSION} is live."
        }
        failure {
            echo "Pipeline failed. Review the stage logs above."
        }
        always {
            echo "Pipeline complete. Build: ${BUILD_NUMBER}"
        }
    }
}
