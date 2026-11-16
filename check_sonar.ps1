$token = (Get-Content -Path "$PSScriptRoot\.sonar_token" -Raw).Trim()
$pair = $token + ":"
$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $encoded" }

$url = "http://localhost:9000/api/measures/component?component=espocrm_VyV&metricKeys=alert_status,coverage,bugs,vulnerabilities,code_smells,ncloc,reliability_rating,security_rating,sqale_rating"
$result = Invoke-RestMethod -Uri $url -Headers $headers

Write-Host "================ SonarQube Metricas - espocrm_VyV ================" -ForegroundColor Cyan
Write-Host ("  {0,-20} : {1}" -f "Quality Gate", ($result.component.measures | Where-Object {$_.metric -eq "alert_status"}).value) -ForegroundColor $(if (($result.component.measures | Where-Object {$_.metric -eq "alert_status"}).value -eq "OK") { "Green" } else { "Red" })
Write-Host ("  {0,-20} : {1}%" -f "Cobertura (Coverage)", ($result.component.measures | Where-Object {$_.metric -eq "coverage"}).value) -ForegroundColor Green
Write-Host ("  {0,-20} : {1}" -f "Bugs (Reliability)", ($result.component.measures | Where-Object {$_.metric -eq "bugs"}).value) -ForegroundColor Green
Write-Host ("  {0,-20} : {1}" -f "Vulnerabilidades", ($result.component.measures | Where-Object {$_.metric -eq "vulnerabilities"}).value) -ForegroundColor Green
Write-Host ("  {0,-20} : {1}" -f "Code Smells", ($result.component.measures | Where-Object {$_.metric -eq "code_smells"}).value) -ForegroundColor Yellow
Write-Host ("  {0,-20} : {1}" -f "Lineas (NCLOC)", ($result.component.measures | Where-Object {$_.metric -eq "ncloc"}).value) -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
