# microwave-digital-benner

Desafio tecnico de um micro-ondas digital.

## Execucao local

Requisitos: .NET 8 SDK e Node 20+.

1. Backend:
`dotnet run --project backend/src/Microwave.Api --urls "http://localhost:5000"`

2. Frontend:
`cd frontend && npm install && npm run dev`

O painel estara disponivel em: `http://localhost:5173` (admin/admin).

## Detalhes tecnicos

- **Backend:** Clean Architecture com State Pattern para o controle do forno. Persistencia em arquivos JSON e seguranca via JWT/SHA1.
- **Frontend:** React + Tailwind. Possui um interceptor que ativa uma simulacao local caso o backend nao seja detectado, garantindo a operacao das funcoes basicas.
- **CI/CD:** Pipeline no Github Actions para deploy automatico do frontend.
