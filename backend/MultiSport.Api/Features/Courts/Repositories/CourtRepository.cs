using System.Data;
using Dapper;
using MultiSport.Api.Common;
using MultiSport.Api.Features.Courts.Models.Entities;

namespace MultiSport.Api.Features.Courts.Repositories;

public sealed class CourtRepository : ICourtRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public CourtRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
    }

    public async Task<bool> CourtNameExistsInComplexAsync(Guid complexId, string name, CancellationToken ct)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1 
                FROM courts 
                WHERE complex_id = @ComplexId 
                  AND LOWER(name) = LOWER(@Name) 
                  AND deleted_at IS NULL
            );";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql,
            new { ComplexId = complexId, Name = name.Trim() },
            cancellationToken: ct));
    }

    public async Task<IReadOnlyList<Sport>> GetActiveSportsAsync(CancellationToken ct)
    {
        const string sql = @"
            SELECT id, name, icon_url, max_players, is_active, created_at, updated_at, deleted_at
            FROM sports
            WHERE deleted_at IS NULL AND is_active = TRUE
            ORDER BY name ASC;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var sports = await connection.QueryAsync<Sport>(new CommandDefinition(sql, cancellationToken: ct));
        return sports.AsList();
    }

    public async Task<IReadOnlyList<Guid>> GetExistingActiveSportIdsAsync(IEnumerable<Guid> sportIds, CancellationToken ct)
    {
        const string sql = @"
            SELECT id 
            FROM sports
            WHERE id = ANY(@SportIds) 
              AND deleted_at IS NULL 
              AND is_active = TRUE;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var ids = await connection.QueryAsync<Guid>(new CommandDefinition(
            sql,
            new { SportIds = sportIds.ToArray() },
            cancellationToken: ct));
        return ids.AsList();
    }

    public async Task<Court> CreateCourtWithSportsAsync(Court court, IEnumerable<CourtSport> courtSports, CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        const string insertCourtSql = @"
            INSERT INTO courts (
                id, complex_id, name, surface_type, is_covered, has_lighting, buffer_minutes,
                is_active, created_at, created_by, updated_at, updated_by
            ) VALUES (
                @Id, @ComplexId, @Name, @SurfaceType, @IsCovered, @HasLighting, @BufferMinutes,
                @IsActive, @CreatedAt, @CreatedBy, @UpdatedAt, @UpdatedBy
            );";

        await connection.ExecuteAsync(new CommandDefinition(
            insertCourtSql,
            new
            {
                court.Id,
                court.ComplexId,
                court.Name,
                court.SurfaceType,
                court.IsCovered,
                court.HasLighting,
                court.BufferMinutes,
                court.IsActive,
                court.CreatedAt,
                court.CreatedBy,
                court.UpdatedAt,
                court.UpdatedBy
            },
            transaction: transaction,
            cancellationToken: ct));

        const string insertCourtSportSql = @"
            INSERT INTO courts_sports (
                id, court_id, sport_id, duration_minutes, base_price, created_at, updated_at
            ) VALUES (
                @Id, @CourtId, @SportId, @DurationMinutes, @BasePrice, @CreatedAt, @UpdatedAt
            );";

        foreach (var cs in courtSports)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                insertCourtSportSql,
                new
                {
                    cs.Id,
                    cs.CourtId,
                    cs.SportId,
                    cs.DurationMinutes,
                    cs.BasePrice,
                    cs.CreatedAt,
                    cs.UpdatedAt
                },
                transaction: transaction,
                cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);

        return court;
    }

    public async Task<Court?> GetCourtByIdAsync(Guid courtId, Guid complexId, CancellationToken ct)
    {
        const string sql = @"
            SELECT id, complex_id, name, surface_type, is_covered, has_lighting, buffer_minutes,
                   is_active, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
            FROM courts
            WHERE id = @CourtId AND complex_id = @ComplexId AND deleted_at IS NULL;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Court>(new CommandDefinition(
            sql,
            new { CourtId = courtId, ComplexId = complexId },
            cancellationToken: ct));
    }

    public async Task<IReadOnlyList<CourtSport>> GetCourtSportsByCourtIdAsync(Guid courtId, CancellationToken ct)
    {
        const string sql = @"
            SELECT id, court_id, sport_id, duration_minutes, base_price, created_at, updated_at
            FROM courts_sports
            WHERE court_id = @CourtId;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var courtSports = await connection.QueryAsync<CourtSport>(new CommandDefinition(
            sql,
            new { CourtId = courtId },
            cancellationToken: ct));
        return courtSports.AsList();
    }

    public async Task<IReadOnlyList<Court>> GetCourtsByComplexIdAsync(Guid complexId, CancellationToken ct)
    {
        const string sql = @"
            SELECT id, complex_id, name, surface_type, is_covered, has_lighting, buffer_minutes,
                   is_active, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
            FROM courts
            WHERE complex_id = @ComplexId AND deleted_at IS NULL
            ORDER BY created_at DESC;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var courts = await connection.QueryAsync<Court>(new CommandDefinition(
            sql,
            new { ComplexId = complexId },
            cancellationToken: ct));
        return courts.AsList();
    }
}
