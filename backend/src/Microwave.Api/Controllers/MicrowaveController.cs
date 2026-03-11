using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microwave.Application.DTOs;
using Microwave.Application.Services;
using System.Text.Json;

namespace Microwave.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/microwave")]
public sealed class MicrowaveController : ControllerBase
{
    private readonly MicrowaveService _microwaveService;
    private readonly ProgramService _programService;

    public MicrowaveController(MicrowaveService microwaveService, ProgramService programService)
    {
        _microwaveService = microwaveService;
        _programService = programService;
    }

    [HttpGet("status")]
    public IActionResult GetStatus() => Ok(_microwaveService.GetStatus());

    [AllowAnonymous]
    [HttpGet("stream")]
    public async Task GetStream()
    {
        Response.ContentType        = "text/event-stream";
        Response.Headers["Cache-Control"]      = "no-cache";
        Response.Headers["X-Accel-Buffering"]  = "no";

        var opts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var ct   = HttpContext.RequestAborted;

        while (!ct.IsCancellationRequested)
        {
            var status = _microwaveService.GetStatus();
            var json   = JsonSerializer.Serialize(status, opts);

            await Response.WriteAsync($"data: {json}\n\n", ct);
            await Response.Body.FlushAsync(ct);
            await Task.Delay(1000, ct);
        }
    }

    [HttpPost("start")]
    public IActionResult Start([FromBody] StartHeatingRequest request)
        => Ok(_microwaveService.Start(request));

    [HttpPost("quick-start")]
    public IActionResult QuickStart() => Ok(_microwaveService.QuickStart());

    [HttpPost("pause-cancel")]
    public IActionResult PauseOrCancel() => Ok(_microwaveService.PauseOrCancel());

    [HttpPost("cancel")]
    public IActionResult Cancel() => Ok(_microwaveService.Cancel());

    [HttpPost("start-program")]
    public async Task<IActionResult> StartProgram([FromBody] StartProgramRequest request)
    {
        var program = await _programService.GetByNameAsync(request.ProgramName);
        return Ok(_microwaveService.StartProgram(program));
    }

    [HttpGet("programs")]
    public async Task<IActionResult> GetPrograms() 
        => Ok(await _programService.GetAllAsync());

    [HttpPost("programs")]
    public async Task<IActionResult> AddProgram([FromBody] CreateProgramRequest request)
    {
        var program = await _programService.CreateAsync(request);
        return CreatedAtAction(nameof(GetPrograms), program);
    }

    [HttpDelete("programs/{name}")]
    public async Task<IActionResult> DeleteProgram(string name)
    {
        await _programService.DeleteAsync(name);
        return NoContent();
    }
}
