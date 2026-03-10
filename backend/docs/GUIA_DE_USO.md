# Guia de Uso e Credenciais - Microwave

Este guia orienta sobre como interagir com a API do Micro-ondas Digital.

## 1. Credenciais de Acesso
Para testar os endpoints, utilize os seguintes dados de login:

- **Usuario:** `admin`
- **Senha:** `admin`

Apos realizar o login no endpoint `/api/Auth/login`, voce recebera um `token`. Utilize este token no cabecalho de todas as chamadas seguintes:
`Authorization: Bearer <seu_token_aqui>`

## 2. Endpoints Principais

### Forno (Controle de Aquecimento)
- **POST `/api/Microwave/start`**: Inicia o aquecimento enviando tempo e potencia no body.
- **POST `/api/Microwave/quick-start`**: Inicia com 30s ou adiciona +30s se ja estiver aquecendo.
- **POST `/api/Microwave/pause-cancel`**: 
    - 1 clique: Pausa o aquecimento atual.
    - 2 cliques: Cancela tudo e reseta o forno.
- **GET `/api/Microwave/status`**: Retorna o estado atual, tempo restante e a string de pontos gerada.

### Programas de Aquecimento
- **GET `/api/Microwave/programs`**: Lista todos os programas (Pipoca, Leite, etc. + customizados).
- **POST `/api/Microwave/programs`**: Cadastra um novo programa customizado.

## 3. Logs e Diagnostico
Caso a API retorne um erro (500), as informacoes detalhadas da falha estarao registradas no arquivo `logs.txt`, localizado na raiz da pasta `Microwave.Api`.
