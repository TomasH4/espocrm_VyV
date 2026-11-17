pipeline {
    agent any

    environment {
        // En Jenkins configurar Credential tipo 'Secret Text' con ID 'sonar-token'
        SONAR_TOKEN    = credentials('sonar-token')
        SONAR_HOST_URL = 'http://sonarqube:9000'
    }

    stages {
        stage('1. Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('2. Preparar Entorno Docker') {
            steps {
                // Asegura que los contenedores estén activos (sin conflicto con sonarqube)
                sh 'docker compose up -d mysql espocrm espocrm-daemon || docker-compose up -d mysql espocrm espocrm-daemon || true'
                echo 'Sincronizando archivos del repositorio en el contenedor espocrm...'
                sh '''
                    docker cp application/Espo/Tools/Currency espocrm:/var/www/html/application/Espo/Tools/ || true
                    docker cp application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup espocrm:/var/www/html/application/Espo/Core/Formula/Functions/ExtGroup/ || true
                    docker cp application/Espo/VyV espocrm:/var/www/html/application/Espo/ || true
                    docker cp tests espocrm:/var/www/html/ || true
                    docker cp phpunit.xml espocrm:/var/www/html/phpunit.xml || true
                '''
                echo 'Esperando que los contenedores estén listos...'
                sh 'sleep 5'
            }
        }

        stage('3. Ejecución de Pruebas Unitarias y Cobertura (PHPUnit)') {
            steps {
                // Ejecuta la suite de pruebas unitarias generando el reporte de cobertura Clover y JUnit
                sh '''
                    docker exec espocrm sh -c "rm -rf /var/www/html/coverage && mkdir -p /var/www/html/coverage && phpunit tests/unit/Espo/VyV/ --coverage-clover coverage/phpunit-coverage.xml --log-junit coverage/phpunit-junit.xml"
                    rm -rf ./coverage
                    docker cp espocrm:/var/www/html/coverage ./coverage
                '''
            }
            post {
                always {
                    junit testResults: 'coverage/phpunit-junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('3b. Módulo CUR: aritmética sin bcmath (PHPUnit)') {
            steps {
                // La suite anterior ya incluye tests/unit/Espo/VyV/Currency (con bcmath). Estas pruebas recorren las
                // ramas de CalculatorUtil sin bcmath: PHP sin php.ini (-n) no carga la extensión.
                sh '''
                    docker exec espocrm sh -c "cd /var/www/html && php -n /usr/local/bin/phpunit tests/unit/Espo/VyV/Currency/CalculatorUtilSinBcmathTest.php --no-coverage --log-junit coverage/phpunit-cur-sin-bcmath.xml"
                    docker cp espocrm:/var/www/html/coverage/phpunit-cur-sin-bcmath.xml ./coverage/phpunit-cur-sin-bcmath.xml
                '''
            }
            post {
                always {
                    junit testResults: 'coverage/phpunit-cur-sin-bcmath.xml', allowEmptyResults: true
                }
            }
        }

        stage('4. Ejecución de Pruebas End-to-End (Cypress)') {
            steps {
                sh '''
                    npm ci --prefer-offline || npm install --legacy-peer-deps || true
                    npx cypress run || npm run cypress:run || true
                '''
            }
            post {
                always {
                    junit testResults: 'cypress/reports/junit-*.xml', allowEmptyResults: true
                }
            }
        }

        stage('5. Análisis de Código y Cobertura con SonarQube') {
            steps {
                // Ejecuta sonar-scanner mediante contenedor conectado a la red docker y volumen de Jenkins
                // La red se toma del contenedor espocrm: su nombre depende de la carpeta del proyecto
                // (p. ej. espocrm_vyv_default), así que no se escribe fijo.
                sh '''
                    RED=$(docker inspect espocrm -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')
                    docker run --rm \
                      --network "$RED" \
                      --volumes-from jenkins \
                      -w "$PWD" \
                      -e SONAR_HOST_URL="$SONAR_HOST_URL" \
                      -e SONAR_TOKEN="$SONAR_TOKEN" \
                      sonarsource/sonar-scanner-cli:latest
                '''
            }
        }

        stage('6. Verificación de Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    // El pipeline falla si el Quality Gate no está en OK (antes solo imprimía el estado).
                    sh '''
                        echo "Verificando Quality Gate en SonarQube..."
                        RESPUESTA=$(curl -s -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/qualitygates/project_status?projectKey=espocrm_VyV")
                        echo "$RESPUESTA"
                        ESTADO=$(echo "$RESPUESTA" | sed -n 's/.*"projectStatus":{"status":"\\([A-Z_]*\\)".*/\\1/p')
                        echo "Quality Gate: ${ESTADO:-desconocido}"
                        [ "$ESTADO" = "OK" ]
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
        success {
            echo ' Pipeline ejecutado exitosamente. Cobertura y Quality Gate verificados en SonarQube.'
        }
        failure {
            echo ' El pipeline falló. Revisa los logs de pruebas o el estado del Quality Gate en SonarQube.'
        }
    }
}

