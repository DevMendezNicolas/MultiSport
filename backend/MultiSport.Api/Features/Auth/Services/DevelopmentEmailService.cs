using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MultiSport.Api.Features.Auth.Services;

public sealed class DevelopmentEmailService : IEmailService
{
    private readonly ILogger<DevelopmentEmailService> _logger;
    private readonly string _clientBaseUrl;

    public DevelopmentEmailService(ILogger<DevelopmentEmailService> logger, IConfiguration configuration)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _clientBaseUrl = configuration["ClientBaseUrl"] ?? "http://localhost:5173";
    }

    public Task SendVerificationEmailAsync(string toEmail, string complexName, string verificationToken, CancellationToken ct)
    {
        var verificationUrl = $"{_clientBaseUrl.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(verificationToken)}";

        _logger.LogInformation(
            "========================================================================\n" +
            "[EMAIL SERVICE - VERIFICACION DE CUENTA]\n" +
            "Para: {ToEmail}\n" +
            "Complejo: {ComplexName}\n" +
            "Vigencia: 15 minutos\n" +
            "Enlace de Activacion: {VerificationUrl}\n" +
            "Token plano: {Token}\n" +
            "========================================================================",
            toEmail,
            complexName,
            verificationUrl,
            verificationToken);

        return Task.CompletedTask;
    }
}
