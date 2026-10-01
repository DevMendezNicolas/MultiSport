using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IAuthRepository repository,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Results<Ok<AuthResponse>, Conflict<ProblemDetails>>> RegisterComplexAsync(
        RegisterComplexRequest request,
        HttpContext httpContext,
        CancellationToken ct)
    {
        if (await _repository.EmailExistsAsync(request.Email, ct))
        {
            _logger.LogWarning("Intento de registro con email ya existente: {Email}", request.Email);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Conflicto de registro",
                Detail = "El correo electrónico ya se encuentra registrado en la plataforma.",
                Status = StatusCodes.Status409Conflict
            });
        }

        if (await _repository.TaxIdExistsAsync(request.TaxId, ct))
        {
            _logger.LogWarning("Intento de registro con CUIT ya existente: {TaxId}", request.TaxId);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Conflicto de registro",
                Detail = "La identificación fiscal (CUIT) ya se encuentra registrada.",
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
            TaxId = request.TaxId.Trim(),
            CbuAlias = request.CbuAlias.Trim(),
            Address = request.Address.Trim(),
            Phone = request.Phone.Trim(),
            City = request.City.Trim(),
            LogoUrl = request.LogoUrl?.Trim(),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.Password, workFactor: 12);

        var user = new User
        {
            Id = userId,
            ComplexId = complexId,
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            Role = "complex_admin",
            IsActive = true,
            FailedLoginAttempts = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _repository.CreateComplexWithAdminUserAsync(complex, user, ct);
        _logger.LogInformation("Nuevo complejo registrado exitosamente: {ComplexName} con usuario {UserId}", complex.Name, user.Id);

        var authResponse = await GenerateAuthTokensAndSetCookieAsync(user, complex.Name, httpContext, ct);
        return TypedResults.Ok(authResponse);
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

        // Login exitoso: restablecer intentos fallidos
        await _repository.RecordSuccessfulLoginAsync(user.Id, ct);
        var complex = await _repository.GetComplexByIdAsync(user.ComplexId, ct);
        var complexName = complex?.Name ?? "Complejo Deportivo";

        _logger.LogInformation("Inicio de sesión exitoso para usuario {UserId} del complejo {ComplexName}", user.Id, complexName);

        var authResponse = await GenerateAuthTokensAndSetCookieAsync(user, complexName, httpContext, ct);
        return TypedResults.Ok(authResponse);
    }

    public async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> RefreshTokenAsync(
        string? refreshToken,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var tokenToValidate = refreshToken ?? httpContext.Request.Cookies[RefreshTokenCookieName];

        if (string.IsNullOrWhiteSpace(tokenToValidate))
        {
            _logger.LogWarning("Intento de renovación sin Refresh Token");
            return TypedResults.Unauthorized();
        }

        var tokenHash = HashToken(tokenToValidate);
        var existingToken = await _repository.GetRefreshTokenByHashAsync(tokenHash, ct);

        if (existingToken is null || existingToken.IsExpired)
        {
            _logger.LogWarning("Refresh token inexistente o expirado");
            return TypedResults.Unauthorized();
        }

        // Detección de reuso de token revocado (Posible ataque de suplantación)
        if (existingToken.IsRevoked)
        {
            _logger.LogCritical("Alerta de seguridad: Intento de reuso de Refresh Token revocado para usuario {UserId}. Revocando todas las sesiones.", existingToken.UserId);
            await _repository.RevokeAllUserRefreshTokensAsync(existingToken.UserId, ct);
            DeleteRefreshTokenCookie(httpContext);
            return TypedResults.Unauthorized();
        }

        var user = await _repository.GetUserByIdAsync(existingToken.UserId, ct);
        if (user is null || !user.IsActive)
        {
            _logger.LogWarning("Intento de renovación para usuario inválido o inactivo {UserId}", existingToken.UserId);
            return TypedResults.Unauthorized();
        }

        var complex = await _repository.GetComplexByIdAsync(user.ComplexId, ct);
        var complexName = complex?.Name ?? "Complejo Deportivo";

        // Rotación: Generar nuevo token y revocar el anterior enlazándolo al nuevo
        var rawNewRefreshToken = GenerateSecureToken();
        var newRefreshTokenHash = HashToken(rawNewRefreshToken);
        var refreshLifetimeDays = _configuration.GetValue("Jwt:RefreshTokenExpirationDays", 7);
        var newExpiresAt = DateTimeOffset.UtcNow.AddDays(refreshLifetimeDays);

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefreshTokenHash,
            ExpiresAtUtc = newExpiresAt,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        await _repository.CreateRefreshTokenAsync(newRefreshToken, ct);
        await _repository.RevokeRefreshTokenAsync(existingToken.Id, newRefreshTokenHash, ct);

        SetRefreshTokenCookie(httpContext, rawNewRefreshToken, newExpiresAt);

        var accessToken = GenerateJwtToken(user, out var expiresInSeconds);

        var response = new AuthResponse(
            AccessToken: accessToken,
            TokenType: "Bearer",
            ExpiresIn: expiresInSeconds,
            User: new UserInfoDto(user.Id, user.ComplexId, complexName, user.Email, user.Role)
        );

        return TypedResults.Ok(response);
    }

    public async Task<Results<NoContent, UnauthorizedHttpResult>> LogoutAsync(
        string? refreshToken,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var tokenToRevoke = refreshToken ?? httpContext.Request.Cookies[RefreshTokenCookieName];

        if (!string.IsNullOrWhiteSpace(tokenToRevoke))
        {
            var tokenHash = HashToken(tokenToRevoke);
            var existingToken = await _repository.GetRefreshTokenByHashAsync(tokenHash, ct);

            if (existingToken is not null && !existingToken.IsRevoked)
            {
                await _repository.RevokeRefreshTokenAsync(existingToken.Id, null, ct);
                _logger.LogInformation("Refresh token revocado voluntariamente para usuario {UserId}", existingToken.UserId);
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

        // Prevención de enumeración de cuentas: responder siempre OK genérico
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

            // Simulación o emisión de notificación de correo electrónico
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

        // Seguridad: invalidar todas las sesiones activas en otros navegadores
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

    private async Task<AuthResponse> GenerateAuthTokensAndSetCookieAsync(
        User user,
        string complexName,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var accessToken = GenerateJwtToken(user, out var expiresInSeconds);

        var rawRefreshToken = GenerateSecureToken();
        var refreshTokenHash = HashToken(rawRefreshToken);
        var refreshLifetimeDays = _configuration.GetValue("Jwt:RefreshTokenExpirationDays", 7);
        var expiresAt = DateTimeOffset.UtcNow.AddDays(refreshLifetimeDays);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAtUtc = expiresAt,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        await _repository.CreateRefreshTokenAsync(refreshToken, ct);
        SetRefreshTokenCookie(httpContext, rawRefreshToken, expiresAt);

        return new AuthResponse(
            AccessToken: accessToken,
            TokenType: "Bearer",
            ExpiresIn: expiresInSeconds,
            User: new UserInfoDto(user.Id, user.ComplexId, complexName, user.Email, user.Role)
        );
    }

    private string GenerateJwtToken(User user, out int expiresInSeconds)
    {
        var secret = _configuration["Jwt:Secret"] 
                     ?? throw new InvalidOperationException("Clave secreta JWT no configurada.");
        var issuer = _configuration["Jwt:Issuer"] ?? "MultiSport.Api";
        var audience = _configuration["Jwt:Audience"] ?? "MultiSport.Client";
        var expirationMinutes = _configuration.GetValue("Jwt:AccessTokenExpirationMinutes", 15);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("complex_id", user.ComplexId.ToString()),
            new(ClaimTypes.Role, user.Role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);
        expiresInSeconds = expirationMinutes * 60;

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
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
