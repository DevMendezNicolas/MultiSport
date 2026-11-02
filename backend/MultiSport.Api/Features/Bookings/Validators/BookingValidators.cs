using FluentValidation;
using MultiSport.Api.Common;
using MultiSport.Api.Features.Bookings.Models.Dtos;

namespace MultiSport.Api.Features.Bookings.Validators;

public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty().WithMessage("El ID de la cancha es obligatorio.");

        RuleFor(x => x.SportId)
            .NotEmpty().WithMessage("El ID del deporte es obligatorio.");

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("El nombre del cliente es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre del cliente no puede exceder 150 caracteres.");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("El teléfono del cliente es obligatorio.")
            .MaximumLength(50).WithMessage("El teléfono del cliente no puede exceder 50 caracteres.");

        RuleFor(x => x.CustomerEmail)
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerEmail));

        RuleFor(x => x.StartTimeUtc)
            .NotEmpty().WithMessage("La fecha y hora de inicio es obligatoria.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El horario de inicio del turno debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x.EndTimeUtc)
            .NotEmpty().WithMessage("La fecha y hora de fin es obligatoria.")
            .GreaterThan(x => x.StartTimeUtc).WithMessage("La fecha y hora de fin deben ser posteriores al inicio.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El horario de finalización del turno debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x)
            .Must(x =>
            {
                if (x.EndTimeUtc <= x.StartTimeUtc) return false;
                var totalMinutes = (x.EndTimeUtc - x.StartTimeUtc).TotalMinutes;
                return totalMinutes >= 30 && totalMinutes <= 240 && totalMinutes % 15 == 0;
            })
            .WithMessage("Las reservas comerciales deben tener una duración mínima de 30 minutos y máxima de 240 minutos, en múltiplos de 15 minutos.");

        RuleFor(x => x.CustomPrice)
            .GreaterThan(0).WithMessage("El precio personalizado debe ser mayor a $0.")
            .When(x => x.CustomPrice.HasValue);

        RuleFor(x => x.DepositAmount)
            .GreaterThanOrEqualTo(0).WithMessage("La seña o anticipo debe ser mayor o igual a cero.");

        RuleFor(x => x.DepositAmount)
            .LessThanOrEqualTo(x => x.CustomPrice!.Value)
            .When(x => x.CustomPrice.HasValue)
            .WithMessage("El monto de la seña o pago inicial no puede superar el valor total del turno.");
    }
}

public class CreateBlockRequestValidator : AbstractValidator<CreateBlockRequest>
{
    public CreateBlockRequestValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty().WithMessage("El ID de la cancha es obligatorio.");

        RuleFor(x => x.StartTimeUtc)
            .NotEmpty().WithMessage("La fecha y hora de inicio del bloqueo es obligatoria.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El horario de inicio del bloqueo debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x.EndTimeUtc)
            .NotEmpty().WithMessage("La fecha y hora de finalización del bloqueo es obligatoria.")
            .GreaterThan(x => x.StartTimeUtc).WithMessage("La fecha y hora de finalización deben ser posteriores al inicio.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El horario de finalización del bloqueo debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x)
            .Must(x =>
            {
                if (x.EndTimeUtc <= x.StartTimeUtc) return false;
                var totalMinutes = (x.EndTimeUtc - x.StartTimeUtc).TotalMinutes;
                return totalMinutes >= 15 && totalMinutes % 15 == 0;
            })
            .WithMessage("El bloqueo operativo debe tener una duración mínima de 15 minutos y configurarse en múltiplos de 15 minutos.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo o razón del bloqueo es obligatorio.")
            .MaximumLength(255).WithMessage("El motivo no puede exceder 255 caracteres.");
    }
}

public class UpdateBlockRequestValidator : AbstractValidator<UpdateBlockRequest>
{
    public UpdateBlockRequestValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty().WithMessage("El ID de la cancha es obligatorio.");

        RuleFor(x => x.StartTimeUtc)
            .NotEmpty().WithMessage("La fecha y hora de inicio del bloqueo es obligatoria.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El horario de inicio del bloqueo debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x.EndTimeUtc)
            .NotEmpty().WithMessage("La fecha y hora de finalización del bloqueo es obligatoria.")
            .GreaterThan(x => x.StartTimeUtc).WithMessage("La fecha y hora de finalización deben ser posteriores al inicio.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El horario de finalización del bloqueo debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x)
            .Must(x =>
            {
                if (x.EndTimeUtc <= x.StartTimeUtc) return false;
                var totalMinutes = (x.EndTimeUtc - x.StartTimeUtc).TotalMinutes;
                return totalMinutes >= 15 && totalMinutes % 15 == 0;
            })
            .WithMessage("El bloqueo operativo debe tener una duración mínima de 15 minutos y configurarse en múltiplos de 15 minutos.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo o razón del bloqueo es obligatorio.")
            .MaximumLength(255).WithMessage("El motivo no puede exceder 255 caracteres.");
    }
}

public class RecordPaymentRequestValidator : AbstractValidator<RecordPaymentRequest>
{
    private static readonly string[] AllowedMethods = ["cash", "transfer", "card", "mercadopago"];
    private static readonly string[] AllowedTypes = ["deposit", "partial", "full"];

    public RecordPaymentRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("El monto del pago debe ser mayor a cero.");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("El método de pago es obligatorio.")
            .Must(m => AllowedMethods.Contains(m.ToLowerInvariant()))
            .WithMessage("Método de pago no reconocido. Permitidos: cash, transfer, card, mercadopago.");

        RuleFor(x => x.PaymentType)
            .NotEmpty().WithMessage("El tipo de pago es obligatorio.")
            .Must(t => AllowedTypes.Contains(t.ToLowerInvariant()))
            .WithMessage("Tipo de pago no reconocido. Permitidos: deposit, partial, full.");
    }
}

public class CancelBookingRequestValidator : AbstractValidator<CancelBookingRequest>
{
    public CancelBookingRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo de cancelación es obligatorio.")
            .MaximumLength(255).WithMessage("El motivo de cancelación no puede exceder 255 caracteres.");
    }
}

public class RescheduleBookingRequestValidator : AbstractValidator<RescheduleBookingRequest>
{
    public RescheduleBookingRequestValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty().WithMessage("El ID de la cancha es obligatorio.");

        RuleFor(x => x.NewStartTimeUtc)
            .NotEmpty().WithMessage("La nueva fecha y hora de inicio es obligatoria.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El nuevo horario de inicio debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x.NewEndTimeUtc)
            .NotEmpty().WithMessage("La nueva fecha y hora de fin es obligatoria.")
            .GreaterThan(x => x.NewStartTimeUtc).WithMessage("La nueva fecha de fin debe ser posterior a la de inicio.")
            .Must(ComplexTimeHelper.IsQuarterHourAligned)
            .WithMessage("El nuevo horario de fin debe estar en intervalos de 15 minutos (00, 15, 30, 45).");

        RuleFor(x => x)
            .Must(x =>
            {
                if (x.NewEndTimeUtc <= x.NewStartTimeUtc) return false;
                var totalMinutes = (x.NewEndTimeUtc - x.NewStartTimeUtc).TotalMinutes;
                return totalMinutes >= 30 && totalMinutes <= 240 && totalMinutes % 15 == 0;
            })
            .WithMessage("Las reservas comerciales deben tener una duración mínima de 30 minutos y máxima de 240 minutos, en múltiplos de 15 minutos.");
    }
}
