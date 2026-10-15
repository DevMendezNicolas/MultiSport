using FluentValidation;

namespace MultiSport.Api.Features.Auth.Models.Dtos;

public sealed record ResendVerificationRequest(string Email);

public sealed class ResendVerificationRequestValidator : AbstractValidator<ResendVerificationRequest>
{
    public ResendVerificationRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .MaximumLength(255).WithMessage("El correo no puede superar los 255 caracteres.");
    }
}
