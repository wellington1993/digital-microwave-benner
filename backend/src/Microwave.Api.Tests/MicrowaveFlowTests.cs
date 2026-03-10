using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microwave.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Microwave.Api.Tests;

public sealed class MicrowaveFlowTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MicrowaveFlowTests(WebApplicationFactory<Program> factory)
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
    public async Task Status_ShouldReturn401_WithoutToken()
    {
        var res = await _client.GetAsync("/api/microwave/status");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Status_ShouldReturnIdle_WhenNothingStarted()
    {
        await AuthorizeAsync();
        var res = await _client.GetAsync("/api/microwave/status");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Idle", body!.State);
    }

    [Fact]
    public async Task Start_ShouldReturnHeating_WithValidInput()
    {
        await AuthorizeAsync();
        var res = await _client.PostAsJsonAsync("/api/microwave/start",
            new StartHeatingRequest(30, 8, '.'));

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Heating", body!.State);
        Assert.Equal(30, body.TotalDurationSeconds);

        await _client.PostAsync("/api/microwave/cancel", null);
    }

    [Fact]
    public async Task Start_ShouldReturn400_WhenDurationExceeds120()
    {
        await AuthorizeAsync();
        var res = await _client.PostAsJsonAsync("/api/microwave/start",
            new StartHeatingRequest(121, 10, '.'));

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Start_ShouldReturn400_WhenPowerOutOfRange()
    {
        await AuthorizeAsync();
        var res = await _client.PostAsJsonAsync("/api/microwave/start",
            new StartHeatingRequest(30, 11, '.'));

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task QuickStart_ShouldReturnHeating()
    {
        await AuthorizeAsync();
        var res = await _client.PostAsync("/api/microwave/quick-start", null);

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Heating", body!.State);
        Assert.Equal(30, body.TotalDurationSeconds);

        await _client.PostAsync("/api/microwave/cancel", null);
    }

    [Fact]
    public async Task PauseCancel_ShouldPause_ThenCancel()
    {
        await AuthorizeAsync();
        await _client.PostAsJsonAsync("/api/microwave/start", new StartHeatingRequest(60, 5, '.'));

        var pauseRes = await _client.PostAsync("/api/microwave/pause-cancel", null);
        var paused = await pauseRes.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Paused", paused!.State);

        var cancelRes = await _client.PostAsync("/api/microwave/pause-cancel", null);
        var idle = await cancelRes.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Idle", idle!.State);
    }

    [Fact]
    public async Task Cancel_ShouldReturnIdle_WhenHeating()
    {
        await AuthorizeAsync();
        await _client.PostAsJsonAsync("/api/microwave/start", new StartHeatingRequest(60, 5, '.'));

        var res = await _client.PostAsync("/api/microwave/cancel", null);
        var body = await res.Content.ReadFromJsonAsync<MicrowaveStatusResponse>();
        Assert.Equal("Idle", body!.State);
    }
}