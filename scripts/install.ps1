#Requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$DOTNET_CHANNEL = "8.0"
$INSTALL_DIR    = Join-Path $env:LOCALAPPDATA "Microsoft\dotnet"

Write-Host "Verificando instalação do .NET $DOTNET_CHANNEL SDK..." -ForegroundColor Cyan

$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if ($dotnetCmd) {
    $installedVersion = (& dotnet --version 2>$null) -replace '\s',''
    $major = [int]($installedVersion.Split('.')[0])
    if ($major -ge 8) {
        Write-Host ".NET SDK já instalado: $installedVersion" -ForegroundColor Green
        exit 0
    }
}

$scriptUrl  = "https://dot.net/v1/dotnet-install.ps1"
$scriptPath = Join-Path $env:TEMP "dotnet-install.ps1"

Write-Host "Baixando script de instalação do .NET..." -ForegroundColor Cyan
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath -UseBasicParsing

Write-Host "Instalando .NET $DOTNET_CHANNEL SDK silenciosamente em $INSTALL_DIR..." -ForegroundColor Cyan
& $scriptPath -Channel $DOTNET_CHANNEL -InstallDir $INSTALL_DIR -NoPath

$envPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($envPath -notlike "*$INSTALL_DIR*") {
    [System.Environment]::SetEnvironmentVariable(
        "PATH",
        "$INSTALL_DIR;$envPath",
        "User"
    )
    $env:PATH = "$INSTALL_DIR;$env:PATH"
}

[System.Environment]::SetEnvironmentVariable("DOTNET_ROOT", $INSTALL_DIR, "User")
$env:DOTNET_ROOT = $INSTALL_DIR

$installed = & "$INSTALL_DIR\dotnet.exe" --version 2>$null
Write-Host ".NET $installed instalado com sucesso." -ForegroundColor Green
Remove-Item $scriptPath -Force -ErrorAction SilentlyContinue
