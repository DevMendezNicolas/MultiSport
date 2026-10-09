using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using MultiSport.Api.Features.Courts.Models.Dtos;
using MultiSport.Api.Features.Courts.Services;

namespace MultiSport.Api.Features.Courts.Endpoints;

public static class CourtsEndpoints
{
    public static IEndpointRouteBuilder MapCourtsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/courts")
                       .WithTags("Courts")
                       .RequireAuthorization();

        group.MapPost("/", CreateCourt)
             .WithName("CreateCourt")
             .WithSummary("Crea una nueva cancha deportiva para el complejo autenticado")
             .Produces<CourtResponse>(StatusCodes.Status201Created)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapGet("/", GetCourts)
             .WithName("GetCourts")
             .WithSummary("Obtiene las canchas registradas del complejo autenticado")
             .Produces<IReadOnlyList<CourtResponse>>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:guid}", GetCourtById)
             .WithName("GetCourtById")
             .WithSummary("Obtiene el detalle completo de una cancha específica del complejo autenticado")
             .Produces<CourtResponse>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/{id:guid}", UpdateCourt)
             .WithName("UpdateCourt")
             .WithSummary("Modifica la configuración física, disciplinas y tarifas de una cancha")
             .Produces<CourtResponse>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapDelete("/{id:guid}", DeleteCourt)
             .WithName("DeleteCourt")
             .WithSummary("Da de baja lógica una cancha deportiva comprobando ausencia de turnos futuros")
             .Produces(StatusCodes.Status204NoContent)
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound)
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapGet("/sports", GetAvailableSports)
             .WithName("GetAvailableSports")
             .WithSummary("Obtiene el catálogo de deportes disponibles para asociar a canchas")
             .Produces<IReadOnlyList<SportResponse>>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static async Task<Results<Created<CourtResponse>, ValidationProblem, Conflict<ProblemDetails>, UnauthorizedHttpResult>> CreateCourt(
        [FromBody] CreateCourtRequest request,
        IValidator<CreateCourtRequest> validator,
        ICourtService service,
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

        return await service.CreateCourtAsync(complexId, userId, request, ct);
    }

    private static async Task<Results<Ok<CourtResponse>, NotFound, UnauthorizedHttpResult>> GetCourtById(
        Guid id,
        ICourtService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        return await service.GetCourtByIdAsync(id, complexId, ct);
    }

    private static async Task<Results<Ok<CourtResponse>, NotFound, ValidationProblem, Conflict<ProblemDetails>, UnauthorizedHttpResult>> UpdateCourt(
        Guid id,
        [FromBody] UpdateCourtRequest request,
        IValidator<UpdateCourtRequest> validator,
        ICourtService service,
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

        return await service.UpdateCourtAsync(id, complexId, userId, request, ct);
    }

    private static async Task<Results<NoContent, NotFound, Conflict<ProblemDetails>, UnauthorizedHttpResult>> DeleteCourt(
        Guid id,
        ICourtService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId) || !Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        return await service.DeleteCourtAsync(id, complexId, userId, ct);
    }

    private static async Task<Results<Ok<IReadOnlyList<CourtResponse>>, UnauthorizedHttpResult>> GetCourts(
        ICourtService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;

        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        var courts = await service.GetCourtsAsync(complexId, ct);
        return TypedResults.Ok(courts);
    }

    private static async Task<Ok<IReadOnlyList<SportResponse>>> GetAvailableSports(
        ICourtService service,
        CancellationToken ct)
    {
        var sports = await service.GetAvailableSportsAsync(ct);
        return TypedResults.Ok(sports);
    }
}
