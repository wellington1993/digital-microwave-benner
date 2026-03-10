$ErrorActionPreference = "Stop"

function Install-Tools {
    Write-Host "Verificando dependencias de ambiente..."
    
    # .NET 8 SDK
    try {
        $dotnet = dotnet --version
        if ($dotnet -notlike "8.*") { throw }
        Write-Host ".NET 8 encontrado: $dotnet"
    } catch {
        Write-Host "Instalando .NET 8 SDK..."
        Invoke-WebRequest -Uri "https://dot.net/v1/dotnet-install.ps1" -OutFile "dotnet-install.ps1"
        & ./dotnet-install.ps1 -Channel 8.0 -InstallDir "$env:ProgramFiles\dotnet" -Runtime dotnet
    }

    # Node.js
    try {
        $node = node -v
        Write-Host "Node.js encontrado: $node"
    } catch {
        Write-Host "Node.js nao encontrado. Por favor, instale via winget ou site oficial."
    }
}

Install-Tools
