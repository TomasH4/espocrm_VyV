# seed_data_andres.ps1
# Script para sembrar datos de prueba representativos en EspoCRM para las 5 funcionalidades de Andrés

$baseUrl = "http://localhost:8080/api/v1"
$pair = "andres:andres12345"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)

$headers = @{
    "Authorization" = "Basic $base64"
    "Content-Type"  = "application/json; charset=utf-8"
}

function Post-EspoRecord($entity, $obj) {
    $json = ConvertTo-Json $obj
    $utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    Invoke-RestMethod -Uri "$baseUrl/$entity" -Method Post -Headers $headers -Body $utf8Bytes | Out-Null
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Sembrando datos de prueba en EspoCRM..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Cuentas (Accounts) para F5: Deduplicación
Write-Host "1. Sembrando Cuentas (Accounts)..." -ForegroundColor Yellow
$acc1 = @{
    name         = "Bancolombia S.A.S."
    type         = "Customer"
    website      = "https://www.bancolombia.com"
    emailAddress = "contacto@bancolombia.com.co"
    sicCode      = "NIT-890903938-1"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/Account" -Method Post -Headers $headers -Body $acc1 | Out-Null

$acc2 = @{
    name         = "Bancolombia S.A."
    type         = "Customer"
    website      = "https://bancolombia.com"
    emailAddress = "soporte@bancolombia.com"
    sicCode      = "NIT-890903938-1"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/Account" -Method Post -Headers $headers -Body $acc2 | Out-Null

$acc3 = @{
    name         = "Grupo Nutresa Corp"
    type         = "Customer"
    website      = "https://gruponutresa.com"
    emailAddress = "info@nutresa.com"
    sicCode      = "NIT-890900050-1"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/Account" -Method Post -Headers $headers -Body $acc3 | Out-Null

# 2. Casos (Cases) para F1 y F2: Ciclo de Vida y SLA
Write-Host "2. Sembrando Casos (Cases)..." -ForegroundColor Yellow
Post-EspoRecord "Case" @{
    name        = "Fallo critico en pasarela de pagos"
    priority    = "Urgent"
    status      = "New"
    description = "Clientes reportan error 500 al pagar con tarjeta de credito en portal transaccional."
}

Post-EspoRecord "Case" @{
    name           = "Lentitud en generacion de reportes mensuales"
    priority       = "High"
    status         = "Assigned"
    assignedUserId = "62c52bf3add0f226f"
    description    = "Los reportes financieros demoran mas de 10 minutos en exportar."
}

Post-EspoRecord "Case" @{
    name           = "Consulta sobre integracion de API"
    priority       = "Normal"
    status         = "New"
    description    = "Caso nuevo para validar transiciones y ciclo de vida SLA."
}

# 3. Oportunidades (Opportunities) para F3: Cotizaciones y Descuentos
Write-Host "3. Sembrando Oportunidades comerciales..." -ForegroundColor Yellow
Post-EspoRecord "Opportunity" @{
    name           = "Contrato Servidores Cloud Tier 4"
    amount         = 25000.00
    amountCurrency = "USD"
    stage          = "Prospecting"
    closeDate      = "2026-12-31"
    probability    = 20
}

Post-EspoRecord "Opportunity" @{
    name           = "Licencias Software Enterprise Tier 3"
    amount         = 12000.00
    amountCurrency = "USD"
    stage          = "Prospecting"
    closeDate      = "2026-11-30"
    probability    = 50
}

Post-EspoRecord "Opportunity" @{
    name           = "Soporte Anual Pyme Tier 2"
    amount         = 4500.00
    amountCurrency = "USD"
    stage          = "Prospecting"
    closeDate      = "2026-12-15"
    probability    = 70
}

# 4. Tareas (Tasks) para F4: Tareas Vencidas y Escalado
Write-Host "4. Sembrando Tareas (Tasks)..." -ForegroundColor Yellow
Post-EspoRecord "Task" @{
    name           = "Revisar certificados SSL vencidos"
    priority       = "Urgent"
    status         = "Not Started"
    assignedUserId = "62c52bf3add0f226f"
    dateEnd        = "2026-11-10 18:00:00"
    description    = "Certificados vencieron hace 5 dias. Requiere escalado a infraestructura."
}

Post-EspoRecord "Task" @{
    name           = "Auditar logs de seguridad de base de datos"
    priority       = "High"
    status         = "Started"
    assignedUserId = "62c52bf3add0f226f"
    dateEnd        = "2026-11-12 12:00:00"
    description    = "Tarea vencida hace 3 dias. Requiere atencion de lider funcional."
}

Post-EspoRecord "Task" @{
    name           = "Actualizar documentacion del plan de pruebas"
    priority       = "Normal"
    status         = "Completed"
    assignedUserId = "62c52bf3add0f226f"
    dateEnd        = "2026-11-14 20:00:00"
    description    = "Tarea completada en tiempo y forma."
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host " ✔ DATOS SEMBRADOS EXITOSAMENTE EN ESPOCRM" -ForegroundColor Green
Write-Host " Abre http://localhost:8080 para verlos en la UI:" -ForegroundColor Green
Write-Host "   - Casos:         http://localhost:8080/#Case" -ForegroundColor White
Write-Host "   - Tareas:        http://localhost:8080/#Task" -ForegroundColor White
Write-Host "   - Oportunidades: http://localhost:8080/#Opportunity" -ForegroundColor White
Write-Host "   - Cuentas:       http://localhost:8080/#Account" -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Green
