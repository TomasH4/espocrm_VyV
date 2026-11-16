$token = (Get-Content -Path "$PSScriptRoot\.sonar_token" -Raw).Trim()
$pair = $token + ":"
$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $encoded" }

$url = "http://localhost:9000/api/measures/component?component=espocrm_VyV&metricKeys=tests,test_success_density,coverage,bugs,vulnerabilities,code_smells,ncloc"
$result = Invoke-RestMethod -Uri $url -Headers $headers

Write-Host "======== SonarQube Metricas - espocrm_VyV ========" -ForegroundColor Cyan
foreach ($m in $result.component.measures) {
    Write-Host "  $($m.metric): $($m.value)" -ForegroundColor Green
}
Write-Host "===================================================" -ForegroundColor Cyan
