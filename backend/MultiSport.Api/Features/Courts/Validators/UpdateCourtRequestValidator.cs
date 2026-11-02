using FluentValidation;
using MultiSport.Api.Common;
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
            .InclusiveBetween(30, 480).WithMessage("La duración del turno debe estar entre 30 y 480 minutos.")
            .Must(d => d % 15 == 0).WithMessage("La duración del turno debe configurarse en múltiplos de 15 minutos.");

        RuleFor(x => x.SportIds)
            .NotEmpty().WithMessage("Debe seleccionar al menos un deporte admitido.")
            .Must(sports => sports != null && sports.Distinct().Count() == sports.Count)
            .WithMessage("No se admiten deportes duplicados en la misma cancha.");

        RuleFor(x => x.PricingTiers)
            .NotEmpty().WithMessage("Debe configurar al menos una franja horaria de disponibilidad.")
            .Must(tiers => tiers == null || !CreateCourtRequestValidator.HasInternalTierOverlaps(tiers))
            .WithMessage("Existen franjas horarias superpuestas para el mismo día y disciplina.");

        RuleForEach(x => x.PricingTiers).ChildRules(tier =>
        {
            tier.RuleFor(t => t.DayOfWeek)
                .InclusiveBetween(0, 6)
                .WithMessage("El día de la semana debe ser un valor entre 0 (Domingo) y 6 (Sábado).");

            tier.RuleFor(t => t.Price)
                .GreaterThan(0)
                .WithMessage("El precio de cada franja horaria debe ser mayor a $0.");

            tier.RuleFor(t => t.StartTime)
                .Must(ComplexTimeHelper.IsQuarterHourAligned)
                .WithMessage("El horario de apertura de la franja debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

            tier.RuleFor(t => t.EndTime)
                .Must(ComplexTimeHelper.IsQuarterHourAligned)
                .WithMessage("El horario de cierre de la franja debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

            tier.RuleFor(t => t.DurationMinutes)
                .InclusiveBetween(30, 480)
                .Must(d => !d.HasValue || d.Value % 15 == 0)
                .When(t => t.DurationMinutes.HasValue)
                .WithMessage("La duración personalizada debe estar entre 30 y 480 minutos en múltiplos de 15.");

            tier.RuleFor(t => t)
                .Must(t => t.StartTime != t.EndTime)
                .WithMessage("El horario de inicio y fin de una franja horaria no pueden ser idénticos.");
        });

        RuleFor(x => x)
            .Must(req => req.PricingTiers == null || req.SportIds == null || req.PricingTiers.All(t => !t.SportId.HasValue || req.SportIds.Contains(t.SportId.Value)))
            .WithMessage("Las franjas horarias configuradas por deporte deben corresponder a disciplinas admitidas en la cancha.");

        // Modalidad Precio Base (sin tarifas personalizadas por deporte)
        When(x => x.CustomSportPrices == null || x.CustomSportPrices.Count == 0, () =>
        {
            RuleFor(x => x.BasePrice)
                .GreaterThan(0)
                .WithMessage("El precio base de la cancha debe ser mayor a $0.");

            RuleFor(x => x.PricingTiers)
                .Must(tiers => tiers == null || tiers.All(t => !t.SportId.HasValue))
                .WithMessage("En la modalidad de precio base general, las franjas horarias deben aplicar a todas las disciplinas (sin deporte específico).");
        });

        // Modalidad Tarifas Personalizadas por deporte
        When(x => x.CustomSportPrices != null && x.CustomSportPrices.Count > 0, () =>
        {
            RuleFor(x => x.CustomSportPrices!)
                .Must(configs => configs.Select(c => c.SportId).Distinct().Count() == configs.Count)
                .WithMessage("No se admiten configuraciones duplicadas para el mismo deporte.");

            RuleFor(x => x)
                .Must(req =>
                    req.SportIds != null &&
                    req.CustomSportPrices != null &&
                    req.CustomSportPrices.Count == req.SportIds.Count &&
                    req.CustomSportPrices.Select(c => c.SportId).ToHashSet().SetEquals(req.SportIds))
                .WithMessage("En la modalidad de tarifas personalizadas, debe especificar el precio y duración para cada uno de los deportes seleccionados.");

            RuleForEach(x => x.CustomSportPrices!).ChildRules(config =>
            {
                config.RuleFor(c => c.BasePrice)
                    .NotNull().WithMessage("El precio base personalizado del deporte es obligatorio.")
                    .GreaterThan(0).WithMessage("El precio base personalizado para el deporte debe ser mayor a $0.");

                config.RuleFor(c => c.DurationMinutes)
                    .NotNull().WithMessage("La duración personalizada del deporte es obligatoria.")
                    .InclusiveBetween(30, 480).WithMessage("La duración personalizada del deporte debe estar entre 30 y 480 minutos.")
                    .Must(d => !d.HasValue || d.Value % 15 == 0).WithMessage("La duración del deporte debe ser múltiplo de 15 minutos.");
            });

            RuleFor(x => x.PricingTiers)
                .Must(tiers => tiers == null || tiers.All(t => t.SportId.HasValue))
                .WithMessage("En la modalidad de tarifas personalizadas, cada franja horaria debe estar asociada obligatoriamente a un deporte específico.");

            RuleFor(x => x)
                .Must(req =>
                    req.SportIds == null ||
                    req.PricingTiers == null ||
                    req.SportIds.All(sportId => req.PricingTiers.Any(t => t.SportId == sportId)))
                .WithMessage("En la modalidad de tarifas personalizadas, cada deporte seleccionado debe tener al menos una franja horaria configurada.");
        });
    }
}
