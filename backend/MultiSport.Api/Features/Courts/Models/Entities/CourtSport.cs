namespace MultiSport.Api.Features.Courts.Models.Entities;

public sealed class CourtSport
{
    public Guid Id { get; init; }
    public Guid CourtId { get; init; }
    public Guid SportId { get; init; }
    public int DurationMinutes { get; init; } = 60;
    public decimal BasePrice { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
