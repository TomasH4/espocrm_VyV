param(
    [string]$Feature = "all"
)

$features = @{
    "F1" = @{
        "Name"   = "F1: Creacion de Lead (Lead Creation)"
        "Test"   = "tests/unit/Espo/VyV/Lead/LeadCreatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/Lead"
    }
    "F2" = @{
        "Name"   = "F2: Calculo de Probabilidad en Oportunidades (Opportunity Probability)"
        "Test"   = "tests/unit/Espo/VyV/Opportunity/OpportunityProbabilityCalculatorTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/Opportunity"
    }
    "F3" = @{
        "Name"   = "F3: Busqueda y Filtrado de Contactos (Contact Search)"
        "Test"   = "tests/unit/Espo/VyV/Contact/ContactSearcherTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/Contact"
    }
    "F4" = @{
        "Name"   = "F4: Validacion Temporal en Reuniones (Meeting Scheduling)"
        "Test"   = "tests/unit/Espo/VyV/Meeting/MeetingSchedulerTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/Meeting"
    }
    "F5" = @{
        "Name"   = "F5: Conversion Transaccional de Lead (Lead Conversion)"
        "Test"   = "tests/unit/Espo/VyV/LeadConversion/LeadConverterTest.php"
        "Filter" = "/var/www/html/application/Espo/VyV/LeadConversion"
    }
}

$key = $Feature.ToUpper()

if ($key -eq "ALL" -or [string]::IsNullOrWhiteSpace($Feature)) {
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando TODAS las pruebas unitarias TDD de VyV (F1 a F5)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/ --coverage-text --coverage-filter /var/www/html/application/Espo/VyV/ --colors=always"
}
elseif ($features.ContainsKey($key)) {
    $target = $features[$key]
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " Ejecutando $($target.Name)" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    docker exec espocrm bash -c "cd /var/www/html && phpunit $($target.Test) --coverage-text --coverage-filter $($target.Filter) --colors=always"
}
else {
    Write-Host "Opcion no valida: '$Feature'" -ForegroundColor Red
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\run_tests.ps1      (Ejecuta las 5 funcionalidades)"
    Write-Host "  .\run_tests.ps1 F1   (Solo F1: Creacion de Lead)"
    Write-Host "  .\run_tests.ps1 F2   (Solo F2: Calculo de Probabilidad)"
    Write-Host "  .\run_tests.ps1 F3   (Solo F3: Busqueda de Contactos)"
    Write-Host "  .\run_tests.ps1 F4   (Solo F4: Agendamiento de Reuniones)"
    Write-Host "  .\run_tests.ps1 F5   (Solo F5: Conversion de Lead)"
}
