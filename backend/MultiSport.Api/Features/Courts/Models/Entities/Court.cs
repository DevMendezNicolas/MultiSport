namespace MultiSport.Api.Features.Courts.Models.Entities;

public sealed class Court
{
    public Guid Id { get; init; }
    public Guid ComplexId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string SurfaceType { get; init; } = string.Empty;
    public bool IsCovered { get; init; }
    public bool HasLighting { get; init; }
    public int BufferMinutes { get; init; }
    public bool IsActive { get; init; } = true;
    public DateTimeOffset CreatedAt { get; init; }
    public Guid? CreatedBy { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }
    public Guid? DeletedBy { get; init; }
}
