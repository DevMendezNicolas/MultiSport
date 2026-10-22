namespace MultiSport.Api.Features.Auth.Models.Entities;

public sealed class User
{
    public Guid Id { get; init; }
    public Guid ComplexId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string PasswordHash { get; init; } = string.Empty;
    public string Role { get; init; } = "complex_admin";
    public bool IsActive { get; init; } = true;
    public bool IsEmailVerified { get; init; }
    public DateTimeOffset? EmailVerifiedAtUtc { get; init; }
    public int FailedLoginAttempts { get; init; }
    public DateTimeOffset? LockoutEndUtc { get; init; }
    public DateTimeOffset? LastLoginAtUtc { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public Guid? CreatedBy { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }
    public Guid? DeletedBy { get; init; }
}
