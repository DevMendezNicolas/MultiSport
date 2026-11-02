using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MultiSport.Api.Common;
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

        var (startOfDayUtc, endOfDayUtc) = ComplexTimeHelper.GetComplexDayBoundsUtc(date);
        var targetDayOfWeek = (int)date.DayOfWeek;

        var actualBookings = await _repository.GetBookingsForDateRangeAsync(complexId, startOfDayUtc, endOfDayUtc, ct);
        var recurringRules = await _repository.GetActiveRecurringRulesForDayAsync(complexId, targetDayOfWeek, ct);

        var courtItems = new List<DailyGridCourtItem>();

        foreach (var court in courts)
        {
            var courtBookings = actualBookings
                .Where(b => b.CourtId == court.CourtId)
                .ToList();

            var courtRules = recurringRules.Where(r => r.CourtId == court.CourtId);
            foreach (var rule in courtRules)
            {
                var projectedSlices = ComplexTimeHelper.ProjectRecurringRuleOntoLocalDay(
                    rule.DayOfWeek,
                    rule.StartTime.ToTimeSpan(),
                    rule.EndTime.ToTimeSpan(),
                    targetDayOfWeek);

                foreach (var slice in projectedSlices)
                {
                    var ruleStartUtc = ComplexTimeHelper.CombineComplexLocalToUtc(date, slice.Start);
                    var ruleEndUtc = ComplexTimeHelper.CombineComplexLocalToUtc(date, slice.End);

                    var overlapsExisting = courtBookings.Any(b =>
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
        var localStartTime = ComplexTimeHelper.ToComplexLocal(request.StartTimeUtc);
        var localEndTime = ComplexTimeHelper.ToComplexLocal(request.EndTimeUtc);

        // 1. Obtener o cotizar precio según la franja en la que comienza el turno
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
                (int)localStartTime.DayOfWeek,
                TimeOnly.FromTimeSpan(localStartTime.TimeOfDay),
                ct);
            totalPrice = quotedPrice;
        }

        if (request.DepositAmount > totalPrice)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Monto de seña inválido",
                Detail = "El monto de la seña o pago inicial no puede superar el valor total del turno."
            });
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

        RecurringBookingRule? recurringRule = null;
        if (request.IsRecurring)
        {
            recurringRule = new RecurringBookingRule
            {
                Id = Guid.NewGuid(),
                ComplexId = complexId,
                CourtId = request.CourtId,
                SportId = request.SportId,
                CustomerName = request.CustomerName.Trim(),
                CustomerPhone = request.CustomerPhone.Trim(),
                DayOfWeek = (int)localStartTime.DayOfWeek,
                StartTime = TimeOnly.FromTimeSpan(localStartTime.TimeOfDay),
                EndTime = TimeOnly.FromTimeSpan(localEndTime.TimeOfDay),
                Price = totalPrice,
                IsActive = true,
                Notes = request.Notes?.Trim(),
                CreatedAt = now,
                CreatedBy = userId,
                UpdatedAt = now,
                UpdatedBy = userId
            };
        }

        try
        {
            var writeResult = await _repository.CreateBookingWithOptionalPaymentAsync(
                booking,
                payment,
                customer,
                recurringRule,
                ct);

            if (writeResult.Status != BookingWriteStatus.Success)
            {
                if (writeResult.Status == BookingWriteStatus.RecurringRuleConflict)
                {
                    return TypedResults.Conflict(new ProblemDetails
                    {
                        Status = StatusCodes.Status409Conflict,
                        Title = "Conflicto con turno fijo",
                        Detail = writeResult.ErrorMessage
                    });
                }

                return TypedResults.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Horario o configuración no disponible",
                    Detail = writeResult.ErrorMessage
                });
            }

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
        var now = DateTimeOffset.UtcNow;
        var blockBooking = new Booking
        {
            Id = Guid.NewGuid(),
            ComplexId = complexId,
            CourtId = request.CourtId,
            SportId = Guid.Empty,
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
            var writeResult = await _repository.CreateBookingWithOptionalPaymentAsync(
                blockBooking,
                null,
                null,
                null,
                ct);

            if (writeResult.Status != BookingWriteStatus.Success)
            {
                if (writeResult.Status == BookingWriteStatus.RecurringRuleConflict)
                {
                    return TypedResults.Conflict(new ProblemDetails
                    {
                        Status = StatusCodes.Status409Conflict,
                        Title = "Conflicto con turno fijo",
                        Detail = writeResult.ErrorMessage
                    });
                }

                return TypedResults.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Bloqueo fuera de horario operativo",
                    Detail = writeResult.ErrorMessage
                });
            }

            _logger.LogInformation("Bloqueo operativo creado {BookingId} en cancha {CourtId}", blockBooking.Id, request.CourtId);
        }
        catch (PostgresException ex) when (ex.SqlState == "23P01")
        {
            _logger.LogWarning("Conflicto al crear bloqueo operativo en cancha {CourtId}: {Message}", request.CourtId, ex.Message);
            return TypedResults.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Horario no disponible para bloqueo",
                Detail = "No se puede bloquear este rango horario porque ya posee un turno confirmado o bloqueo activo."
            });
        }

        var createdDetail = await _repository.GetBookingDetailByIdAsync(blockBooking.Id, complexId, ct);
        return TypedResults.Created($"/api/v1/bookings/{blockBooking.Id}", createdDetail!);
    }

    public async Task<Results<Ok<BookingResponse>, NotFound, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> UpdateBlockAsync(
        Guid bookingId,
        Guid complexId,
        Guid userId,
        UpdateBlockRequest request,
        CancellationToken ct)
    {
        var existing = await _repository.GetBookingEntityByIdAsync(bookingId, complexId, ct);
        if (existing is null)
        {
            return TypedResults.NotFound();
        }

        if (existing.Status != "blocked")
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Operación no válida",
                Detail = "El registro seleccionado no corresponde a un bloqueo operativo activo."
            });
        }

        var now = DateTimeOffset.UtcNow;

        try
        {
            var writeResult = await _repository.UpdateBlockAsync(
                bookingId,
                complexId,
                existing.CourtId,
                request.CourtId,
                request.StartTimeUtc,
                request.EndTimeUtc,
                request.Reason,
                userId,
                now,
                ct);

            if (writeResult.Status == BookingWriteStatus.NotFound)
            {
                return TypedResults.NotFound();
            }

            if (writeResult.Status != BookingWriteStatus.Success)
            {
                if (writeResult.Status == BookingWriteStatus.RecurringRuleConflict)
                {
                    return TypedResults.Conflict(new ProblemDetails
                    {
                        Status = StatusCodes.Status409Conflict,
                        Title = "Conflicto con turno fijo",
                        Detail = writeResult.ErrorMessage
                    });
                }

                return TypedResults.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Bloqueo fuera de horario operativo",
                    Detail = writeResult.ErrorMessage
                });
            }

            _logger.LogInformation("Bloqueo operativo {BookingId} actualizado exitosamente en cancha {CourtId}", bookingId, request.CourtId);
        }
        catch (PostgresException ex) when (ex.SqlState == "23P01")
        {
            _logger.LogWarning("Conflicto al actualizar bloqueo operativo {BookingId}: {Message}", bookingId, ex.Message);
            return TypedResults.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Horario no disponible para bloqueo",
                Detail = "El nuevo rango horario seleccionado se superpone con un turno confirmado u otro bloqueo activo."
            });
        }

        var updatedDetail = await _repository.GetBookingDetailByIdAsync(bookingId, complexId, ct);
        return TypedResults.Ok(updatedDetail!);
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

        if (booking.Status == "cancelled" || booking.Status == "blocked")
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Operación no permitida",
                Detail = booking.Status == "blocked"
                    ? "No se pueden registrar pagos sobre un bloqueo operativo."
                    : "No se pueden registrar pagos en reservas canceladas."
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
                Title = "Registro ya cancelado",
                Detail = "Este turno o bloqueo ya se encuentra cancelado."
            });
        }

        var now = DateTimeOffset.UtcNow;
        Payment? refundPayment = null;

        // Los bloqueos operativos nunca generan reembolsos ni movimientos financieros
        if (booking.Status != "blocked" && request.RefundDeposit && booking.DepositAmount > 0)
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

        _logger.LogInformation("Registro {BookingId} ({Status}) cancelado exitosamente", bookingId, booking.Status);
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

        if (booking.Status == "blocked")
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Operación no válida para bloqueos",
                Detail = "Para modificar un bloqueo operativo utilice la edición de bloqueos."
            });
        }

        var now = DateTimeOffset.UtcNow;

        try
        {
            var writeResult = await _repository.RescheduleBookingAsync(
                bookingId,
                complexId,
                booking.CourtId,
                request.CourtId,
                booking.SportId,
                request.NewStartTimeUtc,
                request.NewEndTimeUtc,
                userId,
                now,
                ct);

            if (writeResult.Status == BookingWriteStatus.NotFound)
            {
                return TypedResults.NotFound();
            }

            if (writeResult.Status != BookingWriteStatus.Success)
            {
                if (writeResult.Status == BookingWriteStatus.RecurringRuleConflict)
                {
                    return TypedResults.Conflict(new ProblemDetails
                    {
                        Status = StatusCodes.Status409Conflict,
                        Title = "Conflicto con turno fijo",
                        Detail = writeResult.ErrorMessage
                    });
                }

                return TypedResults.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Horario no disponible",
                    Detail = writeResult.ErrorMessage
                });
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
        var localStartTime = ComplexTimeHelper.ToComplexLocal(request.StartTimeUtc);
        var (price, ruleName, hasRule) = await _repository.GetPriceQuoteAsync(
            request.CourtId,
            request.SportId,
            (int)localStartTime.DayOfWeek,
            TimeOnly.FromTimeSpan(localStartTime.TimeOfDay),
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
