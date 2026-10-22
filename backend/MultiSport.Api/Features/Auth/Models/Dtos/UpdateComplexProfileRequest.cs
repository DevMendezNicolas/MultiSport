using FluentValidation;

namespace MultiSport.Api.Features.Auth.Models.Dtos;

public sealed record UpdateComplexProfileRequest(
    string? TaxId,
    string? CbuAlias,
    string? Address,
    string? Phone,
    string? City,
    string? LogoUrl
);

public sealed class UpdateComplexProfileRequestValidator : AbstractValidator<UpdateComplexProfileRequest>
{
    public UpdateComplexProfileRequestValidator()
    {
        RuleFor(x => x.TaxId)
            .MaximumLength(20).WithMessage("El CUIT no puede superar los 20 caracteres.");

        RuleFor(x => x.CbuAlias)
            .MaximumLength(50).WithMessage("El Alias/CBU no puede superar los 50 caracteres.");

        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("La dirección no puede superar los 255 caracteres.");

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("El teléfono no puede superar los 50 caracteres.");

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("La ciudad no puede superar los 100 caracteres.");
    }
}
