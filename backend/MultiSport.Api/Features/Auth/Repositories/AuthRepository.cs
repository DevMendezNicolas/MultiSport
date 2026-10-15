using System.Data;
using Dapper;
using MultiSport.Api.Common;
using MultiSport.Api.Features.Auth.Models.Dtos;
using MultiSport.Api.Features.Auth.Models.Entities;

namespace MultiSport.Api.Features.Auth.Repositories;

public sealed class AuthRepository : IAuthRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public AuthRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken ct)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER(@Email) AND deleted_at IS NULL);";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new { Email = email.Trim() }, cancellationToken: ct));
    }

    public async Task<bool> TaxIdExistsAsync(string taxId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(taxId)) return false;
        const string sql = "SELECT EXISTS(SELECT 1 FROM complexes WHERE LOWER(tax_id) = LOWER(@TaxId) AND deleted_at IS NULL);";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new { TaxId = taxId.Trim() }, cancellationToken: ct));
    }

    public async Task<(Complex Complex, User User)> CreateComplexWithAdminUserAsync(Complex complex, User user, CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        const string insertComplexSql = @"
            INSERT INTO complexes (
                id, name, tax_id, cbu_alias, address, phone, city, logo_url, is_active, created_at, updated_at
            ) VALUES (
                @Id, @Name, @TaxId, @CbuAlias, @Address, @Phone, @City, @LogoUrl, @IsActive, @CreatedAt, @UpdatedAt
            );";

        await connection.ExecuteAsync(new CommandDefinition(
            insertComplexSql,
            new
            {
                complex.Id,
                complex.Name,
                complex.TaxId,
                complex.CbuAlias,
                complex.Address,
                complex.Phone,
                complex.City,
                complex.LogoUrl,
                complex.IsActive,
                complex.CreatedAt,
                complex.UpdatedAt
            },
            transaction: transaction,
            cancellationToken: ct));

        const string insertUserSql = @"
            INSERT INTO users (
                id, complex_id, email, password_hash, role, is_active, is_email_verified, email_verified_at_utc, failed_login_attempts, created_at, updated_at
            ) VALUES (
                @Id, @ComplexId, @Email, @PasswordHash, @Role, @IsActive, @IsEmailVerified, @EmailVerifiedAtUtc, @FailedLoginAttempts, @CreatedAt, @UpdatedAt
            );";

        await connection.ExecuteAsync(new CommandDefinition(
            insertUserSql,
            new
            {
                user.Id,
                user.ComplexId,
                user.Email,
                user.PasswordHash,
                user.Role,
                user.IsActive,
                user.IsEmailVerified,
                user.EmailVerifiedAtUtc,
                user.FailedLoginAttempts,
                user.CreatedAt,
                user.UpdatedAt
            },
            transaction: transaction,
            cancellationToken: ct));

        await transaction.CommitAsync(ct);
        return (complex, user);
    }

    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken ct)
    {
        const string sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(@Email) AND deleted_at IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(new CommandDefinition(sql, new { Email = email.Trim() }, cancellationToken: ct));
    }

    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken ct)
    {
        const string sql = "SELECT * FROM users WHERE id = @Id AND deleted_at IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<Complex?> GetComplexByIdAsync(Guid id, CancellationToken ct)
    {
        const string sql = "SELECT * FROM complexes WHERE id = @Id AND deleted_at IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Complex>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task RecordFailedLoginAsync(Guid userId, int failedAttempts, DateTimeOffset? lockoutEndUtc, CancellationToken ct)
    {
        const string sql = @"
            UPDATE users 
            SET failed_login_attempts = @FailedAttempts, 
                lockout_end_utc = @LockoutEndUtc, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = @UserId;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, FailedAttempts = failedAttempts, LockoutEndUtc = lockoutEndUtc }, cancellationToken: ct));
    }

    public async Task RecordSuccessfulLoginAsync(Guid userId, CancellationToken ct)
    {
        const string sql = @"
            UPDATE users 
            SET failed_login_attempts = 0, 
                lockout_end_utc = NULL, 
                last_login_at_utc = CURRENT_TIMESTAMP, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = @UserId;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task CreateRefreshTokenAsync(RefreshToken token, CancellationToken ct)
    {
        const string sql = @"
            INSERT INTO refresh_tokens (
                id, user_id, token_hash, expires_at_utc, created_at_utc
            ) VALUES (
                @Id, @UserId, @TokenHash, @ExpiresAtUtc, @CreatedAtUtc
            );";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, token, cancellationToken: ct));
    }

    public async Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash, CancellationToken ct)
    {
        const string sql = "SELECT * FROM refresh_tokens WHERE token_hash = @TokenHash;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<RefreshToken>(new CommandDefinition(sql, new { TokenHash = tokenHash }, cancellationToken: ct));
    }

    public async Task RevokeRefreshTokenAsync(Guid tokenId, string? replacedByToken, CancellationToken ct)
    {
        const string sql = @"
            UPDATE refresh_tokens 
            SET revoked_at_utc = CURRENT_TIMESTAMP, 
                replaced_by_token = @ReplacedByToken 
            WHERE id = @TokenId;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { TokenId = tokenId, ReplacedByToken = replacedByToken }, cancellationToken: ct));
    }

    public async Task RevokeAllUserRefreshTokensAsync(Guid userId, CancellationToken ct)
    {
        const string sql = "UPDATE refresh_tokens SET revoked_at_utc = CURRENT_TIMESTAMP WHERE user_id = @UserId AND revoked_at_utc IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task CreatePasswordResetTokenAsync(PasswordResetToken token, CancellationToken ct)
    {
        const string sql = @"
            INSERT INTO password_reset_tokens (
                id, user_id, token_hash, expires_at_utc, created_at_utc, created_by_ip
            ) VALUES (
                @Id, @UserId, @TokenHash, @ExpiresAtUtc, @CreatedAtUtc, @CreatedByIp
            );";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, token, cancellationToken: ct));
    }

    public async Task<PasswordResetToken?> GetPasswordResetTokenByHashAsync(string tokenHash, CancellationToken ct)
    {
        const string sql = "SELECT * FROM password_reset_tokens WHERE token_hash = @TokenHash AND used_at_utc IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<PasswordResetToken>(new CommandDefinition(sql, new { TokenHash = tokenHash }, cancellationToken: ct));
    }

    public async Task MarkPasswordResetTokenAsUsedAsync(Guid tokenId, CancellationToken ct)
    {
        const string sql = "UPDATE password_reset_tokens SET used_at_utc = CURRENT_TIMESTAMP WHERE id = @TokenId;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { TokenId = tokenId }, cancellationToken: ct));
    }

    public async Task UpdatePasswordHashAsync(Guid userId, string newPasswordHash, CancellationToken ct)
    {
        const string sql = @"
            UPDATE users 
            SET password_hash = @NewPasswordHash, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = @UserId;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, NewPasswordHash = newPasswordHash }, cancellationToken: ct));
    }

    public async Task CreateEmailVerificationTokenAsync(EmailVerificationToken token, CancellationToken ct)
    {
        const string sql = @"
            INSERT INTO email_verification_tokens (
                id, user_id, token_hash, expires_at_utc, created_at_utc
            ) VALUES (
                @Id, @UserId, @TokenHash, @ExpiresAtUtc, @CreatedAtUtc
            );";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, token, cancellationToken: ct));
    }

    public async Task<EmailVerificationToken?> GetEmailVerificationTokenByHashAsync(string tokenHash, CancellationToken ct)
    {
        const string sql = "SELECT * FROM email_verification_tokens WHERE token_hash = @TokenHash AND used_at_utc IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<EmailVerificationToken>(new CommandDefinition(sql, new { TokenHash = tokenHash }, cancellationToken: ct));
    }

    public async Task MarkEmailVerificationTokenAsUsedAsync(Guid tokenId, CancellationToken ct)
    {
        const string sql = "UPDATE email_verification_tokens SET used_at_utc = CURRENT_TIMESTAMP WHERE id = @TokenId;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { TokenId = tokenId }, cancellationToken: ct));
    }

    public async Task MarkUserEmailAsVerifiedAsync(Guid userId, CancellationToken ct)
    {
        const string sql = @"
            UPDATE users 
            SET is_email_verified = TRUE, 
                email_verified_at_utc = CURRENT_TIMESTAMP, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = @UserId;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task InvalidateUserEmailVerificationTokensAsync(Guid userId, CancellationToken ct)
    {
        const string sql = "UPDATE email_verification_tokens SET used_at_utc = CURRENT_TIMESTAMP WHERE user_id = @UserId AND used_at_utc IS NULL;";
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task UpdateComplexProfileAsync(Guid complexId, UpdateComplexProfileRequest request, CancellationToken ct)
    {
        const string sql = @"
            UPDATE complexes 
            SET tax_id = COALESCE(@TaxId, tax_id), 
                cbu_alias = COALESCE(@CbuAlias, cbu_alias), 
                address = COALESCE(@Address, address), 
                phone = COALESCE(@Phone, phone), 
                city = COALESCE(@City, city), 
                logo_url = COALESCE(@LogoUrl, logo_url), 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = @ComplexId AND deleted_at IS NULL;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            ComplexId = complexId,
            request.TaxId,
            request.CbuAlias,
            request.Address,
            request.Phone,
            request.City,
            request.LogoUrl
        }, cancellationToken: ct));
    }
}
