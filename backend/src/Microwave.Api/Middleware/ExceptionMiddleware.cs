using System.Net;
using System.Text.Json;
using Microwave.Domain.Exceptions;
using System.Text;

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
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = exception switch
        {
            BusinessRuleException b => new { Status = (int)HttpStatusCode.BadRequest, Message = b.Message },
            _ => new { Status = (int)HttpStatusCode.InternalServerError, Message = "Ocorreu um erro inesperado." }
        };

        if (exception is not BusinessRuleException)
        {
             _logger.LogError(exception, "Unhandled Exception: {Message}", exception.Message);
             
             // Nivel 4.2.c: Log detalhado em arquivo (Exception, Inner, Stacktrace)
             var logBuilder = new StringBuilder();
             logBuilder.AppendLine($"--- Erro: {DateTime.Now:yyyy-MM-dd HH:mm:ss} ---");
             logBuilder.AppendLine($"Mensagem: {exception.Message}");
             logBuilder.AppendLine($"StackTrace: {exception.StackTrace}");
             
             if (exception.InnerException != null)
             {
                 logBuilder.AppendLine($"Inner Exception: {exception.InnerException.Message}");
                 logBuilder.AppendLine($"Inner StackTrace: {exception.InnerException.StackTrace}");
             }
             
             logBuilder.AppendLine("--------------------------------------------");
             File.AppendAllText("logs.txt", logBuilder.ToString());
        }

        context.Response.StatusCode = response.Status;
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
