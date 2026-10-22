using MultiSport.Api.Features.Bookings.Models.Dtos;
using MultiSport.Api.Features.Bookings.Models.Entities;

namespace MultiSport.Api.Features.Bookings.Repositories;

public interface IBookingRepository
{
    Task<IReadOnlyList<DailyGridCourtItem>> GetComplexCourtsWithSportsAsync(Guid complexId, CancellationToken ct);
    Task<IReadOnlyList<GridBookingItem>> GetBookingsForDateRangeAsync(Guid complexId, DateTimeOffset startUtc, DateTimeOffset endUtc, CancellationToken ct);
    Task<IReadOnlyList<RecurringBookingRule>> GetActiveRecurringRulesForDayAsync(Guid complexId, int dayOfWeek, CancellationToken ct);
    Task<BookingResponse?> GetBookingDetailByIdAsync(Guid bookingId, Guid complexId, CancellationToken ct);
    Task<Booking?> GetBookingEntityByIdAsync(Guid bookingId, Guid complexId, CancellationToken ct);
    Task<IReadOnlyList<PaymentResponse>> GetPaymentsByBookingIdAsync(Guid bookingId, CancellationToken ct);
    Task<Booking> CreateBookingWithOptionalPaymentAsync(
        Booking booking,
        Payment? payment,
        Customer? customer,
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
    Task<bool> RescheduleBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid newCourtId,
        DateTimeOffset newStartUtc,
        DateTimeOffset newEndUtc,
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
    Task<RecurringBookingRule> CreateRecurringBookingRuleAsync(RecurringBookingRule rule, CancellationToken ct);
}
