using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MultiSport.Api.Features.Auth.Models.Dtos;
using MultiSport.Api.Features.Auth.Models.Entities;
using MultiSport.Api.Features.Auth.Repositories;

namespace MultiSport.Api.Features.Auth.Services;

public sealed class AuthService : IAuthService
{
    private const string RefreshTokenCookieName = "refreshToken";
    private readonly IAuthRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IAuthRepository repository,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Results<Ok<RegisterSuccessResponse>, Conflict<ProblemDetails>>> RegisterComplexAsync(
        RegisterComplexRequest request,
        CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _repository.EmailExistsAsync(normalizedEmail, ct))
        {
            _logger.LogWarning("Intento de registro con email ya existente: {Email}", normalizedEmail);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Conflicto de registro",
                Detail = "El correo electrónico ya se encuentra registrado en la plataforma.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var complexId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var complex = new Complex
        {
            Id = complexId,
            Name = request.Name.Trim(),
            TaxId = null,
            CbuAlias = null,
            Address = null,
            Phone = null,
            City = null,
            LogoUrl = null,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.Password, workFactor: 12);

        var user = new User
        {
            Id = userId,
            ComplexId = complexId,
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            Role = "complex_admin",
            IsActive = true,
            IsEmailVerified = false,
            EmailVerifiedAtUtc = null,
            FailedLoginAttempts = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _repository.CreateComplexWithAdminUserAsync(complex, user, ct);
        _logger.LogInformation("Nuevo complejo registrado exitosamente: {ComplexName} con usuario {UserId} (pendiente de activacion)", complex.Name, user.Id);

        // Generar token criptográfico de confirmación de correo (15 minutos)
        var rawVerificationToken = GenerateSecureToken();
        var tokenHash = HashToken(rawVerificationToken);
        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAtUtc = now.AddMinutes(15),
            CreatedAtUtc = now
        };

        await _repository.CreateEmailVerificationTokenAsync(verificationToken, ct);
        await _emailService.SendVerificationEmailAsync(user.Email, complex.Name, rawVerificationToken, ct);

        return TypedResults.Ok(new RegisterSuccessResponse(
            "Registro procesado exitosamente. Se ha enviado un enlace de confirmación válido por 15 minutos a tu correo electrónico.",
            user.Email
        ));
    }

