using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using MultiSport.Api.Features.Complexes.Models.Dtos;

namespace MultiSport.Api.Features.Complexes.Services;

public interface IComplexService
{
    Task<Results<Ok<ComplexProfileResponse>, NotFound, UnauthorizedHttpResult>> GetProfileAsync(
        Guid complexId,
        CancellationToken ct);

    Task<Results<NoContent, NotFound, UnauthorizedHttpResult>> UpdateProfileAsync(
        Guid complexId,
        UpdateComplexProfileRequest request,
        CancellationToken ct);

    Task<Results<NoContent, NotFound, UnauthorizedHttpResult>> UpdateSchedulesAsync(
        Guid complexId,
        UpdateComplexSchedulesRequest request,
        CancellationToken ct);
}
