using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microwave.Application.DTOs;
using Xunit;

namespace Microwave.E2E.Tests;

public sealed class MicrowaveApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public MicrowaveApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task StateCoherence_ShouldBeCorrect_DuringFlow()
    {
        var client = _factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login",
            new { Username = "admin", Password = "admin" });
        var auth = await loginResponse.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var startResponse = await client.PostAsJsonAsync("/api/microwave/start",
            new { DurationSeconds = 30, Power = 10 });
        var heating = await startResponse.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Heating", heating?.State);

        var pauseResponse = await client.PostAsync("/api/microwave/pause-cancel", null);
        var paused = await pauseResponse.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Paused", paused?.State);

        var cancelResponse = await client.PostAsync("/api/microwave/pause-cancel", null);
        var idle = await cancelResponse.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Idle", idle?.State);
        Assert.Equal("0:00", idle?.TimeDisplay);
    }
}