namespace MultiSport.Api.Features.Auth.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string complexName, string verificationToken, CancellationToken ct);
}
