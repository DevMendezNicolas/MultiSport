namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CourtSportConfigDto(
    Guid SportId,
    decimal? BasePrice = null,
    int? DurationMinutes = null
);
