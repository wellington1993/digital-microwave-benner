$ErrorActionPreference = "Stop"

function Install-DotNet {
    Write-Host "Verificando .NET 8 SDK..." -ForegroundColor Cyan
    try {
        $version = dotnet --version
        if ($version -like "8.*") {
            Write-Host ".NET 8 já está instalado ($version)." -ForegroundColor Green
            return
        }
    } catch {}

    Write-Host "Baixando instalador do .NET 8..." -ForegroundColor Yellow
    $url = "https://dotnet.microsoft.com/download/dotnet/scripts/v1/dotnet-install.ps1"
    $scriptPath = Join-Path $env:TEMP "dotnet-install.ps1"
    Invoke-WebRequest -Uri $url -OutFile $scriptPath

    Write-Host "Iniciando instalação silenciosa..." -ForegroundColor Yellow
    & $scriptPath -Channel 8.0 -InstallDir "$env:ProgramFiles\dotnet" -Runtime dotnet
    Write-Host ".NET 8 instalado com sucesso." -ForegroundColor Green
}

Install-DotNet
