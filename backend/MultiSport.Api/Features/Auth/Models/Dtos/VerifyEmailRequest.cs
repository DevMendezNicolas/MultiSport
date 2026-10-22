using FluentValidation;

namespace MultiSport.Api.Features.Auth.Models.Dtos;

public sealed record VerifyEmailRequest(string Token);

public sealed class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("El token de verificación es obligatorio.")
            .MaximumLength(128).WithMessage("El token no puede superar los 128 caracteres.");
    }
}
