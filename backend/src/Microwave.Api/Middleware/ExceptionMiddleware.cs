using System.Net;
using System.Text.Json;
using Microwave.Domain.Exceptions;

namespace Microwave.Api.Middleware;

public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted) return;

        context.Response.ContentType = "application/json";
        
        var response = exception switch
        {
            BusinessRuleException b => new { mensagem = b.Message },
            _                       => new { mensagem = "Ocorreu um erro inesperado." }
        };

        if (exception is not BusinessRuleException)
        {
             _logger.LogError(exception, "Unhandled Exception: {Message}", exception.Message);
        }

        context.Response.StatusCode = (exception is BusinessRuleException) ? 400 : 500;
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
