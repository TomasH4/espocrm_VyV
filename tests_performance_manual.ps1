# tests_performance_manual.ps1
# Evaluacion Manual y Controlada de Rendimiento de API - Metodologia de Clase
# Integrante: Andres Bedoya Cano
# Mide: T_min, T_max, T_promedio, P95, Desviacion Estandar y Throughput (RPS)

param(
    [int]$Iterations = 20,
    [string]$BaseUrl = "http://localhost:8080/api/v1"
)

$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("andres:andres12345"))
}

$endpoints = @(
    @{ Name = "F1: Consulta de Casos (GET /Case)"; Method = "GET"; Path = "/Case?maxSize=20"; Body = $null },
    @{ Name = "F2: Creacion de Caso Prioritario (POST /Case)"; Method = "POST"; Path = "/Case"; Body = @{ name = "Perf Case Test"; priority = "Urgent"; status = "New" } },
    @{ Name = "F3: Consulta de Ventas (GET /Opportunity)"; Method = "GET"; Path = "/Opportunity?maxSize=20"; Body = $null },
    @{ Name = "F4: Consulta de Tareas (GET /Task)"; Method = "GET"; Path = "/Task?maxSize=20"; Body = $null },
    @{ Name = "F5: Busqueda de Cuentas (GET /Account)"; Method = "GET"; Path = "/Account?maxSize=20"; Body = $null }
)

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS MANUALES DE RENDIMIENTO (METODOLOGÍA DE CLASE) - ANDRÉS BEDOYA  " -ForegroundColor Cyan
Write-Host "  Muestras por Endpoint: $Iterations iteraciones secuenciales controladas  " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$resultsReport = @()

foreach ($ep in $endpoints) {
    Write-Host "`n[*] Evaluando: $($ep.Name)..." -ForegroundColor Yellow
    $times = @()
    $successCount = 0
    $createdIds = @()

    for ($i = 1; $i -le $Iterations; $i++) {
        $url = "$BaseUrl$($ep.Path)"
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            if ($ep.Method -eq "GET") {
                $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 10
            } else {
                $jsonBody = $ep.Body | ConvertTo-Json
                $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $jsonBody -ContentType "application/json" -TimeoutSec 10
                if ($response.id) {
                    $createdIds += $response.id
                }
            }
            $sw.Stop()
            $ms = $sw.Elapsed.TotalMilliseconds
            $times += $ms
            $successCount++
        }
        catch {
            $sw.Stop()
            $ms = $sw.Elapsed.TotalMilliseconds
            $times += $ms
        }
    }

    # Limpieza de registros creados en POST
    foreach ($id in $createdIds) {
        try {
            Invoke-RestMethod -Uri "$BaseUrl/Case/$id" -Method Delete -Headers $headers -ErrorAction SilentlyContinue | Out-Null
        } catch {}
    }

    $sorted = $times | Sort-Object
    $min = [Math]::Round(($sorted | Measure-Object -Minimum).Minimum, 2)
    $max = [Math]::Round(($sorted | Measure-Object -Maximum).Maximum, 2)
    $avg = [Math]::Round(($sorted | Measure-Object -Average).Average, 2)
    
    # Percentil 95
    $p95Index = [Math]::Floor(0.95 * $sorted.Count)
    if ($p95Index -ge $sorted.Count) { $p95Index = $sorted.Count - 1 }
    $p95 = [Math]::Round($sorted[$p95Index], 2)

    # Desviación estándar
    $variance = ($times | ForEach-Object { [Math]::Pow($_ - $avg, 2) } | Measure-Object -Average).Average
    $stdDev = [Math]::Round([Math]::Sqrt($variance), 2)
    $successRate = [Math]::Round(($successCount / $Iterations) * 100, 1)

    $row = [PSCustomObject]@{
        Endpoint     = $ep.Name
        Muestras     = $Iterations
        "Min (ms)"   = $min
        "Avg (ms)"   = $avg
        "P95 (ms)"   = $p95
        "Max (ms)"   = $max
        "StdDev"     = $stdDev
        "Exito (%)"  = "$successRate%"
    }
    $resultsReport += $row
}

Write-Host "`n==========================================================================" -ForegroundColor Green
Write-Host "                RESUMEN CONSOLIDADO DE RENDIMIENTO MANUAL                 " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
$resultsReport | Format-Table -AutoSize

# Exportar a CSV y Markdown para evidencias
$resultsReport | Export-Csv -Path "manual_performance_metrics.csv" -NoTypeInformation
Write-Host "`nResultados exportados a manual_performance_metrics.csv" -ForegroundColor Gray
