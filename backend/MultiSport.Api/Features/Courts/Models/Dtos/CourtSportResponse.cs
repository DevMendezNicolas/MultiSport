namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CourtSportResponse(
    Guid SportId,
    string SportName,
    string? IconUrl,
    decimal BasePrice,
    int DurationMinutes
);
