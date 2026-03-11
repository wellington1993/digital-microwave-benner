# Endpoints do Microwave

Basicamente, aqui estão todos os caminhos que você pode chamar. Cada um faz uma coisa específica.

---

## Autenticação

### POST /api/auth/login

Você envia user + password, a API valida e retorna um JWT pra você usar nos próximos requests.

Manda:
```json
{
  "username": "admin",
  "password": "admin"
}
```

Recebe (sucesso):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiJ9..."
}
```

Recebe (falha):
```json
{
  "mensagem": "Credenciais inválidas."
}
```

Guarda esse token em `sessionStorage` ou `localStorage` e manda em todo request daqui pra frente!

---

## Micro-ondas - Os Comandos Principais

### GET /api/microwave/status

Te diz se o micro tá aquecendo, pausado ou ocioso.

Precisa de: Token JWT no header `Authorization: Bearer {seu_token_aqui}`

Recebe:
```json
{
  "state": "Idle",
  "remainingSeconds": 0,
  "output": "",
  "isPredefined": false
}
```

Estados possíveis:
- Idle → Esperando comando
- Heating → Aquecendo agora
- Paused → Parou no meio

---

### GET /api/microwave/stream

Abre uma conexão que fica mandando o status do micro a cada 1 segundo (Server-Sent Events).

Recebe (fluxo contínuo):
```
data: {"state":"Idle","remainingSeconds":0,"output":"","isPredefined":false}

data: {"state":"Heating","remainingSeconds":299,"output":"**** ","isPredefined":false}

data: {"state":"Heating","remainingSeconds":298,"output":"**** ***** ","isPredefined":false}
```

No frontend, usa `new EventSource()` pra abrir essa conexão e receber os dados automaticamente.

---

### POST /api/microwave/start

Inicia o aquecimento manual:

```json
{
  "durationSeconds": 30,
  "power": 10,
  "heatingChar": ".",
  "isPredefined": false
}
```

Sucesso:
```json
{
  "state": "Heating",
  "remainingSeconds": 30,
  "output": "",
  "isPredefined": false
}
```

Falha (já tá aquecendo):
```json
{
  "mensagem": "O micro-ondas já está em uso."
}
```

---

### POST /api/microwave/quick-start

Adiciona 30 segundos (se tá aquecendo) ou inicia com 30s (se tá parado).

```json
{}
```

Não funciona com programas predefinidos (Pipoca, Frango, etc).

---

### POST /api/microwave/pause-cancel

Se tá aquecendo, pausa. Se tá pausado, cancela e volta ao Idle.

```json
{}
```

---

## Programas Predefinidos

### POST /api/microwave/start-program

Inicia um programa:

```json
{
  "programName": "Pipoca"
}
```

Programas disponíveis:
- Pipoca (180s, potência 7)
- Leite (300s, potência 5)
- Carnes de boi (840s, potência 4)
- Frango (480s, potência 7)
- Feijão (480s, potência 9)

---

## Programas Customizados

### GET /api/programs

Lista todos os programas que você salvou.

### POST /api/programs

Cria um novo:

```json
{
  "name": "Meu Programa",
  "durationSeconds": 120,
  "power": 8,
  "heatingChar": "x"
}
```

### DELETE /api/programs/{name}

Deleta um programa.

---

## Códigos de Erro

- 200/201 → Sucesso
- 204 → Deletado (sem conteúdo)
- 400 → Erro na requisição ou regra de negócio violada
- 401 → Token inválido ou faltando
- 404 → Não encontrado
- 500 → Erro interno


---

### `POST /api/microwave/start`
Inicia o aquecimento manual com duração e potência customizáveis.

**Request:**
```json
{
  "durationSeconds": 30,
  "power": 10,
  "heatingChar": ".",
  "isPredefined": false
}
```

**Response (200):**
```json
{
  "state": "Heating",
  "remainingSeconds": 30,
  "output": "",
  "isPredefined": false
}
```

**Response (400):**
```json
{
  "mensagem": "O micro-ondas já está em uso."
}
```

---

### `POST /api/microwave/quick-start`
Adiciona 30 segundos ao aquecimento atual ou inicia novo com 30s.

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "state": "Heating",
  "remainingSeconds": 60,
  "output": "******* ",
  "isPredefined": false
}
```

**Response (400):**
```json
{
  "mensagem": "Programas não permitem acréscimo."
}
```

---

### `POST /api/microwave/pause-cancel`
Pausa o aquecimento se estiver em andamento, ou cancela se estiver pausado.

**Request:**
```json
{}
```

**Response (200) - Pausa:**
```json
{
  "state": "Paused",
  "remainingSeconds": 15,
  "output": "******* ",
  "isPredefined": false
}
```

**Response (200) - Cancelamento:**
```json
{
  "state": "Idle",
  "remainingSeconds": 0,
  "output": "",
  "isPredefined": false
}
```

---

### `POST /api/microwave/start-program`
Inicia um programa de aquecimento predefinido.

**Request:**
```json
{
  "programName": "Pipoca"
}
```

**Programas disponíveis:**
- `Pipoca` (180s, potência 7)
- `Leite` (300s, potência 5)
- `Carnes de boi` (840s, potência 4)
- `Frango` (480s, potência 7)
- `Feijão` (480s, potência 9)

**Response (200):**
```json
{
  "state": "Heating",
  "remainingSeconds": 180,
  "output": "",
  "isPredefined": true
}
```

**Response (400):**
```json
{
  "mensagem": "O micro-ondas já está em uso."
}
```

---

## Programas Customizados

### `GET /api/programs`
Lista todos os programas customizados salvos.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "name": "Meu Programa",
    "durationSeconds": 120,
    "power": 8,
    "heatingChar": "x"
  }
]
```

---

### `POST /api/programs`
Cria um novo programa customizado.

**Request:**
```json
{
  "name": "Meu Programa",
  "durationSeconds": 120,
  "power": 8,
  "heatingChar": "x"
}
```

**Response (201):**
```json
{
  "name": "Meu Programa",
  "durationSeconds": 120,
  "power": 8,
  "heatingChar": "x"
}
```

**Response (400):**
```json
{
  "mensagem": "Ja existe um programa com o nome 'Meu Programa'."
}
```

---

### `DELETE /api/programs/{name}`
Remove um programa customizado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (204):** (Sem conteúdo)

**Response (404):**
```json
{
  "mensagem": "Programa 'Meu Programa' nao encontrado."
}
```

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 204 | Sem conteúdo (deletado) |
| 400 | Requisição inválida / Regra de negócio violada |
| 401 | Não autenticado / Token inválido |
| 403 | Acesso negado |
| 404 | Não encontrado |
| 500 | Erro interno do servidor |

---

## Autenticação

Todos os endpoints exceto `/api/auth/login` e `/api/microwave/stream` requerem JWT no header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Se o token for inválido ou expirado:
```json
{
  "mensagem": "Nao autenticado."
}
```

