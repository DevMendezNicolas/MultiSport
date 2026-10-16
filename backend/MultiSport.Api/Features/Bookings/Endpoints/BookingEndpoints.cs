using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using MultiSport.Api.Features.Bookings.Models.Dtos;
using MultiSport.Api.Features.Bookings.Services;

namespace MultiSport.Api.Features.Bookings.Endpoints;

public static class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/bookings")
                       .WithTags("Bookings")
                       .RequireAuthorization();

        group.MapGet("/grid", GetDailyGrid)
             .WithName("GetDailyGrid")
             .WithSummary("Obtiene la grilla operativa de turnos por cancha para un día específico")
             .Produces<DailyGridResponse>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:guid}", GetBookingById)
             .WithName("GetBookingById")
             .WithSummary("Obtiene el detalle completo de una reserva, pagos y saldos")
             .Produces<BookingResponse>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateBooking)
             .WithName("CreateBooking")
             .WithSummary("Registra una nueva reserva con validación GiST y registro opcional de seña")
             .Produces<BookingResponse>(StatusCodes.Status201Created)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPost("/block", CreateBlock)
             .WithName("CreateBlock")
             .WithSummary("Genera un bloqueo de mantenimiento u operativo para una cancha")
             .Produces<BookingResponse>(StatusCodes.Status201Created)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPost("/{id:guid}/payments", RecordPayment)
             .WithName("RecordBookingPayment")
             .WithSummary("Registra un pago parcial, total o seña para una reserva")
             .Produces<PaymentResponse>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound)
             .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapPost("/{id:guid}/cancel", CancelBooking)
             .WithName("CancelBooking")
             .WithSummary("Cancela una reserva con opción de retención o reembolso negativo de seña")
             .Produces(StatusCodes.Status204NoContent)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPost("/{id:guid}/reschedule", RescheduleBooking)
             .WithName("RescheduleBooking")
             .WithSummary("Reprograma una reserva a otra cancha u horario validando colisiones GiST")
             .Produces<BookingResponse>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPost("/quote", GetPriceQuote)
             .WithName("GetPriceQuote")
             .WithSummary("Cotiza dinámicamente el precio del turno según reglas de franja y tarifas base")
             .Produces<PriceQuoteResponse>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/customers", SearchCustomers)
             .WithName("SearchCustomers")
             .WithSummary("Busca clientes frecuentes del complejo por teléfono o nombre para autocompletado")
             .Produces<IReadOnlyList<CustomerLookupDto>>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static async Task<Results<Ok<DailyGridResponse>, UnauthorizedHttpResult>> GetDailyGrid(
        [FromQuery] DateOnly? date,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return await service.GetDailyGridAsync(complexId, targetDate, ct);
    }

    private static async Task<Results<Ok<BookingResponse>, NotFound, UnauthorizedHttpResult>> GetBookingById(
        Guid id,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        return await service.GetBookingByIdAsync(id, complexId, ct);
    }

    private static async Task<Results<Created<BookingResponse>, ValidationProblem, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> CreateBooking(
        [FromBody] CreateBookingRequest request,
        IValidator<CreateBookingRequest> validator,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId) || !Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.CreateBookingAsync(complexId, userId, request, ct);
        return result.Result switch
        {
            Created<BookingResponse> created => created,
            Conflict<ProblemDetails> conflict => conflict,
            BadRequest<ProblemDetails> badRequest => badRequest,
            UnauthorizedHttpResult unauthorized => unauthorized,
            _ => throw new InvalidOperationException("Respuesta inesperada del servicio de reservas.")
        };
    }

    private static async Task<Results<Created<BookingResponse>, ValidationProblem, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> CreateBlock(
        [FromBody] CreateBlockRequest request,
        IValidator<CreateBlockRequest> validator,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId) || !Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.CreateBlockAsync(complexId, userId, request, ct);
        return result.Result switch
        {
            Created<BookingResponse> created => created,
            Conflict<ProblemDetails> conflict => conflict,
            BadRequest<ProblemDetails> badRequest => badRequest,
            UnauthorizedHttpResult unauthorized => unauthorized,
            _ => throw new InvalidOperationException("Respuesta inesperada del servicio de reservas.")
        };
    }

    private static async Task<Results<Ok<PaymentResponse>, ValidationProblem, NotFound, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> RecordPayment(
        Guid id,
        [FromBody] RecordPaymentRequest request,
        IValidator<RecordPaymentRequest> validator,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId) || !Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.RecordPaymentAsync(id, complexId, userId, request, ct);
        return result.Result switch
        {
            Ok<PaymentResponse> ok => ok,
            NotFound notFound => notFound,
            BadRequest<ProblemDetails> badRequest => badRequest,
            UnauthorizedHttpResult unauthorized => unauthorized,
            _ => throw new InvalidOperationException("Respuesta inesperada del servicio de reservas.")
        };
    }

    private static async Task<Results<NoContent, ValidationProblem, NotFound, Conflict<ProblemDetails>, UnauthorizedHttpResult>> CancelBooking(
        Guid id,
        [FromBody] CancelBookingRequest request,
        IValidator<CancelBookingRequest> validator,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId) || !Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.CancelBookingAsync(id, complexId, userId, request, ct);
        return result.Result switch
        {
            NoContent noContent => noContent,
            NotFound notFound => notFound,
            Conflict<ProblemDetails> conflict => conflict,
            UnauthorizedHttpResult unauthorized => unauthorized,
            _ => throw new InvalidOperationException("Respuesta inesperada del servicio de reservas.")
        };
    }

    private static async Task<Results<Ok<BookingResponse>, ValidationProblem, NotFound, Conflict<ProblemDetails>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> RescheduleBooking(
        Guid id,
        [FromBody] RescheduleBookingRequest request,
        IValidator<RescheduleBookingRequest> validator,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId) || !Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.RescheduleBookingAsync(id, complexId, userId, request, ct);
        return result.Result switch
        {
            Ok<BookingResponse> ok => ok,
            NotFound notFound => notFound,
            Conflict<ProblemDetails> conflict => conflict,
            BadRequest<ProblemDetails> badRequest => badRequest,
            UnauthorizedHttpResult unauthorized => unauthorized,
            _ => throw new InvalidOperationException("Respuesta inesperada del servicio de reservas.")
        };
    }

    private static async Task<Results<Ok<PriceQuoteResponse>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> GetPriceQuote(
        [FromBody] PriceQuoteRequest request,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        return await service.GetPriceQuoteAsync(complexId, request, ct);
    }

    private static async Task<Results<Ok<IReadOnlyList<CustomerLookupDto>>, UnauthorizedHttpResult>> SearchCustomers(
        [FromQuery] string? query,
        IBookingService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        return await service.SearchCustomersAsync(complexId, query ?? string.Empty, ct);
    }
}
