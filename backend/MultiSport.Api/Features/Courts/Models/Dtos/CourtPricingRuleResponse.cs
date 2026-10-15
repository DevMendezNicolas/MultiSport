namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CourtPricingRuleResponse(
    Guid Id,
    Guid CourtSportId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price,
    int DurationMinutes
);
