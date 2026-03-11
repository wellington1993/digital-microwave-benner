# 🍕 Arquitetura do Microwave - Minha Anotação

Okay, então entendi que o Microwave é basicamente uma **API em .NET 8** que controla um micro-ondas. Parece simples, mas tem uns padrões bem legais atrás que vou detalhar aqui.

## 🏗️ As 4 Camadas (Clean Architecture)

Basicamente dividi o projeto em 4 camadas bem separadas. A ideia é que cada camada faz uma coisa e ninguém fica dependendo de tudo ao mesmo tempo.

### 1️⃣ **Domain** - O Coração (`Microwave.Domain/`)
Aqui vive **só a lógica pura do negócio**, sem nada de HTTP, banco de dados ou frameworks chatos.

O que tem:
- `HeatingProgram` → Classe que representa um programa (ex: Pipoca com 180s)
- `MicrowaveStatus` → O estado atual do micro (aquecendo? pausado? pronto?)
- `BusinessRuleException` → Quando alguém faz algo errado (ex: tentar pausar sem estar aquecendo)

**Vibe:** Se eu deletasse tudo de .NET, essas classes continuariam fazendo sentido. Zero dependências.

### 2️⃣ **Application** - A Orquestração (`Microwave.Application/`)
Aqui é onde as coisas começam a falar com a camada anterior.

O que tem:
- `MicrowaveService` → Controla o estado: começa a aquecer, pausa, cancela...
- `ProgramService` → Cuida dos programas (Pipoca, Frango, etc)
- `DTOs` → Basicamente "traduções" do que a API precisa receber (LoginRequest, TokenResponse)
- `IAuthService` → Interface para autenticação (login, validação)

**Vibe:** Aqui eu orquesto chamadas do Domain com a realidade do mundo exterior.

### 3️⃣ **Infrastructure** - O Dado (`Microwave.Infrastructure/`)
Aqui é o lugar onde os dados **realmente** são salvos/lidos.

O que tem:
- `ProgramRepository` → Implementa a interface `IProgramRepository`
- Salva tudo em `data/programs.json` (sem banco de dados relacional!)
- Usa `SemaphoreSlim` pra não quebrar tudo se 2 requisições tentarem escrever ao mesmo tempo

**Vibe:** Se amanhã eu quisesse trocar JSON por SQL, é só aqui que mexo.

### 4️⃣ **Api** - O Público (`Microwave.Api/`)
Aqui é o que o mundo externo enxerga (HTTP, JWT, CORS).

O que tem:
- `MicrowaveController` → Os endpoints `/api/microwave/*` 
- `AuthController` → Faz login em `/api/auth/*`
- `Program.cs` → Toda a configuração maluca de Dependency Injection, JWT, CORS
- `ExceptionMiddleware` → Pega exceções que voam e converte em JSON sensato

**Vibe:** Se der erro aqui, o frontend vê certinho. Se der erro lá no Domain, é tratado globalmente.

---

## Dependency Injection (DI)

Configurado em `Program.cs` (linhas 76-80):

```csharp
var dataPath = builder.Configuration["DataPath"] ?? "data/programs.json";
builder.Services.AddSingleton<IProgramRepository>(_ => new ProgramRepository(dataPath));
builder.Services.AddSingleton<MicrowaveService>();
builder.Services.AddScoped<ProgramService>();
builder.Services.AddScoped<IAuthService, AuthService>();
```

| Serviço | Lifetime | Razão |
|---------|----------|-------|
| `IProgramRepository` | Singleton | Acesso a um único arquivo JSON |
| `MicrowaveService` | Singleton | Estado compartilhado entre requisições |
| `ProgramService` | Scoped | Nova instância por requisição |
| `IAuthService` | Scoped | Escopo de requisição para segurança |

---

## Autenticação JWT

### Configuração (`Program.cs`, linhas 42-72):

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

### Credenciais (`appsettings.json`):
```json
"Jwt": {
    "Key": "MicrowaveApiSecretKey_2024_SuperSegura_32Chars!",
    "Issuer": "MicrowaveApi",
    "Audience": "MicrowaveClient"
},
"Auth": {
    "Users": [
        {
            "Username": "admin",
            "PasswordHash": "d033e22ae348aeb5660fc2140aec35850c4da997"  // SHA1 de "admin"
        }
    ]
}
```

