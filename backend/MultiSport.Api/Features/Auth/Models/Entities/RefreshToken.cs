namespace MultiSport.Api.Features.Auth.Models.Entities;

public sealed class RefreshToken
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string TokenHash { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; init; }
    public DateTimeOffset AbsoluteExpiresAtUtc { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public DateTimeOffset? RevokedAtUtc { get; init; }
    public string? ReplacedByToken { get; init; }

    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAtUtc || DateTimeOffset.UtcNow >= AbsoluteExpiresAtUtc;
    public bool IsRevoked => RevokedAtUtc.HasValue;
    public bool IsActive => !IsRevoked && !IsExpired;
}
