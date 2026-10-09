namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CourtResponse(
    Guid Id,
    Guid ComplexId,
    string Name,
    string SurfaceType,
    bool IsCovered,
    bool HasLighting,
    decimal BasePrice,
    int DurationMinutes,
    bool IsActive,
    IReadOnlyList<CourtSportResponse> Sports,
    DateTimeOffset CreatedAt
);
