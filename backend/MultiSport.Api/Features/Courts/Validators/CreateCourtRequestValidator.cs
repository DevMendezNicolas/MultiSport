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
    }
}
