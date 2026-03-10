using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microwave.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Microwave.Api.Tests;

public sealed class ProgramTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProgramTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private async Task AuthorizeAsync()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("admin", "admin"));
        var body = await res.Content.ReadFromJsonAsync<TokenResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body!.Token);
    }

    [Fact]
    public async Task GetPrograms_ShouldReturnFivePredefined()
    {
        await AuthorizeAsync();
        var res = await _client.GetAsync("/api/microwave/programs");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var list = await res.Content.ReadFromJsonAsync<HeatingProgramResponse[]>();
        Assert.True(list!.Length >= 5);
        Assert.True(list.Count(p => p.IsPredefined) == 5);
    }

    [Fact]
    public async Task CreateProgram_ShouldReturn201_WithValidData()
    {
        await AuthorizeAsync();
        var req = new CreateProgramRequest("Sopa", "Sopa de legumes", 45, 6, 's', null);
        var res = await _client.PostAsJsonAsync("/api/microwave/programs", req);

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);

        await _client.DeleteAsync("/api/microwave/programs/Sopa");
    }

    [Fact]
    public async Task CreateProgram_ShouldReturn400_WhenCharIsDot()
    {
        await AuthorizeAsync();
        var req = new CreateProgramRequest("Teste", "Alimento", 30, 5, '.', null);
        var res = await _client.PostAsJsonAsync("/api/microwave/programs", req);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task CreateProgram_ShouldReturn400_WhenCharAlreadyUsed()
    {
        await AuthorizeAsync();
        var req1 = new CreateProgramRequest("ProgramA", "Alimento A", 30, 5, 'q', null);
        var req2 = new CreateProgramRequest("ProgramB", "Alimento B", 30, 5, 'q', null);

        await _client.PostAsJsonAsync("/api/microwave/programs", req1);
        var res = await _client.PostAsJsonAsync("/api/microwave/programs", req2);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        await _client.DeleteAsync("/api/microwave/programs/ProgramA");
    }

    [Fact]
    public async Task DeleteProgram_ShouldReturn400_WhenPredefined()
    {
        await AuthorizeAsync();
        var res = await _client.DeleteAsync("/api/microwave/programs/Pipoca");

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task DeleteProgram_ShouldReturn204_WhenCustom()
    {
        await AuthorizeAsync();
        await _client.PostAsJsonAsync("/api/microwave/programs",
            new CreateProgramRequest("Macarrao", "Macarrao cozido", 60, 8, 'm', null));

        var res = await _client.DeleteAsync("/api/microwave/programs/Macarrao");
        Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
    }
}