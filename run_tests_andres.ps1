param(
    [string]$Feature = "all",
    [switch]$BlackBox,
    [switch]$WhiteBox,
    [switch]$All,
    [switch]$Coverage
)

$features = @{
    "F1" = @{
        "Name"   = "F1: Validacion de Transicion de Estados de Casos (TDD / Caja Blanca)"
        "Test"   = "tests/unit/Espo/VyV/Andres/tdd-unit-automatizadas/CaseStatusTransitionValidatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/CaseStatus"
    }
    "F2" = @{
        "Name"   = "F2: Calculo de SLA y Tiempo Limite de Atencion (TDD / Caja Blanca)"
        "Test"   = "tests/unit/Espo/VyV/Andres/tdd-unit-automatizadas/CaseSlaCalculatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/CaseSla"
    }
    "F3" = @{
        "Name"   = "F3: Calculo de Descuentos Escalonados en Cotizaciones (TDD / Caja Blanca)"
        "Test"   = "tests/unit/Espo/VyV/Andres/tdd-unit-automatizadas/QuoteDiscountCalculatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/QuoteDiscount"
    }
    "F4" = @{
        "Name"   = "F4: Evaluacion y Escalado de Tareas Vencidas (TDD / Caja Blanca)"
        "Test"   = "tests/unit/Espo/VyV/Andres/tdd-unit-automatizadas/TaskOverdueEvaluatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/TaskOverdue"
    }
    "F5" = @{
        "Name"   = "F5: Deteccion de Empresas Duplicadas (TDD / Caja Blanca)"
        "Test"   = "tests/unit/Espo/VyV/Andres/tdd-unit-automatizadas/AccountDuplicateDetectorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/AccountDeduplication"
    }
}

$covFlags = if ($Coverage) { "--coverage-text" } else { "--no-coverage" }

if ($BlackBox) {
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando Pruebas de CAJA NEGRA (Matriz Formal CP-CN-01 a 32)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/BlackBox/BlackBoxAndresTest.php $covFlags --colors=always"
    exit
}

if ($All) {
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando TODAS las pruebas (Caja Blanca + Caja Negra: 83 tests)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/ $covFlags --colors=always"
    exit
}

$key = $Feature.ToUpper()

if ($key -eq "ALL" -or [string]::IsNullOrWhiteSpace($Feature) -or $WhiteBox) {
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando Suite TDD / Caja Blanca (tdd-unit-automatizadas)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/tdd-unit-automatizadas/ $covFlags --colors=always"
}
elseif ($features.ContainsKey($key)) {
    $target = $features[$key]
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando $($target.Name)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit $($target.Test) $covFlags --colors=always"
}
else {
    Write-Host "Opcion no valida: '$Feature'" -ForegroundColor Red
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\run_tests_andres.ps1              (Caja Blanca: 51 tests de caminos McCabe)"
    Write-Host "  .\run_tests_andres.ps1 -BlackBox    (Caja Negra: 32 tests de particiones y limites)"
    Write-Host "  .\run_tests_andres.ps1 -All         (Todas: 83 tests consolidados)"
    Write-Host "  .\run_tests_andres.ps1 F1           (Solo F1: Transicion de Estados)"
    Write-Host "  .\run_tests_andres.ps1 F2           (Solo F2: Calculo de SLA)"
    Write-Host "  .\run_tests_andres.ps1 F3           (Solo F3: Descuentos en Cotizaciones)"
    Write-Host "  .\run_tests_andres.ps1 F4           (Solo F4: Evaluacion de Tareas)"
    Write-Host "  .\run_tests_andres.ps1 F5           (Solo F5: Deteccion de Duplicados)"
}
