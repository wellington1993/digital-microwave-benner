FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY Microwave.sln .
COPY src/Microwave.Domain/*.csproj src/Microwave.Domain/
COPY src/Microwave.Application/*.csproj src/Microwave.Application/
COPY src/Microwave.Infrastructure/*.csproj src/Microwave.Infrastructure/
COPY src/Microwave.Api/*.csproj src/Microwave.Api/

RUN dotnet restore

COPY . .
WORKDIR /app/src/Microwave.Api
RUN dotnet publish -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .
EXPOSE 80
ENTRYPOINT ["dotnet", "Microwave.Api.dll"]
