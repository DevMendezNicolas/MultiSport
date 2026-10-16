using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MultiSport.Api.Features.Bookings.Models.Dtos;
using MultiSport.Api.Features.Bookings.Models.Entities;
using MultiSport.Api.Features.Bookings.Repositories;
using Npgsql;

namespace MultiSport.Api.Features.Bookings.Services;

public sealed class BookingService : IBookingService
{
    private readonly IBookingRepository _repository;
    private readonly ILogger<BookingService> _logger;

    public BookingService(IBookingRepository repository, ILogger<BookingService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Results<Ok<DailyGridResponse>, UnauthorizedHttpResult>> GetDailyGridAsync(
        Guid complexId,
        DateOnly date,
        CancellationToken ct)
    {
        var courts = await _repository.GetComplexCourtsWithSportsAsync(complexId, ct);

        var startOfDayUtc = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var endOfDayUtc = startOfDayUtc.AddDays(1);

        var actualBookings = await _repository.GetBookingsForDateRangeAsync(complexId, startOfDayUtc, endOfDayUtc, ct);
        var recurringRules = await _repository.GetActiveRecurringRulesForDayAsync(complexId, (int)date.DayOfWeek, ct);

        var courtItems = new List<DailyGridCourtItem>();

        foreach (var court in courts)
        {
            var courtBookings = actualBookings
                .Where(b => b.CourtId == court.CourtId)
                .ToList();

            // Proyectar reglas recurrentes si no hay colisión con turnos reales
            var courtRules = recurringRules.Where(r => r.CourtId == court.CourtId);
            foreach (var rule in courtRules)
            {
                var ruleStartUtc = new DateTimeOffset(date.ToDateTime(rule.StartTime), TimeSpan.Zero);
                var ruleEndUtc = new DateTimeOffset(date.ToDateTime(rule.EndTime), TimeSpan.Zero);

                bool overlapsExisting = courtBookings.Any(b =>
                    b.StartTimeUtc < ruleEndUtc && b.EndTimeUtc > ruleStartUtc);

                if (!overlapsExisting)
                {
                    var sport = court.Sports.FirstOrDefault(s => s.SportId == rule.SportId);
                    courtBookings.Add(new GridBookingItem(
                        Id: rule.Id,
                        CourtId: court.CourtId,
                        SportId: rule.SportId,
                        SportName: sport?.Name ?? "Deporte",
                        CustomerName: rule.CustomerName,
                        CustomerPhone: rule.CustomerPhone,
                        StartTimeUtc: ruleStartUtc,
                        EndTimeUtc: ruleEndUtc,
                        TotalPrice: rule.Price,
                        DepositAmount: 0m,
                        Status: "confirmed",
                        IsRecurring: true,
                        Notes: rule.Notes
                    ));
                }
            }

            courtItems.Add(court with
            {
                Bookings = courtBookings.OrderBy(b => b.StartTimeUtc).ToList()
            });
        }

        return TypedResults.Ok(new DailyGridResponse(date, courtItems));
    }

    public async Task<Results<Ok<BookingResponse>, NotFound, UnauthorizedHttpResult>> GetBookingByIdAsync(
        Guid bookingId,
        Guid complexId,
        CancellationToken ct)
    {
        var booking = await _repository.GetBookingDetailByIdAsync(bookingId, complexId, ct);
        if (booking is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(booking);
    }

    public async Task<Results<Created<BookingResponse>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> CreateBookingAsync(
        Guid complexId,
        Guid userId,
        CreateBookingRequest request,
        CancellationToken ct)
    {
        // 1. Obtener o cotizar precio
        decimal totalPrice;
        if (request.CustomPrice.HasValue)
        {
            totalPrice = request.CustomPrice.Value;
        }
        else
        {
            var (quotedPrice, _, _) = await _repository.GetPriceQuoteAsync(
                request.CourtId,
                request.SportId,
                (int)request.StartTimeUtc.DayOfWeek,
                TimeOnly.FromTimeSpan(request.StartTimeUtc.TimeOfDay),
                ct);
            totalPrice = quotedPrice;
        }

        // 2. Determinar estado inicial
        var status = request.DepositAmount >= totalPrice
            ? "confirmed"
            : (request.DepositAmount > 0 ? "confirmed" : "pending");

        var bookingId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var booking = new Booking
        {
            Id = bookingId,
            ComplexId = complexId,
            CourtId = request.CourtId,
            SportId = request.SportId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail.Trim(),
            StartTimeUtc = request.StartTimeUtc,
            EndTimeUtc = request.EndTimeUtc,
            TotalPrice = totalPrice,
            DepositAmount = request.DepositAmount,
            Status = status,
            IsRecurring = request.IsRecurring,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = now,
            CreatedBy = userId,
            UpdatedAt = now,
            UpdatedBy = userId
        };

        Payment? payment = null;
        if (request.DepositAmount > 0)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = request.DepositAmount,
                PaymentMethod = request.PaymentMethod ?? "cash",
                PaymentType = request.DepositAmount >= totalPrice ? "full" : "deposit",
                Status = "approved",
                Notes = "Seña o pago inicial al reservar",
                CreatedAt = now,
                CreatedBy = userId
            };
        }

        var customer = new Customer
        {
            ComplexId = complexId,
            Name = request.CustomerName.Trim(),
            Phone = request.CustomerPhone.Trim(),
            Email = string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail.Trim()
        };

        if (request.IsRecurring)
        {
            var recurringRule = new RecurringBookingRule
            {
                Id = Guid.NewGuid(),
                ComplexId = complexId,
                CourtId = request.CourtId,
                SportId = request.SportId,
                CustomerName = request.CustomerName.Trim(),
                CustomerPhone = request.CustomerPhone.Trim(),
                DayOfWeek = (int)request.StartTimeUtc.DayOfWeek,
                StartTime = TimeOnly.FromTimeSpan(request.StartTimeUtc.TimeOfDay),
                EndTime = TimeOnly.FromTimeSpan(request.EndTimeUtc.TimeOfDay),
                Price = totalPrice,
                IsActive = true,
                Notes = request.Notes?.Trim(),
                CreatedAt = now,
                CreatedBy = userId,
                UpdatedAt = now,
                UpdatedBy = userId
            };

            await _repository.CreateRecurringBookingRuleAsync(recurringRule, ct);
            booking.RecurringGroupId = recurringRule.Id;
        }

        try
        {
            await _repository.CreateBookingWithOptionalPaymentAsync(booking, payment, customer, ct);
            _logger.LogInformation("Reserva creada exitosamente {BookingId} para complejo {ComplexId}", booking.Id, complexId);
        }
        catch (PostgresException ex) when (ex.SqlState == "23P01")
        {
            _logger.LogWarning("Conflicto de solapamiento al crear reserva en cancha {CourtId}: {Message}", request.CourtId, ex.Message);
            return TypedResults.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Horario no disponible",
                Detail = "La cancha ya cuenta con un turno confirmado o bloqueo operativo en ese rango horario."
            });
        }

        var createdDetail = await _repository.GetBookingDetailByIdAsync(booking.Id, complexId, ct);
        return TypedResults.Created($"/api/v1/bookings/{booking.Id}", createdDetail!);
    }

    public async Task<Results<Created<BookingResponse>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> CreateBlockAsync(
        Guid complexId,
        Guid userId,
        CreateBlockRequest request,
        CancellationToken ct)
    {
        var courts = await _repository.GetComplexCourtsWithSportsAsync(complexId, ct);
        var court = courts.FirstOrDefault(c => c.CourtId == request.CourtId);
        if (court is null)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Cancha no encontrada",
                Detail = "La cancha especificada no pertenece al complejo."
            });
        }

        var sportId = court.Sports.FirstOrDefault()?.SportId;
        if (!sportId.HasValue)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Cancha sin disciplinas",
                Detail = "La cancha no tiene deportes configurados para aplicar el bloqueo."
            });
        }

        var now = DateTimeOffset.UtcNow;
        var blockBooking = new Booking
        {
            Id = Guid.NewGuid(),
            ComplexId = complexId,
            CourtId = request.CourtId,
            SportId = sportId.Value,
            CustomerId = null,
            CustomerName = "Bloqueo Operativo",
            CustomerPhone = "0000000000",
            CustomerEmail = null,
            StartTimeUtc = request.StartTimeUtc,
            EndTimeUtc = request.EndTimeUtc,
            TotalPrice = 0m,
            DepositAmount = 0m,
            Status = "blocked",
            IsRecurring = false,
            Notes = request.Reason.Trim(),
            CreatedAt = now,
            CreatedBy = userId,
            UpdatedAt = now,
            UpdatedBy = userId
        };

        try
        {
            await _repository.CreateBookingWithOptionalPaymentAsync(blockBooking, null, null, ct);
            _logger.LogInformation("Bloqueo operativo creado {BookingId} en cancha {CourtId}", blockBooking.Id, request.CourtId);
        }
        catch (PostgresException ex) when (ex.SqlState == "23P01")
        {
            _logger.LogWarning("Conflicto al crear bloqueo operativo en cancha {CourtId}: {Message}", request.CourtId, ex.Message);
            return TypedResults.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Horario no disponible para bloqueo",
                Detail = "No se puede bloquear este rango horario porque ya posee un turno confirmado o bloqueo."
            });
        }

        var createdDetail = await _repository.GetBookingDetailByIdAsync(blockBooking.Id, complexId, ct);
        return TypedResults.Created($"/api/v1/bookings/{blockBooking.Id}", createdDetail!);
    }

    public async Task<Results<Ok<PaymentResponse>, NotFound, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> RecordPaymentAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        RecordPaymentRequest request,
        CancellationToken ct)
    {
        var booking = await _repository.GetBookingEntityByIdAsync(bookingId, complexId, ct);
        if (booking is null)
        {
            return TypedResults.NotFound();
        }

        if (booking.Status == "cancelled")
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Operación no permitida",
                Detail = "No se pueden registrar pagos en reservas canceladas."
            });
        }

        var newDepositAmount = booking.DepositAmount + request.Amount;
        var newStatus = newDepositAmount >= booking.TotalPrice ? "confirmed" : booking.Status;

        var now = DateTimeOffset.UtcNow;
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod.ToLowerInvariant(),
            PaymentType = request.PaymentType.ToLowerInvariant(),
            Status = "approved",
            ReceiptUrl = request.ReceiptUrl,
            Notes = request.Notes?.Trim(),
            CreatedAt = now,
            CreatedBy = userId
        };

        var recorded = await _repository.RecordPaymentAsync(payment, newDepositAmount, newStatus, userId, now, ct);
        _logger.LogInformation("Pago {PaymentId} registrado para reserva {BookingId} por monto {Amount}", recorded.Id, bookingId, request.Amount);

        return TypedResults.Ok(new PaymentResponse(
            recorded.Id,
            recorded.BookingId,
            recorded.Amount,
            recorded.PaymentMethod,
            recorded.PaymentType,
            recorded.Status,
            recorded.ReceiptUrl,
            recorded.Notes,
            recorded.CreatedAt
        ));
    }

    public async Task<Results<NoContent, NotFound, Conflict<ProblemDetails>, UnauthorizedHttpResult>> CancelBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        CancelBookingRequest request,
        CancellationToken ct)
    {
        var booking = await _repository.GetBookingEntityByIdAsync(bookingId, complexId, ct);
        if (booking is null)
        {
            return TypedResults.NotFound();
        }

        if (booking.Status == "cancelled")
        {
            return TypedResults.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Reserva ya cancelada",
                Detail = "Esta reserva ya se encuentra en estado cancelado."
            });
        }

        var now = DateTimeOffset.UtcNow;
        Payment? refundPayment = null;

        if (request.RefundDeposit && booking.DepositAmount > 0)
        {
            refundPayment = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = -booking.DepositAmount,
                PaymentMethod = request.RefundMethod ?? "cash",
                PaymentType = "refund",
                Status = "approved",
                Notes = $"Reembolso por cancelación: {request.Reason.Trim()}",
                CreatedAt = now,
                CreatedBy = userId
            };
        }

        var success = await _repository.CancelBookingAsync(bookingId, complexId, request.Reason, refundPayment, userId, now, ct);
        if (!success)
        {
            return TypedResults.NotFound();
        }

        _logger.LogInformation("Reserva {BookingId} cancelada exitosamente con reembolso {HadRefund}", bookingId, refundPayment != null);
        return TypedResults.NoContent();
    }

    public async Task<Results<Ok<BookingResponse>, NotFound, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> RescheduleBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        RescheduleBookingRequest request,
        CancellationToken ct)
    {
        var booking = await _repository.GetBookingEntityByIdAsync(bookingId, complexId, ct);
        if (booking is null)
        {
            return TypedResults.NotFound();
        }

        if (booking.Status == "cancelled")
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Reserva cancelada",
                Detail = "No se puede reprogramar una reserva cancelada."
            });
        }

        var now = DateTimeOffset.UtcNow;

        try
        {
            var success = await _repository.RescheduleBookingAsync(
                bookingId,
                complexId,
                request.CourtId,
                request.NewStartTimeUtc,
                request.NewEndTimeUtc,
                userId,
                now,
                ct);

            if (!success)
            {
                return TypedResults.NotFound();
            }

            _logger.LogInformation("Reserva {BookingId} reprogramada a cancha {CourtId} en {StartTime}", bookingId, request.CourtId, request.NewStartTimeUtc);
        }
        catch (PostgresException ex) when (ex.SqlState == "23P01")
        {
            _logger.LogWarning("Conflicto al reprogramar reserva {BookingId}: {Message}", bookingId, ex.Message);
            return TypedResults.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Horario no disponible",
                Detail = "La cancha seleccionada ya posee otro turno o bloqueo en el nuevo horario indicado."
            });
        }

        var detail = await _repository.GetBookingDetailByIdAsync(bookingId, complexId, ct);
        return TypedResults.Ok(detail!);
    }

    public async Task<Results<Ok<PriceQuoteResponse>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> GetPriceQuoteAsync(
        Guid complexId,
        PriceQuoteRequest request,
        CancellationToken ct)
    {
        var (price, ruleName, hasRule) = await _repository.GetPriceQuoteAsync(
            request.CourtId,
            request.SportId,
            (int)request.StartTimeUtc.DayOfWeek,
            TimeOnly.FromTimeSpan(request.StartTimeUtc.TimeOfDay),
            ct);

        return TypedResults.Ok(new PriceQuoteResponse(price, ruleName, hasRule));
    }

    public async Task<Results<Ok<IReadOnlyList<CustomerLookupDto>>, UnauthorizedHttpResult>> SearchCustomersAsync(
        Guid complexId,
        string searchTerm,
        CancellationToken ct)
    {
        var customers = await _repository.SearchCustomersAsync(complexId, searchTerm, ct);
        return TypedResults.Ok(customers);
    }
}
