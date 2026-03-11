# Como Executar - Microwave Backend

## O que você precisa

- .NET 8 SDK
- Terminal (PowerShell, CMD, etc)
- Git (pra clonar)

---

## Setup Básico

Clone o repositório:
```bash
git clone https://github.com/wellington1993/digital-microwave-benner.git
cd digital-microwave-benner/backend
```

Restaura as dependências:
```bash
dotnet restore
```

---

## Rodando a API

Mais simples:
```bash
dotnet run --project src/Microwave.Api --urls "http://localhost:5000"
```

Você vai ver algo como:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
```

Pronto, tá rodando em `http://localhost:5000`.

---

## Testando

Acessa `http://localhost:5000/swagger` pra ver todos os endpoints no Swagger UI.

### Login via cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Retorna um token. Copia esse token.

### Ver status:
```bash
curl -X GET http://localhost:5000/api/microwave/status \
  -H "Authorization: Bearer {seu_token_aqui}"
```

### Iniciar aquecimento:
```bash
curl -X POST http://localhost:5000/api/microwave/start \
  -H "Authorization: Bearer {seu_token_aqui}" \
  -H "Content-Type: application/json" \
  -d '{
    "durationSeconds": 30,
    "power": 10,
    "heatingChar": ".",
    "isPredefined": false
  }'
```

### Stream em tempo real:
```bash
curl -X GET http://localhost:5000/api/microwave/stream \
  -H "Authorization: Bearer {seu_token_aqui}" \
  -N
```

Fica atualizando a cada segundo enquanto o micro tá aquecendo.

---

## Rodar os Testes

```bash
dotnet test backend/Microwave.sln
```

Roda todos os testes. Se quiser só os de autenticação:
```bash
dotnet test backend/src/Microwave.Api.Tests/Microwave.Api.Tests.csproj -k AuthTests
```

---

## Parar a API

Só apertar Ctrl+C no terminal.

---

## Problemas Comuns

**"dotnet não foi encontrado"**
Instala o .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0

**"Porta 5000 já está em uso"**
Usa outra porta:
```bash
dotnet run --project src/Microwave.Api --urls "http://localhost:5001"
```

**"JWT validation failed"**
Verifica se o token tá sendo passado certo no header Authorization.

**Testes falhando**
Limpa e restaura:
```bash
dotnet clean
dotnet restore
dotnet test
```



