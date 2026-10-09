using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MultiSport.Api.Features.Courts.Models.Dtos;

namespace MultiSport.Api.Features.Courts.Services;

public interface ICourtService
{
    Task<Results<Created<CourtResponse>, ValidationProblem, Conflict<ProblemDetails>, UnauthorizedHttpResult>> CreateCourtAsync(
        Guid complexId,
        Guid userId,
        CreateCourtRequest request,
        CancellationToken ct);

    Task<Results<Ok<CourtResponse>, NotFound, UnauthorizedHttpResult>> GetCourtByIdAsync(
        Guid courtId,
        Guid complexId,
        CancellationToken ct);

    Task<Results<Ok<CourtResponse>, NotFound, ValidationProblem, Conflict<ProblemDetails>, UnauthorizedHttpResult>> UpdateCourtAsync(
        Guid courtId,
        Guid complexId,
        Guid userId,
        UpdateCourtRequest request,
        CancellationToken ct);

    Task<Results<NoContent, NotFound, Conflict<ProblemDetails>, UnauthorizedHttpResult>> DeleteCourtAsync(
        Guid courtId,
        Guid complexId,
        Guid userId,
        CancellationToken ct);

    Task<IReadOnlyList<SportResponse>> GetAvailableSportsAsync(CancellationToken ct);

    Task<IReadOnlyList<CourtResponse>> GetCourtsAsync(Guid complexId, CancellationToken ct);
}
