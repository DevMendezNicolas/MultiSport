namespace MultiSport.Api.Features.Complexes.Models.Dtos;

public sealed record ComplexScheduleItemDto(
    int DayOfWeek,
    TimeOnly OpeningTime,
    TimeOnly ClosingTime,
    bool IsClosed
);
