namespace MultiSport.Api.Features.Bookings.Models.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "cash";
    public string PaymentType { get; set; } = "deposit";
    public string Status { get; set; } = "approved";
    public string? ReceiptUrl { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
}