    public async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult, ProblemHttpResult>> LoginAsync(
        LoginRequest request,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _repository.GetUserByEmailAsync(normalizedEmail, ct);

        if (user is null)
        {
            _logger.LogWarning("Fallo de inicio de sesión: cuenta inexistente para email {Email}", normalizedEmail);
            return TypedResults.Unauthorized();
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Fallo de inicio de sesión: cuenta suspendida {UserId}", user.Id);
            return TypedResults.Problem(
                title: "Cuenta suspendida",
                detail: "La cuenta de este complejo se encuentra suspendida.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        // Validación de bloqueo temporal por fuerza bruta
        if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value > DateTimeOffset.UtcNow)
        {
            _logger.LogWarning("Intento de login en cuenta temporalmente bloqueada: {UserId}", user.Id);
            return TypedResults.Problem(
                title: "Cuenta bloqueada temporalmente",
                detail: "Demasiados intentos fallidos. Intente nuevamente más tarde.",
                statusCode: StatusCodes.Status429TooManyRequests);
        }

        // Verificación criptográfica con BCrypt
        var isPasswordValid = BCrypt.Net.BCrypt.EnhancedVerify(request.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            var nextAttempts = user.FailedLoginAttempts + 1;
            DateTimeOffset? lockoutEnd = null;

            if (nextAttempts >= 5)
            {
                lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15);
                _logger.LogWarning("Cuenta bloqueada por 15 minutos tras 5 intentos fallidos: {UserId}", user.Id);
            }

            await _repository.RecordFailedLoginAsync(user.Id, nextAttempts, lockoutEnd, ct);
            return TypedResults.Unauthorized();
        }

        // Verificación obligatoria de correo electrónico
        if (!user.IsEmailVerified)
        {
            _logger.LogWarning("Intento de inicio de sesión con correo no verificado para usuario {UserId}", user.Id);
            return TypedResults.Problem(
                title: "Cuenta no verificada",
                detail: "Debes confirmar tu correo electrónico antes de iniciar sesión. El enlace enviado tiene una vigencia de 15 minutos.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        await _repository.RecordSuccessfulLoginAsync(user.Id, ct);

        var complex = await _repository.GetComplexByIdAsync(user.ComplexId, ct);
        var complexName = complex?.Name ?? "MultiSport Complex";

        var authResponse = await GenerateAuthTokensAndSetCookieAsync(user, complexName, httpContext, ct);
        _logger.LogInformation("Inicio de sesión exitoso para usuario {UserId} del complejo {ComplexName}", user.Id, complexName);

        return TypedResults.Ok(authResponse);
    }

    public async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> RefreshTokenAsync(
        string? refreshToken,
        HttpContext httpContext,
        CancellationToken ct)
    {
        refreshToken ??= httpContext.Request.Cookies[RefreshTokenCookieName];

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            _logger.LogWarning("Intento de renovación de token sin refresh token en cookie");
            return TypedResults.Unauthorized();
        }

        var tokenHash = HashToken(refreshToken);
        var existingToken = await _repository.GetRefreshTokenByHashAsync(tokenHash, ct);

        if (existingToken is null)
        {
            _logger.LogWarning("Refresh token inexistente proporcionado");
            return TypedResults.Unauthorized();
        }

        if (existingToken.IsRevoked)
        {
            _logger.LogWarning("Detección de reuso de Refresh Token revocado para usuario {UserId}. Revocando todas las sesiones.", existingToken.UserId);
            await _repository.RevokeAllUserRefreshTokensAsync(existingToken.UserId, ct);
            DeleteRefreshTokenCookie(httpContext);
            return TypedResults.Unauthorized();
        }

        if (existingToken.IsExpired)
        {
            _logger.LogWarning("Refresh token expirado por inactividad o tiempo límite para usuario {UserId}", existingToken.UserId);
            DeleteRefreshTokenCookie(httpContext);
            return TypedResults.Unauthorized();
        }

        var now = DateTimeOffset.UtcNow;
        if (now >= existingToken.AbsoluteExpiresAtUtc)
        {
            _logger.LogWarning("Refresh token superó el límite máximo absoluto de sesión (24 horas) para usuario {UserId}", existingToken.UserId);
            DeleteRefreshTokenCookie(httpContext);
            return TypedResults.Unauthorized();
        }

        var user = await _repository.GetUserByIdAsync(existingToken.UserId, ct);
        if (user is null || !user.IsActive)
        {
            _logger.LogWarning("Usuario inexistente o inactivo intentando renovar token");
            DeleteRefreshTokenCookie(httpContext);
            return TypedResults.Unauthorized();
        }

        var newRawRefreshToken = GenerateSecureToken();
        var newTokenHash = HashToken(newRawRefreshToken);

        await _repository.RevokeRefreshTokenAsync(existingToken.Id, newTokenHash, ct);

        var idleTimeoutMinutes = _configuration.GetValue("Jwt:RefreshTokenIdleTimeoutMinutes", 30);
        var idleExpiresAt = now.AddMinutes(idleTimeoutMinutes);
        var absoluteExpiresAt = existingToken.AbsoluteExpiresAtUtc;
        var newExpiresAt = idleExpiresAt < absoluteExpiresAt ? idleExpiresAt : absoluteExpiresAt;

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newTokenHash,
            ExpiresAtUtc = newExpiresAt,
            AbsoluteExpiresAtUtc = absoluteExpiresAt,
            CreatedAtUtc = now
        };

        await _repository.CreateRefreshTokenAsync(newRefreshToken, ct);
        SetRefreshTokenCookie(httpContext, newRawRefreshToken, newExpiresAt);

        var complex = await _repository.GetComplexByIdAsync(user.ComplexId, ct);
        var complexName = complex?.Name ?? "MultiSport Complex";

        var accessToken = GenerateJwtToken(user, out var expiresInSeconds);

        var response = new AuthResponse(
            accessToken,
            "Bearer",
            expiresInSeconds,
            new UserInfoDto(user.Id, user.ComplexId, complexName, user.Email, user.Role)
        );

        _logger.LogInformation("Sesión renovada exitosamente para usuario {UserId}", user.Id);
        return TypedResults.Ok(response);
    }

    public async Task<Results<NoContent, UnauthorizedHttpResult>> LogoutAsync(
        string? refreshToken,
        HttpContext httpContext,
        CancellationToken ct)
    {
        refreshToken ??= httpContext.Request.Cookies[RefreshTokenCookieName];

        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var tokenHash = HashToken(refreshToken);
            var token = await _repository.GetRefreshTokenByHashAsync(tokenHash, ct);

            if (token is not null && !token.IsRevoked)
            {
                await _repository.RevokeRefreshTokenAsync(token.Id, null, ct);
                _logger.LogInformation("Refresh token revocado exitosamente para sesión {TokenId}", token.Id);
            }
        }

