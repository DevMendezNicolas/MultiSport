namespace MultiSport.Api.Features.Auth.Models.Entities;

public sealed class Complex
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? TaxId { get; init; }
    public string? CbuAlias { get; init; }
    public string? Address { get; init; }
    public string? Phone { get; init; }
    public string? City { get; init; }
    public string? LogoUrl { get; init; }
    public bool IsActive { get; init; } = true;
    public DateTimeOffset CreatedAt { get; init; }
    public Guid? CreatedBy { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }
    public Guid? DeletedBy { get; init; }
}
