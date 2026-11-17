# Script para ejecutar pruebas de cobertura y análisis con SonarQube
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 1. Ejecutando pruebas unitarias y generando cobertura..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/ tests/unit/Espo/VyV/Tomas/ --coverage-clover coverage/phpunit-coverage.xml --log-junit coverage/phpunit-junit.xml"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " 2. Extrayendo reportes de cobertura..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path "$PSScriptRoot\coverage")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot\coverage" -Force | Out-Null
}

docker cp espocrm:/var/www/html/coverage/phpunit-coverage.xml "$PSScriptRoot\coverage\phpunit-coverage.xml"
docker cp espocrm:/var/www/html/coverage/phpunit-junit.xml "$PSScriptRoot\coverage\phpunit-junit.xml"

$token = (Get-Content "$PSScriptRoot\.sonar_token" -Raw).Trim()

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " 3. Ejecutando SonarScanner en Docker..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

docker run --rm `
  --network espo-crm_default `
  -v "${PSScriptRoot}:/usr/src" `
  -e SONAR_HOST_URL="http://sonarqube:9000" `
  -e SONAR_TOKEN="$token" `
  sonarsource/sonar-scanner-cli:latest

Write-Host "`n Analisis completado. Revisa tus resultados en: http://localhost:9000/dashboard?id=espocrm_VyV" -ForegroundColor Green
