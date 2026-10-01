using MultiSport.Api.Features.Auth.Models.Entities;

namespace MultiSport.Api.Features.Auth.Repositories;

public interface IAuthRepository
{
    Task<bool> EmailExistsAsync(string email, CancellationToken ct);
    Task<bool> TaxIdExistsAsync(string taxId, CancellationToken ct);
    Task<(Complex Complex, User User)> CreateComplexWithAdminUserAsync(Complex complex, User user, CancellationToken ct);
    Task<User?> GetUserByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken ct);
    Task<Complex?> GetComplexByIdAsync(Guid id, CancellationToken ct);
    Task RecordFailedLoginAsync(Guid userId, int failedAttempts, DateTimeOffset? lockoutEndUtc, CancellationToken ct);
    Task RecordSuccessfulLoginAsync(Guid userId, CancellationToken ct);
    Task CreateRefreshTokenAsync(RefreshToken token, CancellationToken ct);
    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash, CancellationToken ct);
    Task RevokeRefreshTokenAsync(Guid tokenId, string? replacedByToken, CancellationToken ct);
    Task RevokeAllUserRefreshTokensAsync(Guid userId, CancellationToken ct);
    Task CreatePasswordResetTokenAsync(PasswordResetToken token, CancellationToken ct);
    Task<PasswordResetToken?> GetPasswordResetTokenByHashAsync(string tokenHash, CancellationToken ct);
    Task MarkPasswordResetTokenAsUsedAsync(Guid tokenId, CancellationToken ct);
    Task UpdatePasswordHashAsync(Guid userId, string newPasswordHash, CancellationToken ct);
}
