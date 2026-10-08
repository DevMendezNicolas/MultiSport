namespace MultiSport.Api.Features.Courts.Models.Entities;

public sealed class CourtPricingRule
{
    public Guid Id { get; init; }
    public Guid CourtSportId { get; init; }
    public int DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
    public decimal Price { get; init; }
    public int DurationMinutes { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