        DeleteRefreshTokenCookie(httpContext);
        return TypedResults.NoContent();
    }

    public async Task<Ok<ProblemDetails>> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        string? clientIp,
        CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _repository.GetUserByEmailAsync(normalizedEmail, ct);

        if (user is not null && user.IsActive)
        {
            var rawToken = GenerateSecureToken();
            var tokenHash = HashToken(rawToken);
            var expirationMinutes = _configuration.GetValue("Jwt:ResetTokenExpirationMinutes", 30);
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(expirationMinutes);

            var resetToken = new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAtUtc = expiresAt,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByIp = clientIp
            };

            await _repository.CreatePasswordResetTokenAsync(resetToken, ct);

            _logger.LogInformation("Token de recuperación de clave generado para usuario {UserId}. Token de uso único: {Token}", user.Id, rawToken);
        }
        else
        {
            _logger.LogInformation("Solicitud de recuperación de clave para correo inexistente: {Email}", normalizedEmail);
        }

        return TypedResults.Ok(new ProblemDetails
        {
            Title = "Solicitud procesada",
            Detail = "Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.",
            Status = StatusCodes.Status200OK
        });
    }

    public async Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken ct)
    {
        var tokenHash = HashToken(request.Token.Trim());
        var resetToken = await _repository.GetPasswordResetTokenByHashAsync(tokenHash, ct);

        if (resetToken is null || resetToken.IsExpired || resetToken.IsUsed)
        {
            _logger.LogWarning("Intento de reseteo con token inválido o vencido");
            return TypedResults.Problem(
                title: "Token inválido",
                detail: "El token de recuperación es inválido o ha caducado.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var newPasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.NewPassword, workFactor: 12);

        await _repository.UpdatePasswordHashAsync(resetToken.UserId, newPasswordHash, ct);
        await _repository.MarkPasswordResetTokenAsUsedAsync(resetToken.Id, ct);

        await _repository.RevokeAllUserRefreshTokensAsync(resetToken.UserId, ct);
        _logger.LogInformation("Contraseña restablecida exitosamente para usuario {UserId}. Todas las sesiones previas fueron cerradas.", resetToken.UserId);

        return TypedResults.Ok(new ProblemDetails
        {
            Title = "Contraseña actualizada",
            Detail = "Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.",
            Status = StatusCodes.Status200OK
        });
    }

    public async Task<Results<NoContent, ProblemHttpResult>> ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request,
        CancellationToken ct)
    {
        var user = await _repository.GetUserByIdAsync(userId, ct);

        if (user is null || !user.IsActive)
        {
            return TypedResults.Problem(
                title: "Usuario no encontrado",
                detail: "La cuenta de usuario no existe o está inactiva.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var isCurrentPasswordValid = BCrypt.Net.BCrypt.EnhancedVerify(request.CurrentPassword, user.PasswordHash);

        if (!isCurrentPasswordValid)
        {
            _logger.LogWarning("Intento fallido de cambio de contraseña para usuario {UserId}", userId);
            return TypedResults.Problem(
                title: "Contraseña incorrecta",
                detail: "La contraseña actual ingresada es incorrecta.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var newPasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.NewPassword, workFactor: 12);
        await _repository.UpdatePasswordHashAsync(userId, newPasswordHash, ct);
        _logger.LogInformation("Contraseña cambiada exitosamente para usuario autenticado {UserId}", userId);

        return TypedResults.NoContent();
    }

    public async Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> VerifyEmailAsync(
        VerifyEmailRequest request,
        CancellationToken ct)
    {
        var tokenHash = HashToken(request.Token.Trim());
        var token = await _repository.GetEmailVerificationTokenByHashAsync(tokenHash, ct);

        if (token is null || token.IsUsed || token.IsExpired)
        {
            _logger.LogWarning("Intento de verificación de email con token inválido, usado o expirado");
            return TypedResults.Problem(
                title: "Token inválido o expirado",
                detail: "El token de activación es inválido o ha caducado (su validez es de 15 minutos). Por favor solicita un nuevo enlace de activación.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        await _repository.MarkUserEmailAsVerifiedAsync(token.UserId, ct);
        await _repository.MarkEmailVerificationTokenAsUsedAsync(token.Id, ct);
        _logger.LogInformation("Correo electrónico verificado exitosamente para usuario {UserId}", token.UserId);

        return TypedResults.Ok(new ProblemDetails
        {
            Title = "Cuenta activada",
            Detail = "Tu correo electrónico ha sido verificado con éxito. Ya puedes iniciar sesión en MultiSport.",
            Status = StatusCodes.Status200OK
        });
    }

    public async Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> ResendVerificationAsync(
        ResendVerificationRequest request,
        CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _repository.GetUserByEmailAsync(normalizedEmail, ct);

        if (user is not null && !user.IsEmailVerified && user.IsActive)
        {
            var complex = await _repository.GetComplexByIdAsync(user.ComplexId, ct);
            await _repository.InvalidateUserEmailVerificationTokensAsync(user.Id, ct);

            var rawToken = GenerateSecureToken();
            var tokenHash = HashToken(rawToken);
            var now = DateTimeOffset.UtcNow;

            var verificationToken = new EmailVerificationToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAtUtc = now.AddMinutes(15),
                CreatedAtUtc = now
            };

            await _repository.CreateEmailVerificationTokenAsync(verificationToken, ct);
            await _emailService.SendVerificationEmailAsync(user.Email, complex?.Name ?? "MultiSport Complex", rawToken, ct);
            _logger.LogInformation("Reenvío de correo de confirmación solicitado para usuario {UserId}", user.Id);
        }
        else
        {
            _logger.LogInformation("Solicitud de reenvío para correo no aplicable: {Email}", normalizedEmail);
        }

        return TypedResults.Ok(new ProblemDetails
        {
            Title = "Solicitud procesada",
            Detail = "Si el correo corresponde a una cuenta pendiente de activación, recibirás un nuevo enlace válido por 15 minutos.",
            Status = StatusCodes.Status200OK
        });
    }

    public async Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> UpdateComplexProfileAsync(
        Guid complexId,
        UpdateComplexProfileRequest request,
        CancellationToken ct)
    {
        var complex = await _repository.GetComplexByIdAsync(complexId, ct);
        if (complex is null)
        {
            return TypedResults.Problem(
                title: "Complejo no encontrado",
                detail: "El complejo especificado no existe o ha sido dado de baja.",
                statusCode: StatusCodes.Status404NotFound);
        }

        await _repository.UpdateComplexProfileAsync(complexId, request, ct);
        _logger.LogInformation("Perfil del complejo {ComplexId} actualizado exitosamente", complexId);

        return TypedResults.Ok(new ProblemDetails
        {
            Title = "Perfil actualizado",
            Detail = "Los datos del complejo deportivo se han guardado correctamente.",
            Status = StatusCodes.Status200OK
        });
    }

    private async Task<AuthResponse> GenerateAuthTokensAndSetCookieAsync(
        User user,
        string complexName,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var accessToken = GenerateJwtToken(user, out var expiresInSeconds);

        var rawRefreshToken = GenerateSecureToken();
        var refreshTokenHash = HashToken(rawRefreshToken);
        var idleTimeoutMinutes = _configuration.GetValue("Jwt:RefreshTokenIdleTimeoutMinutes", 30);
        var absoluteExpirationHours = _configuration.GetValue("Jwt:RefreshTokenAbsoluteExpirationHours", 24);

        var now = DateTimeOffset.UtcNow;
        var absoluteExpiresAt = now.AddHours(absoluteExpirationHours);
        var idleExpiresAt = now.AddMinutes(idleTimeoutMinutes);
        var expiresAt = idleExpiresAt < absoluteExpiresAt ? idleExpiresAt : absoluteExpiresAt;

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAtUtc = expiresAt,
            AbsoluteExpiresAtUtc = absoluteExpiresAt,
            CreatedAtUtc = now
        };

        await _repository.CreateRefreshTokenAsync(refreshToken, ct);
        SetRefreshTokenCookie(httpContext, rawRefreshToken, expiresAt);

        return new AuthResponse(
            accessToken,
            "Bearer",
            expiresInSeconds,
            new UserInfoDto(user.Id, user.ComplexId, complexName, user.Email, user.Role)
        );
    }

    private string GenerateJwtToken(User user, out int expiresInSeconds)
    {
        var jwtSecret = _configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret no configurado.");
        var issuer = _configuration["Jwt:Issuer"] ?? "MultiSport.Api";
        var audience = _configuration["Jwt:Audience"] ?? "MultiSport.Client";
        expiresInSeconds = _configuration.GetValue("Jwt:AccessTokenExpirationMinutes", 60) * 60;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("complex_id", user.ComplexId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddSeconds(expiresInSeconds),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static void SetRefreshTokenCookie(HttpContext httpContext, string rawToken, DateTimeOffset expires)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = expires
        };

        httpContext.Response.Cookies.Append(RefreshTokenCookieName, rawToken, cookieOptions);
    }

    private static void DeleteRefreshTokenCookie(HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict
        });
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string GenerateSecureToken(int byteLength = 32)
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(byteLength)).ToLowerInvariant();
    }
}
