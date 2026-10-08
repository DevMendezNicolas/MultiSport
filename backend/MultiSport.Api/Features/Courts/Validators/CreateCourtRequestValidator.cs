using FluentValidation;
using MultiSport.Api.Features.Courts.Models.Dtos;

namespace MultiSport.Api.Features.Courts.Validators;

public sealed class CreateCourtRequestValidator : AbstractValidator<CreateCourtRequest>
{
    public CreateCourtRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre de la cancha es requerido.")
            .Length(2, 100).WithMessage("El nombre debe tener entre 2 y 100 caracteres.");

        RuleFor(x => x.SurfaceType)
            .NotEmpty().WithMessage("El tipo de superficie es requerido.")
            .MaximumLength(50).WithMessage("El tipo de superficie no puede exceder 50 caracteres.");

        RuleFor(x => x.BufferMinutes)
            .GreaterThanOrEqualTo(0).WithMessage("El buffer entre turnos no puede ser negativo.")
            .LessThanOrEqualTo(120).WithMessage("El buffer no puede superar los 120 minutos.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("El precio base de la cancha no puede ser negativo.");

        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0).WithMessage("La duración del turno debe ser mayor a 0 minutos.")
            .LessThanOrEqualTo(480).WithMessage("La duración del turno no puede superar 480 minutos.");

        RuleFor(x => x.SportIds)
            .NotEmpty().WithMessage("Debe seleccionar al menos un deporte admitido.")
            .Must(sports => sports != null && sports.Distinct().Count() == sports.Count)
            .WithMessage("No se admiten deportes duplicados en la misma cancha.");

        RuleFor(x => x.Schedules)
            .NotEmpty().WithMessage("Debe configurar al menos un día y horario de disponibilidad.")
            .Must(schedules => schedules == null || schedules.Select(s => s.DayOfWeek).Distinct().Count() == schedules.Count)
            .WithMessage("No se admiten días duplicados en la configuración de disponibilidad.");

        RuleForEach(x => x.Schedules).ChildRules(schedule =>
        {
            schedule.RuleFor(s => s.DayOfWeek)
                .InclusiveBetween(0, 6)
                .WithMessage("El día de la semana debe ser un valor entre 0 (Domingo) y 6 (Sábado).");

            schedule.RuleFor(s => s.PriceOverride)
                .GreaterThanOrEqualTo(0)
                .When(s => s.PriceOverride.HasValue)
                .WithMessage("El precio personalizado no puede ser negativo.");

            schedule.RuleFor(s => s.DurationMinutesOverride)
                .GreaterThan(0)
                .LessThanOrEqualTo(480)
                .When(s => s.DurationMinutesOverride.HasValue)
                .WithMessage("La duración personalizada debe ser mayor a 0 y no superar 480 minutos.");
        });

        When(x => x.CustomSportPrices != null, () =>
        {
            RuleFor(x => x.CustomSportPrices!)
                .Must(configs => configs.Select(c => c.SportId).Distinct().Count() == configs.Count)
                .WithMessage("No se admiten configuraciones duplicadas para el mismo deporte.");

            RuleForEach(x => x.CustomSportPrices!).ChildRules(config =>
            {
                config.RuleFor(c => c.BasePrice)
                    .GreaterThanOrEqualTo(0)
                    .When(c => c.BasePrice.HasValue)
                    .WithMessage("El precio base personalizado para el deporte no puede ser negativo.");

                config.RuleFor(c => c.DurationMinutes)
                    .GreaterThan(0)
                    .LessThanOrEqualTo(480)
                    .When(c => c.DurationMinutes.HasValue)
                    .WithMessage("La duración personalizada para el deporte debe ser mayor a 0 y no superar 480 minutos.");
            });

            RuleFor(x => x)
                .Must(req => req.CustomSportPrices == null || req.CustomSportPrices.All(c => req.SportIds.Contains(c.SportId)))
                .WithMessage("Las tarifas personalizadas deben corresponder a los deportes seleccionados para la cancha.");
        });
    }
}
