using FluentValidation;

namespace MultiSport.Api.Features.Auth.Models.Dtos;

public sealed record RegisterComplexRequest(
    string Name,
    string TaxId,
    string CbuAlias,
    string Address,
    string Phone,
    string City,
    string? LogoUrl,
    string Email,
    string Password,
    string ConfirmPassword
);

public sealed class RegisterComplexRequestValidator : AbstractValidator<RegisterComplexRequest>
{
    public RegisterComplexRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del complejo es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre no puede superar los 150 caracteres.");

        RuleFor(x => x.TaxId)
            .NotEmpty().WithMessage("El CUIT o identificación tributaria es obligatorio.")
            .MaximumLength(20).WithMessage("El CUIT no puede superar los 20 caracteres.");

        RuleFor(x => x.CbuAlias)
            .NotEmpty().WithMessage("El CBU/CVU o Alias es obligatorio.")
            .MaximumLength(50).WithMessage("El Alias/CBU no puede superar los 50 caracteres.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("La dirección es obligatoria.")
            .MaximumLength(255).WithMessage("La dirección no puede superar los 255 caracteres.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("El teléfono de contacto es obligatorio.")
            .MaximumLength(50).WithMessage("El teléfono no puede superar los 50 caracteres.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("La ciudad es obligatoria.")
            .MaximumLength(100).WithMessage("La ciudad no puede superar los 100 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .MaximumLength(255).WithMessage("El correo no puede superar los 255 caracteres.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña es obligatoria.")
            .MinimumLength(8).WithMessage("La contraseña debe tener al menos 8 caracteres.")
            .Matches("[A-Z]").WithMessage("La contraseña debe contener al menos una letra mayúscula.")
            .Matches("[a-z]").WithMessage("La contraseña debe contener al menos una letra minúscula.")
            .Matches("[0-9]").WithMessage("La contraseña debe contener al menos un dígito numérico.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Las contraseñas no coinciden.");
    }
}
