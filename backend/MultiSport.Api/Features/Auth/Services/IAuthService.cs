using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MultiSport.Api.Features.Auth.Models.Dtos;

namespace MultiSport.Api.Features.Auth.Services;

public interface IAuthService
{
    Task<Results<Ok<RegisterSuccessResponse>, Conflict<ProblemDetails>>> RegisterComplexAsync(
        RegisterComplexRequest request, 
        CancellationToken ct);

    Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult, ProblemHttpResult>> LoginAsync(
        LoginRequest request, 
        HttpContext httpContext, 
        CancellationToken ct);

    Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> RefreshTokenAsync(
        string? refreshToken, 
        HttpContext httpContext, 
        CancellationToken ct);

    Task<Results<NoContent, UnauthorizedHttpResult>> LogoutAsync(
        string? refreshToken, 
        HttpContext httpContext, 
        CancellationToken ct);

    Task<Ok<ProblemDetails>> ForgotPasswordAsync(
        ForgotPasswordRequest request, 
        string? clientIp, 
        CancellationToken ct);

    Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> ResetPasswordAsync(
        ResetPasswordRequest request, 
        CancellationToken ct);

    Task<Results<NoContent, ProblemHttpResult>> ChangePasswordAsync(
        Guid userId, 
        ChangePasswordRequest request, 
        CancellationToken ct);

    Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> VerifyEmailAsync(
        VerifyEmailRequest request, 
        CancellationToken ct);

    Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> ResendVerificationAsync(
        ResendVerificationRequest request, 
        CancellationToken ct);

    Task<Results<Ok<ProblemDetails>, ProblemHttpResult>> UpdateComplexProfileAsync(
        Guid complexId, 
        UpdateComplexProfileRequest request, 
        CancellationToken ct);
}
