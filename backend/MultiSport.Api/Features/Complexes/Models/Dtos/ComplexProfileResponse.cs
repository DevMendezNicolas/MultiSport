namespace MultiSport.Api.Features.Complexes.Models.Dtos;

public sealed record ComplexProfileResponse(
    Guid Id,
    string Name,
    string? TaxId,
    string? CbuAlias,
    string? Address,
    string? Phone,
    string? City,
    string? LogoUrl,
    IReadOnlyList<ComplexScheduleItemDto> Schedules
);
