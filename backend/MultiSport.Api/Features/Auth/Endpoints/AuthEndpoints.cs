using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using MultiSport.Api.Features.Auth.Models.Dtos;
using MultiSport.Api.Features.Auth.Services;

namespace MultiSport.Api.Features.Auth.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth")
                       .WithTags("Auth");

        group.MapPost("/register-complex", RegisterComplex)
             .WithName("RegisterComplex")
             .WithSummary("Registra un nuevo complejo deportivo y envía email de verificación")
             .RequireRateLimiting("auth-rate-limit")
             .Produces<RegisterSuccessResponse>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPost("/login", Login)
             .WithName("Login")
             .WithSummary("Inicia sesión para administradores de complejos")
             .RequireRateLimiting("auth-rate-limit")
             .Produces<AuthResponse>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .ProducesProblem(StatusCodes.Status403Forbidden)
             .ProducesProblem(StatusCodes.Status429TooManyRequests);

        group.MapPost("/refresh", RefreshToken)
             .WithName("RefreshToken")
             .WithSummary("Renueva el Access Token utilizando la cookie segura de Refresh Token")
             .Produces<AuthResponse>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/logout", Logout)
             .WithName("Logout")
             .WithSummary("Cierra la sesión activa y revoca el Refresh Token")
             .Produces(StatusCodes.Status204NoContent);

        group.MapPost("/forgot-password", ForgotPassword)
             .WithName("ForgotPassword")
             .WithSummary("Solicita la recuperación de contraseña enviando un token seguro por correo")
             .RequireRateLimiting("auth-rate-limit")
             .Produces<ProblemDetails>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .ProducesProblem(StatusCodes.Status429TooManyRequests);

        group.MapPost("/reset-password", ResetPassword)
             .WithName("ResetPassword")
             .WithSummary("Restablece la contraseña utilizando el token de un solo uso")
             .RequireRateLimiting("auth-rate-limit")
             .Produces<ProblemDetails>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .ProducesProblem(StatusCodes.Status400BadRequest)
             .ProducesProblem(StatusCodes.Status429TooManyRequests);

        group.MapPost("/change-password", ChangePassword)
             .WithName("ChangePassword")
             .WithSummary("Cambia la contraseña del usuario actualmente autenticado")
             .RequireAuthorization()
             .Produces(StatusCodes.Status204NoContent)
             .ProducesValidationProblem()
             .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapPost("/verify-email", VerifyEmail)
             .WithName("VerifyEmail")
             .WithSummary("Verifica la dirección de correo electrónico mediante token criptográfico")
             .Produces<ProblemDetails>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .ProducesProblem(StatusCodes.Status400BadRequest)
             .ProducesProblem(StatusCodes.Status410Gone);

        group.MapPost("/resend-verification", ResendVerification)
             .WithName("ResendVerification")
             .WithSummary("Reenvía el enlace de verificación de correo electrónico")
             .RequireRateLimiting("auth-rate-limit")
             .Produces<ProblemDetails>(StatusCodes.Status200OK)
             .ProducesValidationProblem()
             .ProducesProblem(StatusCodes.Status400BadRequest)
             .ProducesProblem(StatusCodes.Status429TooManyRequests);

        group.MapPut("/complex-profile", UpdateComplexProfile)
             .WithName("UpdateComplexProfile")
             .WithSummary("Actualiza los datos complementarios del perfil del complejo deportivo")
             .RequireAuthorization()
             .Produces(StatusCodes.Status204NoContent)
             .ProducesValidationProblem()
             .Produces(StatusCodes.Status401Unauthorized)
             .Produces(StatusCodes.Status404NotFound)
             .ProducesProblem(StatusCodes.Status400BadRequest);

        return app;
    }

    private static async Task<Results<Ok<RegisterSuccessResponse>, ValidationProblem, Conflict<ProblemDetails>>> RegisterComplex(
        [FromBody] RegisterComplexRequest request,
        IValidator<RegisterComplexRequest> validator,
        IAuthService service,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var result = await service.RegisterComplexAsync(request, ct);
        return result.Result switch
        {
            Ok<RegisterSuccessResponse> ok => TypedResults.Ok(ok.Value!),
            Conflict<ProblemDetails> conflict => TypedResults.Conflict(conflict.Value!),
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }

    private static async Task<Results<Ok<AuthResponse>, ValidationProblem, UnauthorizedHttpResult, ProblemHttpResult>> Login(
        [FromBody] LoginRequest request,
        IValidator<LoginRequest> validator,
        IAuthService service,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var result = await service.LoginAsync(request, httpContext, ct);
        return result.Result switch
        {
            Ok<AuthResponse> ok => TypedResults.Ok(ok.Value!),
            UnauthorizedHttpResult unauthorized => TypedResults.Unauthorized(),
            ProblemHttpResult problem => problem,
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }

    private static async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> RefreshToken(
        IAuthService service,
        HttpContext httpContext,
        CancellationToken ct)
    {
        return await service.RefreshTokenAsync(null, httpContext, ct);
    }

    private static async Task<Results<NoContent, UnauthorizedHttpResult>> Logout(
        IAuthService service,
        HttpContext httpContext,
        CancellationToken ct)
    {
        return await service.LogoutAsync(null, httpContext, ct);
    }

    private static async Task<Results<Ok<ProblemDetails>, ValidationProblem>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        IValidator<ForgotPasswordRequest> validator,
        IAuthService service,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString();
        var result = await service.ForgotPasswordAsync(request, clientIp, ct);
        return TypedResults.Ok(result.Value!);
    }

    private static async Task<Results<Ok<ProblemDetails>, ValidationProblem, ProblemHttpResult>> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        IValidator<ResetPasswordRequest> validator,
        IAuthService service,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var result = await service.ResetPasswordAsync(request, ct);
        return result.Result switch
        {
            Ok<ProblemDetails> ok => TypedResults.Ok(ok.Value!),
            ProblemHttpResult problem => problem,
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }

    private static async Task<Results<NoContent, ValidationProblem, ProblemHttpResult, UnauthorizedHttpResult>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        IValidator<ChangePasswordRequest> validator,
        IAuthService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var subClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? claimsPrincipal.FindFirst("sub")?.Value;

        if (!Guid.TryParse(subClaim, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.ChangePasswordAsync(userId, request, ct);
        return result.Result switch
        {
            NoContent => TypedResults.NoContent(),
            ProblemHttpResult problem => problem,
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }

    private static async Task<Results<Ok<ProblemDetails>, ValidationProblem, ProblemHttpResult>> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        IValidator<VerifyEmailRequest> validator,
        IAuthService service,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var result = await service.VerifyEmailAsync(request, ct);
        return result.Result switch
        {
            Ok<ProblemDetails> ok => TypedResults.Ok(ok.Value!),
            ProblemHttpResult problem => problem,
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }

    private static async Task<Results<Ok<ProblemDetails>, ValidationProblem, ProblemHttpResult>> ResendVerification(
        [FromBody] ResendVerificationRequest request,
        IValidator<ResendVerificationRequest> validator,
        IAuthService service,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var result = await service.ResendVerificationAsync(request, ct);
        return result.Result switch
        {
            Ok<ProblemDetails> ok => TypedResults.Ok(ok.Value!),
            ProblemHttpResult problem => problem,
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }

    private static async Task<Results<NoContent, ValidationProblem, ProblemHttpResult, NotFound, UnauthorizedHttpResult>> UpdateComplexProfile(
        [FromBody] UpdateComplexProfileRequest request,
        IValidator<UpdateComplexProfileRequest> validator,
        IAuthService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var complexIdClaim = claimsPrincipal.FindFirst("complex_id")?.Value;
        if (!Guid.TryParse(complexIdClaim, out var complexId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await service.UpdateComplexProfileAsync(complexId, request, ct);
        return result.Result switch
        {
            NoContent => TypedResults.NoContent(),
            NotFound => TypedResults.NotFound(),
            ProblemHttpResult problem => problem,
            _ => throw new InvalidOperationException("Respuesta no esperada del servicio de autenticación.")
        };
    }
}
