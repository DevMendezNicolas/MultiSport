using FluentValidation;

namespace MultiSport.Api.Features.Complexes.Models.Dtos;

public sealed record UpdateComplexSchedulesRequest(
    IReadOnlyList<ComplexScheduleItemDto> Schedules
);

public sealed class UpdateComplexSchedulesRequestValidator : AbstractValidator<UpdateComplexSchedulesRequest>
{
    public UpdateComplexSchedulesRequestValidator()
    {
        RuleFor(x => x.Schedules)
            .NotNull().WithMessage("La lista de horarios no puede ser nula.")
            .Must(s => s != null && s.Count <= 7).WithMessage("No pueden enviarse más de 7 días.");

        RuleForEach(x => x.Schedules).ChildRules(schedule =>
        {
            schedule.RuleFor(s => s.DayOfWeek)
                .InclusiveBetween(0, 6).WithMessage("El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado).");
        });
    }
}
