using Serilog.Context;

namespace MultiSport.Api.Common;

/// <summary>
/// Middleware que extrae o genera un X-Correlation-Id unificado para rastreo distribuido,
/// propagándolo a los encabezados de respuesta y al LogContext estructurado de Serilog.
/// </summary>
public sealed class CorrelationIdMiddleware
{
    private const string CorrelationIdHeaderName = "X-Correlation-Id";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);

        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey(CorrelationIdHeaderName))
            {
                context.Response.Headers.Append(CorrelationIdHeaderName, correlationId);
            }
            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }

    private static string GetOrCreateCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CorrelationIdHeaderName, out var headerValues) &&
            !string.IsNullOrWhiteSpace(headerValues.FirstOrDefault()))
        {
            return headerValues.First()!;
        }

        return Guid.NewGuid().ToString("N");
    }
}
