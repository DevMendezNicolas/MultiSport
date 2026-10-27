using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using MultiSport.Api.Features.Complexes.Models.Dtos;
using MultiSport.Api.Features.Complexes.Services;

namespace MultiSport.Api.Features.Complexes.Endpoints;

public static class ComplexEndpoints
{
    public static IEndpointRouteBuilder MapComplexEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/complexes")
            .WithTags("Complexes")
            .RequireAuthorization();

        group.MapGet("/profile", GetProfile)
            .WithName("GetComplexProfile")
            .WithSummary("Obtiene el perfil general y horarios del complejo autenticado")
            .Produces<ComplexProfileResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/profile", UpdateProfile)
            .WithName("UpdateComplexFullProfile")
            .WithSummary("Actualiza los datos institucionales, de contacto y cobro del complejo")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/schedules", UpdateSchedules)
            .WithName("UpdateComplexSchedules")
            .WithSummary("Actualiza la grilla de horarios de atención del predio")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<Results<Ok<ComplexProfileResponse>, NotFound, UnauthorizedHttpResult>> GetProfile(
        IComplexService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        return await service.GetProfileAsync(complexId, ct);
    }

    private static async Task<Results<NoContent, ValidationProblem, NotFound, UnauthorizedHttpResult>> UpdateProfile(
        [FromBody] UpdateComplexProfileRequest request,
        IValidator<UpdateComplexProfileRequest> validator,
        IComplexService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.UpdateProfileAsync(complexId, request, ct);
        return result.Result switch
        {
            NoContent => TypedResults.NoContent(),
            NotFound => TypedResults.NotFound(),
            _ => TypedResults.Unauthorized()
        };
    }

    private static async Task<Results<NoContent, ValidationProblem, NotFound, UnauthorizedHttpResult>> UpdateSchedules(
        [FromBody] UpdateComplexSchedulesRequest request,
        IValidator<UpdateComplexSchedulesRequest> validator,
        IComplexService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.UpdateSchedulesAsync(complexId, request, ct);
        return result.Result switch
        {
            NoContent => TypedResults.NoContent(),
            NotFound => TypedResults.NotFound(),
            _ => TypedResults.Unauthorized()
        };
    }
}
