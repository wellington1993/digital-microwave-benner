$baseUrl = "http://localhost:5000/api"

Write-Host "--- Teste de Conectividade Microwave ---" -ForegroundColor Cyan

# 1. Teste Online
Write-Host "`n[CENARIO ONLINE] Verificando Backend..." -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/microwave/status" -Method Get -TimeoutSec 5
    Write-Host "SUCESSO: Backend respondendo na porta 5000." -ForegroundColor Green
    Write-Host "Estado atual: $($res.state)"
} catch {
    Write-Host "FALHA: Backend nao encontrado. Verifique se o processo 'dotnet' esta rodando." -ForegroundColor Red
}

# 2. Teste Offline (Simulacao)
Write-Host "`n[CENARIO OFFLINE] Como testar manualmente:" -ForegroundColor Yellow
Write-Host "1. Abra o navegador em http://localhost:5173 (Frontend)"
Write-Host "2. No terminal, pare o backend (pode usar 'Stop-Process -Name dotnet')"
Write-Host "3. No Frontend, tente clicar em START."
Write-Host "4. O banner laranja 'SERVIDOR INDISPONÍVEL' deve aparecer instantaneamente." -ForegroundColor Gray

Write-Host "`n--- Fim do Teste ---" -ForegroundColor Cyan
