namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CreateCourtRequest(
    string Name,
    string SurfaceType,
    bool IsCovered,
    bool HasLighting,
    int BufferMinutes,
    decimal BasePrice,
    int DurationMinutes,
    IReadOnlyList<Guid> SportIds,
    IReadOnlyList<CourtDayScheduleDto> Schedules,
    IReadOnlyList<CourtSportConfigDto>? CustomSportPrices = null
);
