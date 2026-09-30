using System.Diagnostics;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace MultiSport.Api.Common;

/// <summary>
/// Manejador global de excepciones que intercepta errores no controlados y los serializa
/// conforme a la especificación estándar RFC 7807 (ProblemDetails).
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var correlationId = httpContext.Response.Headers["X-Correlation-Id"].FirstOrDefault()
                            ?? httpContext.TraceIdentifier;

        var (statusCode, title, detail, extensions) = MapException(exception);

        _logger.LogError(
            exception,
            "Unhandled exception occurred. StatusCode: {StatusCode}, Title: {Title}, CorrelationId: {CorrelationId}",
            statusCode,
            title,
            correlationId);

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path,
            Extensions =
            {
                ["correlationId"] = correlationId,
                ["timestampUtc"] = DateTimeOffset.UtcNow
            }
        };

        if (extensions is not null)
        {
            foreach (var (key, value) in extensions)
            {
                problemDetails.Extensions[key] = value;
            }
        }

        if (_environment.IsDevelopment() && statusCode == StatusCodes.Status500InternalServerError)
        {
            problemDetails.Extensions["stackTrace"] = exception.StackTrace;
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static (int StatusCode, string Title, string Detail, IDictionary<string, object?>? Extensions) MapException(Exception exception)
    {
        return exception switch
        {
            ValidationException validationEx => (
                StatusCodes.Status400BadRequest,
                "Validation Error",
                "One or more validation errors occurred.",
                new Dictionary<string, object?>
                {
                    ["errors"] = validationEx.Errors
                        .GroupBy(e => e.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
                }
            ),

            KeyNotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                "Resource Not Found",
                notFoundEx.Message,
                null
            ),

            PostgresException postgresEx when postgresEx.SqlState == "23P01" => (
                StatusCodes.Status409Conflict,
                "Schedule Conflict",
                "The requested court schedule overlaps with an existing booking or locked event.",
                null
            ),

            PostgresException postgresEx when postgresEx.SqlState == "23505" => (
                StatusCodes.Status409Conflict,
                "Unique Constraint Violation",
                "A record with the specified unique values already exists in the system.",
                null
            ),

            UnauthorizedAccessException unauthorizedEx => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                unauthorizedEx.Message,
                null
            ),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Internal Server Error",
                "An unexpected internal error occurred. Please contact system support.",
                null
            )
        };
    }
}
