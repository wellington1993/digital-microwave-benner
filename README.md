# microwave-digital-benner

![Build & Test](https://github.com/wellington1993/digital-microwave-benner/actions/workflows/ci.yml/badge.svg)
![Frontend Deploy](https://github.com/wellington1993/digital-microwave-benner/actions/workflows/deploy.yml/badge.svg)

Back-end em .NET 8 e Front-end em React. 

O projeto conta com um sistema de resiliência: se o back-end estiver fora do ar, a interface chaveia automaticamente para uma simulação local para permitir o teste das funções básicas.

## Como rodar

### 1. Back-end (API)
```bash
dotnet run --project backend/src/Microwave.Api --urls "http://localhost:5000"
```

### 2. Front-end (Web)
```bash
cd frontend
npm install
npm run dev
```
Acesse em: `http://localhost:5173`

**Credenciais de acesso:** `admin` / `admin`

## Diferenciais da Implementação

- **Resiliência Offline:** O front-end detecta queda de conexão e simula o funcionamento do micro-ondas via JavaScript.
- **Sincronização em Tempo Real:** Atualização do visor via SSE (Server-Sent Events) sem necessidade de refresh.
- **Clean Architecture:** Back-end desacoplado e 100% coberto por testes (xUnit).
- **Segurança:** Autenticação JWT e senhas protegidas com Hashing SHA1.

## Testes
Para rodar os testes de ambas as camadas:
```bash
dotnet test backend/Microwave.sln
cd frontend && npm test
```
