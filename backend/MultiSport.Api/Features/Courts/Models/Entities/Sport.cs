namespace MultiSport.Api.Features.Courts.Models.Entities;

public sealed class Sport
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? IconUrl { get; init; }
    public int MaxPlayers { get; init; } = 10;
    public bool IsActive { get; init; } = true;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }
}
