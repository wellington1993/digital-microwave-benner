$root = "C:\Users\PICHAU\Documents\Projetos\Wellington\Microwave"
New-Item -ItemType Directory -Force -Path $root | Out-Null
Set-Location $root

if (!(Test-Path "Microwave.sln")) {
    dotnet new sln -n Microwave
    Write-Host "Solucao criada."
}

$projects = @(
    @{ Name = "Microwave.Domain";          Template = "classlib"; Path = "src\Microwave.Domain" },
    @{ Name = "Microwave.Application";     Template = "classlib"; Path = "src\Microwave.Application" },
    @{ Name = "Microwave.Infrastructure";  Template = "classlib"; Path = "src\Microwave.Infrastructure" },
    @{ Name = "Microwave.Api";             Template = "webapi";   Path = "src\Microwave.Api" }
)

foreach ($p in $projects) {
    $csproj = "$($p.Path)\$($p.Name).csproj"
    if (!(Test-Path $csproj)) {
        if ($p.Template -eq "webapi") {
            dotnet new webapi -n $p.Name -o $p.Path --framework net8.0 --no-openapi 2>&1 | Out-Null
        } else {
            dotnet new classlib -n $p.Name -o $p.Path --framework net8.0 2>&1 | Out-Null
        }
        Write-Host "Projeto $($p.Name) criado."
    }
}

foreach ($p in $projects) {
    $csproj = "$($p.Path)\$($p.Name).csproj"
    dotnet sln add $csproj 2>&1 | Out-Null
}

$refs = @(
    @{ From = "src\Microwave.Application\Microwave.Application.csproj";    To = "src\Microwave.Domain\Microwave.Domain.csproj" },
    @{ From = "src\Microwave.Infrastructure\Microwave.Infrastructure.csproj"; To = "src\Microwave.Domain\Microwave.Domain.csproj" },
    @{ From = "src\Microwave.Infrastructure\Microwave.Infrastructure.csproj"; To = "src\Microwave.Application\Microwave.Application.csproj" },
    @{ From = "src\Microwave.Api\Microwave.Api.csproj";                    To = "src\Microwave.Application\Microwave.Application.csproj" },
    @{ From = "src\Microwave.Api\Microwave.Api.csproj";                    To = "src\Microwave.Infrastructure\Microwave.Infrastructure.csproj" }
)

foreach ($ref in $refs) {
    dotnet add $ref.From reference $ref.To 2>&1 | Out-Null
}

$filesToRemove = @(
    "src\Microwave.Domain\Class1.cs",
    "src\Microwave.Application\Class1.cs",
    "src\Microwave.Infrastructure\Class1.cs",
    "src\Microwave.Api\WeatherForecast.cs"
)
foreach ($f in $filesToRemove) {
    Remove-Item $f -ErrorAction SilentlyContinue
}

$controllerStub = "src\Microwave.Api\Controllers\WeatherForecastController.cs"
Remove-Item $controllerStub -ErrorAction SilentlyContinue

$dirs = @(
    "src\Microwave.Domain\Entities",
    "src\Microwave.Domain\ValueObjects",
    "src\Microwave.Domain\Statics",
    "src\Microwave.Domain\Exceptions",
    "src\Microwave.Application\Services",
    "src\Microwave.Application\DTOs",
    "src\Microwave.Infrastructure\Repositories",
    "src\Microwave.Api\Controllers",
    "src\Microwave.Api\Middleware"
)
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

Write-Host "Setup concluido com sucesso."
