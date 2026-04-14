pipeline {
    agent none

    environment {
        DOCKER_HUB_USER = "jayaprathap96"
        DOCKER_CREDS    = "Dockerhub"
        KUBE_CREDS      = "kube-config"
        SONAR_SERVER    = "sonar-token"
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        BACKEND_IMG     = "${DOCKER_HUB_USER}/ticketflow-backend:${IMAGE_TAG}"
        FRONTEND_IMG    = "${DOCKER_HUB_USER}/ticketflow-frontend:${IMAGE_TAG}"
        K8S_NS          = "ticketflow"
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: "10"))
        timeout(time: 45, unit: "MINUTES")
        disableConcurrentBuilds()
    }

    stages {

        // ── STAGE 1: CHECKOUT ─────────────────────────────────────────
        stage("1 — Checkout") {
            agent any
            steps {
                echo "Checking out source from SCM..."
                checkout scm
                sh "git log -1 --pretty=format:'%H %s' || true"
            }
        }

        // ── STAGE 2: BUILD APPLICATION ────────────────────────────────
        stage("2 — Build Application") {
            agent any
            steps {
                echo "Installing dependencies..."
                dir("backend") {
                    sh "npm ci"
                }
            }
        }

        // ── STAGE 3: UNIT TESTS ───────────────────────────────────────
        stage("3 — Unit Tests") {
            agent any
            steps {
                echo "Running unit tests..."
                dir("backend") {
                    sh "npm run test:unit"
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                           testResults: "backend/junit-unit.xml"
                }
            }
        }

        // ── STAGE 4: INTEGRATION TESTS ────────────────────────────────
        stage("4 — Integration Tests") {
            agent any
            steps {
                echo "Running integration tests..."
                dir("backend") {
                    sh "npm run test:integration"
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                           testResults: "backend/junit-integration.xml"
                }
            }
        }

        // ── STAGE 5: SONARQUBE ANALYSIS (Dynamic Agent) ───────────────
        stage("5 — SonarQube Analysis") {
            agent {
                kubernetes {
                    label "sonarqube-agent"
                    defaultContainer "sonar-scanner"
                    yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: sonar-scanner
      image: sonarsource/sonar-scanner-cli:latest
      command:
        - cat
      tty: true
"""
                }
            }
            steps {
                echo "Running SonarQube analysis..."
                container('sonar-scanner') {
                    withSonarQubeEnv("${SONAR_SERVER}") {
                        sh """
                            sonar-scanner \
                              -Dsonar.projectKey=ticketflow-backend \
                              -Dsonar.sources=backend \
                              -Dsonar.exclusions=**/node_modules/**,**/tests/** \
                              -Dsonar.tests=backend/tests \
                              -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info
                        """
                    }
                }
            }
        }

        // ── STAGE 6: QUALITY GATE ─────────────────────────────────────
        stage("6 — Quality Gate") {
            agent any
            steps {
                echo "Waiting for SonarQube Quality Gate result..."
                timeout(time: 5, unit: "MINUTES") {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── STAGE 7: BUILD DOCKER IMAGES ──────────────────────────────
        stage("7 — Build Docker Images") {
            agent any
            parallel {
                stage("Backend Image") {
                    steps {
                        dir("backend") {
                            sh "docker build -t ${BACKEND_IMG} ."
                        }
                    }
                }
                stage("Frontend Image") {
                    steps {
                        dir("frontend") {
                            sh "docker build -t ${FRONTEND_IMG} ."
                        }
                    }
                }
            }
        }

        // ── STAGE 8: TRIVY IMAGE SCAN (Dynamic Agent) ─────────────────
        stage("8 — Trivy Image Scan") {
            agent {
                kubernetes {
                    label "trivy-agent"
                    defaultContainer "trivy"
                    yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: trivy
      image: aquasec/trivy:latest
      command:
        - cat
      tty: true
"""
                }
            }
            steps {
                echo "Scanning Docker images with Trivy..."
                container('trivy') {
                    sh """
                        trivy image \
                          --exit-code 1 \
                          --severity CRITICAL,HIGH \
                          --ignore-unfixed \
                          --no-progress \
                          --format table \
                          --output trivy-backend.txt \
                          ${BACKEND_IMG}

                        trivy image \
                          --exit-code 1 \
                          --severity CRITICAL,HIGH \
                          --ignore-unfixed \
                          --no-progress \
                          --format table \
                          --output trivy-frontend.txt \
                          ${FRONTEND_IMG}
                    """
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: "trivy-*.txt",
                                     allowEmptyArchive: true
                }
            }
        }

        // ── STAGE 9: PUSH TO DOCKER HUB ───────────────────────────────
        stage("9 — Push to Docker Hub") {
            agent any
            steps {
                echo "Pushing images to Docker Hub..."
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDS}",
                    usernameVariable: "DH_USER",
                    passwordVariable: "DH_PASS"
                )]) {
                    sh """
                        echo ${DH_PASS} | docker login -u ${DH_USER} --password-stdin

                        docker push ${BACKEND_IMG}
                        docker push ${FRONTEND_IMG}

                        docker tag ${BACKEND_IMG} ${DOCKER_HUB_USER}/ticketflow-backend:latest
                        docker tag ${FRONTEND_IMG} ${DOCKER_HUB_USER}/ticketflow-frontend:latest

                        docker push ${DOCKER_HUB_USER}/ticketflow-backend:latest
                        docker push ${DOCKER_HUB_USER}/ticketflow-frontend:latest
                    """
                }
            }
        }

        // ── STAGE 10: DEPLOY TO KUBERNETES ────────────────────────────
        stage("10 — Deploy to Kubernetes") {
            agent any
            steps {
                echo "Deploying to Kubernetes..."
                withCredentials([file(
                    credentialsId: "${KUBE_CREDS}",
                    variable: "KUBECONFIG"
                )]) {
                    sh """
                        kubectl apply -f k8s/

                        kubectl set image deployment/backend \
                            backend=${BACKEND_IMG} -n ${K8S_NS}

                        kubectl set image deployment/frontend \
                            frontend=${FRONTEND_IMG} -n ${K8S_NS}

                        kubectl annotate deployment/backend deployment/frontend \
                            kubernetes.io/change-cause="Build #${BUILD_NUMBER}" \
                            -n ${K8S_NS} --overwrite
                    """
                }
            }
        }

        // ── STAGE 11: VERIFY ROLLOUT ──────────────────────────────────
        stage("11 — Verify Rollout") {
            agent any
            steps {
                echo "Verifying rollout..."
                withCredentials([file(
                    credentialsId: "${KUBE_CREDS}",
                    variable: "KUBECONFIG"
                )]) {
                    sh """
                        kubectl rollout status deployment/backend \
                            -n ${K8S_NS} --timeout=120s

                        kubectl rollout status deployment/frontend \
                            -n ${K8S_NS} --timeout=120s

                        kubectl get pods -n ${K8S_NS}
                    """
                }
            }
        }
    }

    // ── POST ACTIONS ─────────────────────────────────────────────────
    post {
        failure {
            echo "Pipeline FAILED — initiating rollback..."
            withCredentials([file(
                credentialsId: "${KUBE_CREDS}",
                variable: "KUBECONFIG"
            )]) {
                sh """
                    kubectl rollout undo deployment/backend -n ${K8S_NS} || true
                    kubectl rollout undo deployment/frontend -n ${K8S_NS} || true
                """
            }
        }
        success {
            echo "Pipeline SUCCEEDED — TicketFlow deployed successfully."
        }
        always {
            sh "docker logout || true"
            cleanWs()
        }
    }
}