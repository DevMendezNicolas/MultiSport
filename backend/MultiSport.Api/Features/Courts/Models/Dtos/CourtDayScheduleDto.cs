namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CourtDayScheduleDto(
    int DayOfWeek,
    TimeOnly FirstShiftStart,
    TimeOnly LastShiftStart,
    decimal? PriceOverride = null,
    int? DurationMinutesOverride = null
);
