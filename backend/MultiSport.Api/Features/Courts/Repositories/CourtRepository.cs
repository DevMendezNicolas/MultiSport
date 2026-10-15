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

    public async Task<Court> CreateCourtWithSportsAndPricingRulesAsync(
        Court court,
        IEnumerable<CourtSport> courtSports,
        IEnumerable<CourtPricingRule> pricingRules,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        const string insertCourtSql = @"
            INSERT INTO courts (
                id, complex_id, name, surface_type, is_covered, has_lighting,
                is_active, created_at, created_by, updated_at, updated_by
            ) VALUES (
                @Id, @ComplexId, @Name, @SurfaceType, @IsCovered, @HasLighting,
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

        const string insertPricingRuleSql = @"
            INSERT INTO court_pricing_rules (
                id, court_sport_id, day_of_week, start_time, end_time, price, duration_minutes, created_at, updated_at
            ) VALUES (
                @Id, @CourtSportId, @DayOfWeek, @StartTime, @EndTime, @Price, @DurationMinutes, @CreatedAt, @UpdatedAt
            );";

        foreach (var rule in pricingRules)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                insertPricingRuleSql,
                new
                {
                    rule.Id,
                    rule.CourtSportId,
                    rule.DayOfWeek,
                    rule.StartTime,
                    rule.EndTime,
                    rule.Price,
                    rule.DurationMinutes,
                    rule.CreatedAt,
                    rule.UpdatedAt
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
            SELECT id, complex_id, name, surface_type, is_covered, has_lighting,
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

    public async Task<IReadOnlyList<CourtPricingRule>> GetPricingRulesByCourtSportIdsAsync(IEnumerable<Guid> courtSportIds, CancellationToken ct)
    {
        var idsList = courtSportIds.ToArray();
        if (idsList.Length == 0)
        {
            return Array.Empty<CourtPricingRule>();
        }

        const string sql = @"
            SELECT id, court_sport_id, day_of_week, start_time, end_time, price, duration_minutes, created_at, updated_at
            FROM court_pricing_rules
            WHERE court_sport_id = ANY(@CourtSportIds)
            ORDER BY day_of_week ASC, start_time ASC;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var rules = await connection.QueryAsync<CourtPricingRule>(new CommandDefinition(
            sql,
            new { CourtSportIds = idsList },
            cancellationToken: ct));
        return rules.AsList();
    }

    public async Task<IReadOnlyList<Court>> GetCourtsByComplexIdAsync(Guid complexId, CancellationToken ct)
    {
        const string sql = @"
            SELECT id, complex_id, name, surface_type, is_covered, has_lighting,
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

    public async Task<bool> CourtNameExistsInComplexExcludingCourtAsync(Guid complexId, string name, Guid courtId, CancellationToken ct)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1 
                FROM courts 
                WHERE complex_id = @ComplexId 
                  AND LOWER(name) = LOWER(@Name) 
                  AND id != @CourtId
                  AND deleted_at IS NULL
            );";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql,
            new { ComplexId = complexId, Name = name.Trim(), CourtId = courtId },
            cancellationToken: ct));
    }

    public async Task<int> GetActiveFutureBookingsCountAsync(Guid courtId, CancellationToken ct)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM bookings
            WHERE court_id = @CourtId
              AND deleted_at IS NULL
              AND status NOT IN ('cancelled', 'expired')
              AND start_time_utc > CURRENT_TIMESTAMP;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { CourtId = courtId },
            cancellationToken: ct));
    }

    public async Task<int> GetActiveFutureBookingsCountForSportAsync(Guid courtId, Guid sportId, CancellationToken ct)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM bookings
            WHERE court_id = @CourtId
              AND sport_id = @SportId
              AND deleted_at IS NULL
              AND status NOT IN ('cancelled', 'expired')
              AND start_time_utc > CURRENT_TIMESTAMP;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { CourtId = courtId, SportId = sportId },
            cancellationToken: ct));
    }

    public async Task<IReadOnlyList<CourtFutureBooking>> GetActiveFutureBookingsAsync(Guid courtId, CancellationToken ct)
    {
        const string sql = @"
            SELECT id, court_id, sport_id, start_time_utc, end_time_utc, status
            FROM bookings
            WHERE court_id = @CourtId
              AND deleted_at IS NULL
              AND status NOT IN ('cancelled', 'expired')
              AND start_time_utc > CURRENT_TIMESTAMP
            ORDER BY start_time_utc ASC;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var bookings = await connection.QueryAsync<CourtFutureBooking>(new CommandDefinition(
            sql,
            new { CourtId = courtId },
            cancellationToken: ct));
        return bookings.AsList();
    }

    public async Task<Court> UpdateCourtWithSportsAndPricingRulesAsync(
        Court court,
        IEnumerable<CourtSport> courtSports,
        IEnumerable<CourtPricingRule> pricingRules,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        const string updateCourtSql = @"
            UPDATE courts
            SET name = @Name,
                surface_type = @SurfaceType,
                is_covered = @IsCovered,
                has_lighting = @HasLighting,
                updated_at = @UpdatedAt,
                updated_by = @UpdatedBy
            WHERE id = @Id AND complex_id = @ComplexId AND deleted_at IS NULL;";

        await connection.ExecuteAsync(new CommandDefinition(
            updateCourtSql,
            new
            {
                court.Id,
                court.ComplexId,
                court.Name,
                court.SurfaceType,
                court.IsCovered,
                court.HasLighting,
                court.UpdatedAt,
                court.UpdatedBy
            },
            transaction: transaction,
            cancellationToken: ct));

        const string selectExistingCourtSportsSql = @"
            SELECT id, court_id, sport_id, duration_minutes, base_price, created_at, updated_at
            FROM courts_sports
            WHERE court_id = @CourtId;";

        var existingCourtSports = (await connection.QueryAsync<CourtSport>(new CommandDefinition(
            selectExistingCourtSportsSql,
            new { CourtId = court.Id },
            transaction: transaction,
            cancellationToken: ct))).ToList();

        var newCourtSportsList = courtSports.ToList();
        var newSportIds = newCourtSportsList.Select(cs => cs.SportId).ToHashSet();

        // 1. Eliminar courts_sports que ya no están asociados
        const string deleteCourtSportSql = "DELETE FROM courts_sports WHERE id = @Id;";
        var toDelete = existingCourtSports.Where(cs => !newSportIds.Contains(cs.SportId)).ToList();
        foreach (var cs in toDelete)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                deleteCourtSportSql,
                new { cs.Id },
                transaction: transaction,
                cancellationToken: ct));
        }

        // 2. Eliminar pricing_rules existentes de la cancha para reemplazarlas
        const string deletePricingRulesSql = @"
            DELETE FROM court_pricing_rules 
            WHERE court_sport_id IN (SELECT id FROM courts_sports WHERE court_id = @CourtId);";

        await connection.ExecuteAsync(new CommandDefinition(
            deletePricingRulesSql,
            new { CourtId = court.Id },
            transaction: transaction,
            cancellationToken: ct));

        // 3. Sincronizar courts_sports
        const string insertCourtSportSql = @"
            INSERT INTO courts_sports (
                id, court_id, sport_id, duration_minutes, base_price, created_at, updated_at
            ) VALUES (
                @Id, @CourtId, @SportId, @DurationMinutes, @BasePrice, @CreatedAt, @UpdatedAt
            );";

        const string updateCourtSportSql = @"
            UPDATE courts_sports
            SET duration_minutes = @DurationMinutes,
                base_price = @BasePrice,
                updated_at = @UpdatedAt
            WHERE id = @Id;";

        foreach (var cs in newCourtSportsList)
        {
            var existing = existingCourtSports.FirstOrDefault(e => e.SportId == cs.SportId);
            if (existing is not null)
            {
                await connection.ExecuteAsync(new CommandDefinition(
                    updateCourtSportSql,
                    new
                    {
                        existing.Id,
                        cs.DurationMinutes,
                        cs.BasePrice,
                        cs.UpdatedAt
                    },
                    transaction: transaction,
                    cancellationToken: ct));
            }
            else
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
        }

        // 4. Insertar las nuevas pricing rules
        const string insertPricingRuleSql = @"
            INSERT INTO court_pricing_rules (
                id, court_sport_id, day_of_week, start_time, end_time, price, duration_minutes, created_at, updated_at
            ) VALUES (
                @Id, @CourtSportId, @DayOfWeek, @StartTime, @EndTime, @Price, @DurationMinutes, @CreatedAt, @UpdatedAt
            );";

        foreach (var rule in pricingRules)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                insertPricingRuleSql,
                new
                {
                    rule.Id,
                    rule.CourtSportId,
                    rule.DayOfWeek,
                    rule.StartTime,
                    rule.EndTime,
                    rule.Price,
                    rule.DurationMinutes,
                    rule.CreatedAt,
                    rule.UpdatedAt
                },
                transaction: transaction,
                cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return court;
    }

    public async Task<bool> SoftDeleteCourtAsync(Guid courtId, Guid complexId, Guid userId, DateTimeOffset now, CancellationToken ct)
    {
        const string sql = @"
            UPDATE courts
            SET is_active = FALSE,
                deleted_at = @Now,
                deleted_by = @UserId,
                updated_at = @Now,
                updated_by = @UserId
            WHERE id = @CourtId AND complex_id = @ComplexId AND deleted_at IS NULL;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { CourtId = courtId, ComplexId = complexId, UserId = userId, Now = now },
            cancellationToken: ct));

        return rows > 0;
    }
}
