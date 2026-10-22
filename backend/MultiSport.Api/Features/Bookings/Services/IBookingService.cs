using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MultiSport.Api.Features.Bookings.Models.Dtos;

namespace MultiSport.Api.Features.Bookings.Services;

public interface IBookingService
{
    Task<Results<Ok<DailyGridResponse>, UnauthorizedHttpResult>> GetDailyGridAsync(
        Guid complexId,
        DateOnly date,
        CancellationToken ct);

    Task<Results<Ok<BookingResponse>, NotFound, UnauthorizedHttpResult>> GetBookingByIdAsync(
        Guid bookingId,
        Guid complexId,
        CancellationToken ct);

    Task<Results<Created<BookingResponse>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> CreateBookingAsync(
        Guid complexId,
        Guid userId,
        CreateBookingRequest request,
        CancellationToken ct);

    Task<Results<Created<BookingResponse>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> CreateBlockAsync(
        Guid complexId,
        Guid userId,
        CreateBlockRequest request,
        CancellationToken ct);

    Task<Results<Ok<PaymentResponse>, NotFound, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> RecordPaymentAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        RecordPaymentRequest request,
        CancellationToken ct);

    Task<Results<NoContent, NotFound, Conflict<ProblemDetails>, UnauthorizedHttpResult>> CancelBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        CancelBookingRequest request,
        CancellationToken ct);

    Task<Results<Ok<BookingResponse>, NotFound, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> RescheduleBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        RescheduleBookingRequest request,
        CancellationToken ct);

    Task<Results<Ok<PriceQuoteResponse>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> GetPriceQuoteAsync(
        Guid complexId,
        PriceQuoteRequest request,
        CancellationToken ct);

    Task<Results<Ok<IReadOnlyList<CustomerLookupDto>>, UnauthorizedHttpResult>> SearchCustomersAsync(
        Guid complexId,
        string searchTerm,
        CancellationToken ct);
}
