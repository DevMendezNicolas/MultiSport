namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CourtPricingTierDto(
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price,
    int? DurationMinutes = null,
    Guid? SportId = null
);
