$auth = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("admin:admin"))
$headers = @{ Authorization = "Basic $auth" }

# 1. Cambiar clave admin por primera vez
try {
    $res1 = Invoke-RestMethod -Uri "http://localhost:9000/api/users/change_password" -Method Post -Headers $headers -Body @{
        login = "admin"
        previousPassword = "admin"
        password = "admin_password123"
    }
    Write-Output "Password changed successfully"
} catch {
    Write-Output "Password might already be changed: $_"
}

# 2. Nuevos headers
$authNew = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("admin:admin_password123"))
$headersNew = @{ Authorization = "Basic $authNew" }

# 3. Crear proyecto espocrm_VyV
try {
    $proj = Invoke-RestMethod -Uri "http://localhost:9000/api/projects/create" -Method Post -Headers $headersNew -Body @{
        name = "EspoCRM VyV"
        project = "espocrm_VyV"
        mainBranch = "dev"
    }
    Write-Output "Project created: $($proj | ConvertTo-Json)"
} catch {
    Write-Output "Project create info: $_"
}

# 4. Generar Token para el scanner / Jenkins
try {
    $tokenRes = Invoke-RestMethod -Uri "http://localhost:9000/api/user_tokens/generate" -Method Post -Headers $headersNew -Body @{
        name = "jenkins_scanner_token"
        projectKey = "espocrm_VyV"
    }
    Write-Output "TOKEN_GENERATED: $($tokenRes.token)"
    $tokenRes.token | Out-File -FilePath "C:\Users\sqluser\Desktop\VyV\espocrm_VyV\.sonar_token" -Encoding utf8
} catch {
    Write-Output "Token error: $_"
}

