using Microsoft.AspNetCore.Http.HttpResults;

namespace MultiSport.Api.Features.System;

/// <summary>
/// Definición de endpoints de infraestructura del sistema y chequeo operativo.
/// </summary>
public static class SystemEndpoints
{
    public static IEndpointRouteBuilder MapSystemEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/system")
                             .WithTags("System");

        group.MapGet("/info", GetSystemInfo)
             .WithName("GetSystemInfo")
             .WithSummary("Retorna metadatos operativos del backend, entorno y hora UTC")
             .Produces<SystemInfoResponse>(StatusCodes.Status200OK);

        return endpoints;
    }

    public static Ok<SystemInfoResponse> GetSystemInfo(
        IHostEnvironment environment,
        CancellationToken ct)
    {
        var response = new SystemInfoResponse(
            Application: "MultiSport Backend API",
            Version: "1.0.0",
            Environment: environment.EnvironmentName,
            TimestampUtc: DateTimeOffset.UtcNow
        );

        return TypedResults.Ok(response);
    }
}
