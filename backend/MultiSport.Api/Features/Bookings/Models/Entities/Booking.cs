namespace MultiSport.Api.Features.Bookings.Models.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid ComplexId { get; set; }
    public Guid CourtId { get; set; }
    public Guid SportId { get; set; }
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public DateTimeOffset StartTimeUtc { get; set; }
    public DateTimeOffset EndTimeUtc { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal DepositAmount { get; set; }
    public string Status { get; set; } = "pending";
    public DateTimeOffset? ExpiresAtUtc { get; set; }
    public bool IsRecurring { get; set; }
    public Guid? RecurringGroupId { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}
