namespace MultiSport.Api.Features.System;

/// <summary>
/// Contrato inmutable de respuesta para el estado general del backend y runtime.
/// </summary>
public sealed record SystemInfoResponse(
    string Application,
    string Version,
    string Environment,
    DateTimeOffset TimestampUtc
);
