$baseUrl = "http://localhost:5000/api"
$env:ASPNETCORE_URLS = "http://localhost:5000"

Write-Host "Iniciando Servidor..."
$apiProcess = Start-Process dotnet -ArgumentList "run --project src/Microwave.Api/Microwave.Api.csproj" -PassThru -NoNewWindow
Start-Sleep -Seconds 15

try {
    Write-Host "Autenticacao"
    $loginData = @{ username = "admin"; password = "admin" } | ConvertTo-Json
    $auth = Invoke-RestMethod -Method Post -Uri "$baseUrl/Auth/login" -ContentType "application/json" -Body $loginData
    $token = $auth.token
    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "Token JWT gerado."

    Write-Host "Iniciando Aquecimento"
    $startData = @{ durationSeconds = 15; power = 10; heatingChar = "." } | ConvertTo-Json
    $status = Invoke-RestMethod -Method Post -Uri "$baseUrl/Microwave/start" -Headers $headers -ContentType "application/json" -Body $startData
    Write-Host "Status: $($status.state) | Tempo: $($status.timeDisplay)"

    Write-Host "Progresso"
    for ($i = 0; $i -lt 5; $i++) {
        $status = Invoke-RestMethod -Method Get -Uri "$baseUrl/Microwave/status" -Headers $headers
        Write-Host "Tempo: $($status.timeDisplay) | Saida: $($status.output)"
        Start-Sleep -Seconds 1
    }

    Write-Host "Programas"
    $programs = Invoke-RestMethod -Method Get -Uri "$baseUrl/Microwave/programs" -Headers $headers
    $programs | Select-Object name, alimento, power, heatingChar | Format-Table

} catch {
    Write-Host "Erro: $($_.Exception.Message)"
} finally {
    Write-Host "Finalizando"
    Stop-Process -Id $apiProcess.Id -Force
}
