namespace MultiSport.Api.Features.Bookings.Models.Dtos;

public record BookingResponse(
    Guid Id,
    Guid ComplexId,
    Guid CourtId,
    string CourtName,
    Guid SportId,
    string SportName,
    Guid? CustomerId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    DateTimeOffset StartTimeUtc,
    DateTimeOffset EndTimeUtc,
    decimal TotalPrice,
    decimal DepositAmount,
    decimal Balance,
    string Status,
    bool IsRecurring,
    Guid? RecurringGroupId,
    string? Notes,
    DateTimeOffset CreatedAt,
    IReadOnlyList<PaymentResponse> Payments
);

public record PaymentResponse
{
    public Guid Id { get; init; }
    public Guid BookingId { get; init; }
    public decimal Amount { get; init; }
    public string PaymentMethod { get; init; } = string.Empty;
    public string PaymentType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ReceiptUrl { get; init; }
    public string? Notes { get; init; }
    public DateTimeOffset CreatedAt { get; init; }

    public PaymentResponse() { }

    public PaymentResponse(
        Guid id,
        Guid bookingId,
        decimal amount,
        string paymentMethod,
        string paymentType,
        string status,
        string? receiptUrl,
        string? notes,
        DateTimeOffset createdAt)
    {
        Id = id;
        BookingId = bookingId;
        Amount = amount;
        PaymentMethod = paymentMethod;
        PaymentType = paymentType;
        Status = status;
        ReceiptUrl = receiptUrl;
        Notes = notes;
        CreatedAt = createdAt;
    }
}

public record CreateBookingRequest(
    Guid CourtId,
    Guid SportId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    DateTimeOffset StartTimeUtc,
    DateTimeOffset EndTimeUtc,
    decimal? CustomPrice,
    decimal DepositAmount,
    string? PaymentMethod,
    bool IsRecurring,
    string? Notes
);

public record CreateBlockRequest(
    Guid CourtId,
    DateTimeOffset StartTimeUtc,
    DateTimeOffset EndTimeUtc,
    string Reason
);

public record RecordPaymentRequest(
    decimal Amount,
    string PaymentMethod,
    string PaymentType,
    string? ReceiptUrl,
    string? Notes
);

public record CancelBookingRequest(
    string Reason,
    bool RefundDeposit,
    string? RefundMethod
);

public record RescheduleBookingRequest(
    Guid CourtId,
    DateTimeOffset NewStartTimeUtc,
    DateTimeOffset NewEndTimeUtc
);

public record PriceQuoteRequest(
    Guid CourtId,
    Guid SportId,
    DateTimeOffset StartTimeUtc,
    DateTimeOffset EndTimeUtc
);

public record PriceQuoteResponse(
    decimal Price,
    string AppliedRuleName,
    bool HasRuleApplied
);

public record DailyGridResponse(
    DateOnly Date,
    IReadOnlyList<DailyGridCourtItem> Courts
);

public record DailyGridCourtItem(
    Guid CourtId,
    string CourtName,
    string Surface,
    bool IsIndoor,
    IReadOnlyList<GridSportItem> Sports,
    IReadOnlyList<GridBookingItem> Bookings
);

public record GridSportItem(
    Guid SportId,
    string Name,
    int DurationMinutes,
    decimal BasePrice
);

public record GridBookingItem
{
    public Guid Id { get; init; }
    public Guid CourtId { get; init; }
    public Guid SportId { get; init; }
    public string SportName { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public DateTimeOffset StartTimeUtc { get; init; }
    public DateTimeOffset EndTimeUtc { get; init; }
    public decimal TotalPrice { get; init; }
    public decimal DepositAmount { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool IsRecurring { get; init; }
    public string? Notes { get; init; }

    public GridBookingItem() { }

    public GridBookingItem(
        Guid Id,
        Guid CourtId,
        Guid SportId,
        string SportName,
        string CustomerName,
        string CustomerPhone,
        DateTimeOffset StartTimeUtc,
        DateTimeOffset EndTimeUtc,
        decimal TotalPrice,
        decimal DepositAmount,
        string Status,
        bool IsRecurring,
        string? Notes)
    {
        this.Id = Id;
        this.CourtId = CourtId;
        this.SportId = SportId;
        this.SportName = SportName;
        this.CustomerName = CustomerName;
        this.CustomerPhone = CustomerPhone;
        this.StartTimeUtc = StartTimeUtc;
        this.EndTimeUtc = EndTimeUtc;
        this.TotalPrice = TotalPrice;
        this.DepositAmount = DepositAmount;
        this.Status = Status;
        this.IsRecurring = IsRecurring;
        this.Notes = Notes;
    }
}

public record CustomerLookupDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Notes { get; init; }

    public CustomerLookupDto() { }

    public CustomerLookupDto(Guid id, string name, string phone, string? email, string? notes)
    {
        Id = id;
        Name = name;
        Phone = phone;
        Email = email;
        Notes = notes;
    }
}
