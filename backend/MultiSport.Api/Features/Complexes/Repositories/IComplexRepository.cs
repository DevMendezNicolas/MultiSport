using MultiSport.Api.Features.Complexes.Models.Dtos;

namespace MultiSport.Api.Features.Complexes.Repositories;

public interface IComplexRepository
{
    Task<ComplexProfileResponse?> GetProfileAsync(Guid complexId, CancellationToken ct);
    Task<bool> UpdateProfileAsync(Guid complexId, UpdateComplexProfileRequest request, CancellationToken ct);
    Task<bool> UpsertSchedulesAsync(Guid complexId, IEnumerable<ComplexScheduleItemDto> schedules, CancellationToken ct);
}
