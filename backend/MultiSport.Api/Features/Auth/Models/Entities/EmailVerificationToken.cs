namespace MultiSport.Api.Features.Auth.Models.Entities;

public sealed class EmailVerificationToken
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string TokenHash { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public DateTimeOffset? UsedAtUtc { get; init; }

    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAtUtc;
    public bool IsUsed => UsedAtUtc.HasValue;
}
