# Micro-ondas Digital

API REST de um micro-ondas digital com frontend React. Backend em .NET 8, frontend em React + TypeScript + TailwindCSS.

## Arquitetura

### Backend (.NET 8)
- Clean Architecture com camadas Domain, Application, Infrastructure e Api
- State Pattern para o ciclo de vida do forno (Idle, Heating, Paused)
- Persistência em JSON local com controle de concorrência via SemaphoreSlim
- Autenticação JWT com senha em SHA1

### Frontend (React + Vite + TypeScript)
- Modo offline: detecta automaticamente quando o backend está indisponível e ativa simulação local
- Reconexão automática a cada 5s via probe
- SSE para atualização em tempo real do estado do micro-ondas

## Rodando localmente

**Requisitos:** .NET 8 SDK e Node.js 24+

```bash
# Backend
dotnet run --project backend/src/Microwave.Api

# Frontend (outro terminal)
cd frontend && npm install && npm run dev
```

Ou com Docker:

```bash
docker-compose up --build
```

## Deploy

O frontend é publicado via GitHub Actions no push para `main`.