### Fluxo de Autenticação:
1. Cliente POST `/api/auth/login` com `username` e `password`
2. Backend valida credenciais contra `appsettings.json`
3. Se válido, gera JWT com issuer/audience/chave
4. Cliente armazena token em `sessionStorage`
5. Requisições posteriores incluem `Authorization: Bearer {token}`

---

## Persistência de Dados

### Sem Banco de Dados Relacional
O projeto usa **JSON em arquivo** (`data/programs.json`) como persistência.

### Implementação (`ProgramRepository.cs`):

```csharp
public class ProgramRepository : IProgramRepository
{
    private readonly string _filePath;
    private static readonly SemaphoreSlim _semaphore = new(1, 1);

    public async Task<IReadOnlyList<HeatingProgram>> GetCustomProgramsAsync()
    {
        await _semaphore.WaitAsync();
        try { return await LoadAsync(); }
        finally { _semaphore.Release(); }
    }

    private async Task<List<HeatingProgram>> LoadAsync()
    {
        if (!File.Exists(_filePath)) return new List<HeatingProgram>();
        var json = await File.ReadAllTextAsync(_filePath);
        return JsonSerializer.Deserialize<List<HeatingProgram>>(json) ?? new List<HeatingProgram>();
    }
}
```

**Sincronização thread-safe**: `SemaphoreSlim` garante que apenas uma thread leia/escreva por vez.

---

## Server-Sent Events (SSE)

### Endpoint: `GET /api/microwave/stream`

```csharp
[HttpGet("stream")]
public async Task GetStream()
{
    Response.ContentType = "text/event-stream";
    Response.Headers["Cache-Control"] = "no-cache";
    Response.Headers["X-Accel-Buffering"] = "no";

    while (!ct.IsCancellationRequested)
    {
        var status = _microwaveService.GetStatus();
        var json = JsonSerializer.Serialize(status, opts);
        await Response.WriteAsync($"data: {json}\n\n", ct);
        await Response.Body.FlushAsync(ct);
        await Task.Delay(1000, ct);  // 1 seg de intervalo
    }
}
```

**Benefício**: Atualiza o frontend em tempo real sem polling contínuo.

---

## Testes (xUnit)

### Arquivos de Teste:
- `Microwave.Api.Tests/AuthTests.cs` → Testes de autenticação
- `Microwave.Api.Tests/ProgramTests.cs` → Testes de programas
- `Microwave.Api.Tests/MicrowaveFlowTests.cs` → Testes de fluxo end-to-end

### Exemplo:
```csharp
[Fact]
public async Task Login_ShouldReturn200_WithValidCredentials()
{
    var response = await _client.PostAsJsonAsync("/api/auth/login",
        new LoginRequest("admin", "admin"));

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    var body = await response.Content.ReadFromJsonAsync<TokenResponse>();
    Assert.False(string.IsNullOrWhiteSpace(body!.Token));
}
```

### Executar:
```bash
dotnet test backend/Microwave.sln
```

---

## Middleware Customizado

### ExceptionMiddleware
Trata exceções globalmente e retorna respostas padronizadas:

```csharp
app.UseMiddleware<ExceptionMiddleware>();
```

Mapeia:
- `BusinessRuleException` → 400 Bad Request
- `UnauthorizedException` → 401 Unauthorized
- Outras → 500 Internal Server Error

---

## CORS

Configurado para aceitar requisições de qualquer origem:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

Permite que o frontend (porta 5173) consuma a API (porta 5000).

---

## Resumo de Padrões

| Padrão | Implementação |
|--------|---------------|
| **Clean Architecture** | 4 camadas (Domain, Application, Infrastructure, Api) |
| **Dependency Injection** | Built-in do .NET com `IServiceCollection` |
| **Repository Pattern** | `IProgramRepository` com `ProgramRepository` |
| **JWT Authentication** | `JwtBearerDefaults` com validação rigorosa |
| **Middleware Pattern** | `ExceptionMiddleware` para tratamento global |
| **Unit Testing** | xUnit com `WebApplicationFactory` |
| **Real-time Communication** | SSE (Server-Sent Events) |
| **Thread-safety** | `SemaphoreSlim` no repositório |

