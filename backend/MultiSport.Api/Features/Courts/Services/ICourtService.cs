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

    Task<IReadOnlyList<SportResponse>> GetAvailableSportsAsync(CancellationToken ct);

    Task<IReadOnlyList<CourtResponse>> GetCourtsAsync(Guid complexId, CancellationToken ct);
}
