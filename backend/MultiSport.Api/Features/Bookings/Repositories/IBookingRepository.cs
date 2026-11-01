using MultiSport.Api.Features.Bookings.Models.Dtos;
using MultiSport.Api.Features.Bookings.Models.Entities;

namespace MultiSport.Api.Features.Bookings.Repositories;

public enum BookingWriteStatus
{
    Success,
    NotFound,
    CourtNotFound,
    SportNotAvailableOnCourt,
    OutsideOperatingHours,
    RecurringRuleConflict
}

public record BookingWriteResult(
    BookingWriteStatus Status,
    string? ErrorMessage = null,
    Booking? Booking = null
);

public interface IBookingRepository
{
    Task<IReadOnlyList<DailyGridCourtItem>> GetComplexCourtsWithSportsAsync(Guid complexId, CancellationToken ct);
    Task<IReadOnlyList<GridBookingItem>> GetBookingsForDateRangeAsync(Guid complexId, DateTimeOffset startUtc, DateTimeOffset endUtc, CancellationToken ct);
    Task<IReadOnlyList<RecurringBookingRule>> GetActiveRecurringRulesForDayAsync(Guid complexId, int dayOfWeek, CancellationToken ct);
    Task<BookingResponse?> GetBookingDetailByIdAsync(Guid bookingId, Guid complexId, CancellationToken ct);
    Task<Booking?> GetBookingEntityByIdAsync(Guid bookingId, Guid complexId, CancellationToken ct);
    Task<IReadOnlyList<PaymentResponse>> GetPaymentsByBookingIdAsync(Guid bookingId, CancellationToken ct);
    Task<BookingWriteResult> CreateBookingWithOptionalPaymentAsync(
        Booking booking,
        Payment? payment,
        Customer? customer,
        RecurringBookingRule? recurringRule,
        CancellationToken ct);
    Task<Payment> RecordPaymentAsync(
        Payment payment,
        decimal newDepositAmount,
        string newStatus,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct);
    Task<bool> CancelBookingAsync(
        Guid bookingId,
        Guid complexId,
        string reason,
        Payment? refundPayment,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct);
    Task<BookingWriteResult> RescheduleBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid sourceCourtId,
        Guid newCourtId,
        Guid sportId,
        DateTimeOffset newStartUtc,
        DateTimeOffset newEndUtc,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct);
    Task<BookingWriteResult> UpdateBlockAsync(
        Guid bookingId,
        Guid complexId,
        Guid sourceCourtId,
        Guid newCourtId,
        DateTimeOffset newStartUtc,
        DateTimeOffset newEndUtc,
        string reason,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct);
    Task<IReadOnlyList<CustomerLookupDto>> SearchCustomersAsync(Guid complexId, string searchTerm, CancellationToken ct);
    Task<(decimal Price, string RuleName, bool HasRule)> GetPriceQuoteAsync(
        Guid courtId,
        Guid sportId,
        int dayOfWeek,
        TimeOnly startTime,
        CancellationToken ct);
}
