param(
    [string]$Feature = "all",
    [switch]$Coverage
)

$features = @{
    "F1" = @{
        "Name"   = "F1: Validacion de Transicion de Estados de Casos"
        "Test"   = "tests/unit/Espo/VyV/Andres/CaseStatusTransitionValidatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/CaseStatus"
    }
    "F2" = @{
        "Name"   = "F2: Calculo de SLA y Tiempo Limite de Atencion"
        "Test"   = "tests/unit/Espo/VyV/Andres/CaseSlaCalculatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/CaseSla"
    }
    "F3" = @{
        "Name"   = "F3: Calculo de Descuentos Escalonados en Cotizaciones"
        "Test"   = "tests/unit/Espo/VyV/Andres/QuoteDiscountCalculatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/QuoteDiscount"
    }
    "F4" = @{
        "Name"   = "F4: Evaluacion y Escalado de Tareas Vencidas"
        "Test"   = "tests/unit/Espo/VyV/Andres/TaskOverdueEvaluatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/TaskOverdue"
    }
    "F5" = @{
        "Name"   = "F5: Deteccion de Empresas Duplicadas"
        "Test"   = "tests/unit/Espo/VyV/Andres/AccountDuplicateDetectorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/AccountDeduplication"
    }
}

$covFlags = if ($Coverage) { "--coverage-text" } else { "--no-coverage" }

$key = $Feature.ToUpper()

if ($key -eq "ALL" -or [string]::IsNullOrWhiteSpace($Feature)) {
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando TODAS las pruebas unitarias TDD de Andres (F1 a F5)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/ $covFlags --colors=always"
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
    Write-Host "  .\run_tests_andres.ps1              (Ejecuta las 5 funcionalidades en modo rapido)"
    Write-Host "  .\run_tests_andres.ps1 -Coverage    (Ejecuta las 5 funcionalidades con reporte de cobertura)"
    Write-Host "  .\run_tests_andres.ps1 F1           (Solo F1: Transicion de Estados)"
    Write-Host "  .\run_tests_andres.ps1 F2           (Solo F2: Calculo de SLA)"
    Write-Host "  .\run_tests_andres.ps1 F3           (Solo F3: Descuentos en Cotizaciones)"
    Write-Host "  .\run_tests_andres.ps1 F4           (Solo F4: Evaluacion de Tareas)"
    Write-Host "  .\run_tests_andres.ps1 F5           (Solo F5: Deteccion de Duplicados)"
}
