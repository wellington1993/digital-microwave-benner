# Microwave Digital - Monorepo

Este projeto e uma solucao full-stack para o desafio do micro-ondas digital, focada em resiliencia e simplicidade.

## Arquitetura e Decisoes de Design

A solucao segue o principio KISS (Keep It Simple, Stupid) para garantir alta performance e facilidade de manutencao.

### Backend (.NET 8)
- Clean Architecture: Divisao clara entre Dominio, Aplicacao, Infraestrutura e API.
- State Pattern: Gerenciamento do ciclo de vida do forno (Idle, Heating, Paused) sem condicionais complexas.
- Persistencia JSON: Armazenamento em arquivo com controle de concorrencia via SemaphoreSlim.
- Seguranca: Autenticacao JWT e Hashing SHA1 conforme especificacao.

### Frontend (React + Vite + TS)
- Resiliencia Offline: O sistema possui um interceptador Axios que detecta falhas de rede. Caso o backend esteja indisponivel, a interface ativa automaticamente o modo de simulacao local para permitir o uso das funcoes basicas (Nivel 1 e 2).
- TailwindCSS: Estilizacao focada em mimetizar um painel real de micro-ondas.

## Execucao Local

### Requisitos
- .NET 8 SDK
- Node.js 20+

### Passo a Passo
1. Clone o repositorio.
2. Inicie o Backend: `dotnet run --project backend/src/Microwave.Api`
3. Inicie o Frontend: `cd frontend && npm install && npm run dev`

Alternativamente, utilize o Docker Compose:
`docker-compose up --build`

## CI/CD e URL Publica

O frontend e publicado automaticamente no GitHub Pages atraves do GitHub Actions configurado em `.github/workflows/deploy.yml`. 
Devido a natureza do GitHub Pages, a aplicacao utiliza o roteamento baseado em hash (HashRouter) para garantir a navegabilidade.
