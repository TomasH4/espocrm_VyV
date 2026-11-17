param(
    [switch]$Unit,
    [switch]$E2E,
    [switch]$All
)

$runUnit = $Unit -or $All
$runE2E = $E2E -or $All -or (-not $Unit -and -not $All)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SUITE DE PRUEBAS DE REGRESION AUTOMATIZADAS - ANDRES BEDOYA" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

if ($runUnit) {
    Write-Host "`n>>> [1/2] Ejecutando Regresion Unitaria en PHPUnit (Docker)..." -ForegroundColor Yellow
    docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/ --no-coverage --colors=always"
}

if ($runE2E) {
    Write-Host "`n>>> [2/2] Ejecutando Regresion E2E con Cypress (5 Funcionalidades)..." -ForegroundColor Yellow
    npx cypress run --spec "cypress/e2e/andres/regression/regression_andres.cy.js"
}

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host " Ejecucion de Pruebas de Regresion completada con exito." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
