using FluentValidation;
using MultiSport.Api.Features.Courts.Models.Dtos;

namespace MultiSport.Api.Features.Courts.Validators;

public sealed class UpdateCourtRequestValidator : AbstractValidator<UpdateCourtRequest>
{
    public UpdateCourtRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre de la cancha es requerido.")
            .Length(2, 100).WithMessage("El nombre debe tener entre 2 y 100 caracteres.");

        RuleFor(x => x.SurfaceType)
            .NotEmpty().WithMessage("El tipo de superficie es requerido.")
            .MaximumLength(50).WithMessage("El tipo de superficie no puede exceder 50 caracteres.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("El precio base de la cancha no puede ser negativo.");

        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0).WithMessage("La duración del turno debe ser mayor a 0 minutos.")
            .LessThanOrEqualTo(480).WithMessage("La duración del turno no puede superar 480 minutos.");

        RuleFor(x => x.SportIds)
            .NotEmpty().WithMessage("Debe seleccionar al menos un deporte admitido.")
            .Must(sports => sports != null && sports.Distinct().Count() == sports.Count)
            .WithMessage("No se admiten deportes duplicados en la misma cancha.");

        RuleFor(x => x.PricingTiers)
            .NotEmpty().WithMessage("Debe configurar al menos una franja horaria de disponibilidad.")
            .Must(tiers => tiers == null || !HasInternalTierOverlaps(tiers))
            .WithMessage("Existen franjas horarias superpuestas para el mismo día y disciplina.");

        RuleForEach(x => x.PricingTiers).ChildRules(tier =>
        {
            tier.RuleFor(t => t.DayOfWeek)
                .InclusiveBetween(0, 6)
                .WithMessage("El día de la semana debe ser un valor entre 0 (Domingo) y 6 (Sábado).");

            tier.RuleFor(t => t.Price)
                .GreaterThanOrEqualTo(0)
                .WithMessage("El precio de la franja horaria no puede ser negativo.");

            tier.RuleFor(t => t.DurationMinutes)
                .GreaterThan(0)
                .LessThanOrEqualTo(480)
                .When(t => t.DurationMinutes.HasValue)
                .WithMessage("La duración personalizada debe ser mayor a 0 y no superar 480 minutos.");

            tier.RuleFor(t => t)
                .Must(t => t.StartTime != t.EndTime)
                .WithMessage("El horario de inicio y fin de una franja horaria no pueden ser idénticos.");
        });

        RuleFor(x => x)
            .Must(req => req.PricingTiers == null || req.PricingTiers.All(t => !t.SportId.HasValue || req.SportIds.Contains(t.SportId.Value)))
            .WithMessage("Las franjas horarias configuradas por deporte deben corresponder a disciplinas admitidas en la cancha.");

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

    private static bool HasInternalTierOverlaps(IEnumerable<CourtPricingTierDto> tiers)
    {
        var groupedBySport = tiers.GroupBy(t => t.SportId);

        foreach (var sportGroup in groupedBySport)
        {
            var intervalsByDay = new List<(int DayOfWeek, int StartMins, int EndMins)>();

            foreach (var tier in sportGroup)
            {
                var start = tier.StartTime.Hour * 60 + tier.StartTime.Minute;
                var end = tier.EndTime == TimeOnly.MinValue ? 1440 : (tier.EndTime.Hour * 60 + tier.EndTime.Minute);

                if (end > start)
                {
                    intervalsByDay.Add((tier.DayOfWeek, start, end));
                }
                else
                {
                    intervalsByDay.Add((tier.DayOfWeek, start, 1440));
                    var nextDay = (tier.DayOfWeek + 1) % 7;
                    intervalsByDay.Add((nextDay, 0, end));
                }
            }

            var byDay = intervalsByDay.GroupBy(i => i.DayOfWeek);
            foreach (var dayGroup in byDay)
            {
                var list = dayGroup.OrderBy(i => i.StartMins).ToList();
                for (var i = 0; i < list.Count; i++)
                {
                    for (var j = i + 1; j < list.Count; j++)
                    {
                        if (Math.Max(list[i].StartMins, list[j].StartMins) < Math.Min(list[i].EndMins, list[j].EndMins))
                        {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }
}
