$ErrorActionPreference = "Stop"

Write-Host "--- Iniciando Setup do Monorepo ---" -ForegroundColor Cyan

# 1. Estrutura Base
$backendDir = "backend"
$frontendDir = "frontend"

if (!(Test-Path $backendDir)) {
    Write-Host "Criando pasta backend e migrando codigo .NET..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backendDir | Out-Null
    
    # Migrando arquivos da raiz para o backend, exceto .git e scripts de raiz
    $itemsToMove = @("src", "docs", "Microwave.sln", "Dockerfile")
    foreach ($item in $itemsToMove) {
        if (Test-Path $item) {
            Move-Item -Path $item -Destination $backendDir\
        }
    }
    Write-Host "Back-end migrado com sucesso." -ForegroundColor Green
} else {
    Write-Host "Pasta backend ja existe. Pulando migracao." -ForegroundColor DarkGray
}

# 2. Setup do Frontend (React + TS + Vite)
if (!(Test-Path $frontendDir)) {
    Write-Host "Scaffolding do Frontend (Vite + React + TS)..." -ForegroundColor Yellow
    # Usando call operator com npm para evitar problemas de proxy/path no powershell
    & npm.cmd create vite@latest $frontendDir -- --template react-ts
    
    Write-Host "Instalando dependencias base e TailwindCSS..." -ForegroundColor Yellow
    Set-Location $frontendDir
    & npm.cmd install
    & npm.cmd install -D tailwindcss postcss autoprefixer
    & npx.cmd tailwindcss init -p
    
    Set-Location ..
    Write-Host "Front-end criado com sucesso." -ForegroundColor Green
} else {
    Write-Host "Pasta frontend ja existe. Pulando scaffolding." -ForegroundColor DarkGray
}

Write-Host "--- Setup do Monorepo Concluido ---" -ForegroundColor Cyan
