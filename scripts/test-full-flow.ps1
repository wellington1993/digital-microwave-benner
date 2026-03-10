$ErrorActionPreference = "SilentlyContinue"
# Forcando a porta 5000
$env:ASPNETCORE_URLS = "http://localhost:5000"
$baseUrl = "http://localhost:5000/api"

Write-Host "Iniciando API para testes na porta 5000..." -ForegroundColor Cyan
$process = Start-Process dotnet -ArgumentList "run --project src/Microwave.Api/Microwave.Api.csproj" -PassThru -NoNewWindow
Start-Sleep -Seconds 15 # Aguardando o build e startup

try {
    Write-Host "[NIVEL 4] - Autenticacao" -ForegroundColor Yellow
    $loginBody = @{ username = "admin"; password = "admin" } | ConvertTo-Json
    $auth = Invoke-RestMethod -Method Post -Uri "$baseUrl/Auth/login" -ContentType "application/json" -Body $loginBody
    
    if ($auth.token) {
        $token = $auth.token
        $headers = @{ Authorization = "Bearer $token" }
        Write-Host "Token obtido com sucesso: Bearer $($token.Substring(0, 10))..." -ForegroundColor Green

        Write-Host "`n[NIVEL 1] - Iniciando Aquecimento (10s, Potencia 10)" -ForegroundColor Yellow
        $startBody = @{ durationSeconds = 10; power = 10; heatingChar = "." } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$baseUrl/Microwave/start" -Headers $headers -ContentType "application/json" -Body $startBody
        
        Write-Host "Monitorando status visualmente..." -ForegroundColor Cyan
        for ($i = 0; $i -lt 12; $i++) {
            $status = Invoke-RestMethod -Method Get -Uri "$baseUrl/Microwave/status" -Headers $headers
            Write-Host "Tempo: $($status.timeDisplay) | Saida: $($status.output)"
            if ($status.output -like "*concluido*") { break }
            Start-Sleep -Seconds 1
        }

        Write-Host "`n[NIVEL 2] - Listando Programas Pre-definidos" -ForegroundColor Yellow
        $programs = Invoke-RestMethod -Method Get -Uri "$baseUrl/Microwave/programs" -Headers $headers
        $programs | Select-Object name, alimento, durationSeconds, power, heatingChar | Format-Table

        Write-Host "`n[NIVEL 3] - Cadastrando Programa Customizado (Arroz)" -ForegroundColor Yellow
        $customBody = @{ 
            name = "Arroz"; 
            alimento = "Arroz Branco"; 
            durationSeconds = 60; 
            power = 10; 
            heatingChar = "x"; 
            instructions = "Lavar antes de cozinhar." 
        } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$baseUrl/Microwave/programs" -Headers $headers -ContentType "application/json" -Body $customBody
        Write-Host "Programa Arroz cadastrado com sucesso." -ForegroundColor Green
    } else {
        Write-Error "Falha ao obter token."
    }

} catch {
    Write-Error "Erro durante a execucao: $_"
} finally {
    Write-Host "`nFinalizando API..." -ForegroundColor Cyan
    Stop-Process -Id $process.Id -Force
}
