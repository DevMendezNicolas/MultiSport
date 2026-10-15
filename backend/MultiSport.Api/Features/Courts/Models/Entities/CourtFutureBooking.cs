namespace MultiSport.Api.Features.Courts.Models.Entities;

public sealed class CourtFutureBooking
{
    public Guid Id { get; init; }
    public Guid CourtId { get; init; }
    public Guid SportId { get; init; }
    public DateTimeOffset StartTimeUtc { get; init; }
    public DateTimeOffset EndTimeUtc { get; init; }
    public string Status { get; init; } = string.Empty;
}
