using Dapper;
using MultiSport.Api.Common;
using MultiSport.Api.Features.Complexes.Models.Dtos;

namespace MultiSport.Api.Features.Complexes.Repositories;

public sealed class ComplexRepository : IComplexRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ComplexRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<ComplexProfileResponse?> GetProfileAsync(Guid complexId, CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);

        const string complexSql = @"
            SELECT id, name, tax_id, cbu_alias, address, phone, city, logo_url
            FROM complexes
            WHERE id = @ComplexId AND deleted_at IS NULL;";

        var complex = await connection.QuerySingleOrDefaultAsync<dynamic>(
            new CommandDefinition(complexSql, new { ComplexId = complexId }, cancellationToken: ct));

        if (complex is null)
        {
            return null;
        }

        const string schedulesSql = @"
            SELECT day_of_week, opening_time, closing_time, is_closed
            FROM complex_schedules
            WHERE complex_id = @ComplexId
            ORDER BY (CASE WHEN day_of_week = 0 THEN 7 ELSE day_of_week END);";

        var schedules = await connection.QueryAsync<ComplexScheduleItemDto>(
            new CommandDefinition(schedulesSql, new { ComplexId = complexId }, cancellationToken: ct));

        return new ComplexProfileResponse(
            (Guid)complex.id,
            (string)complex.name,
            (string?)complex.tax_id,
            (string?)complex.cbu_alias,
            (string?)complex.address,
            (string?)complex.phone,
            (string?)complex.city,
            (string?)complex.logo_url,
            schedules.AsList()
        );
    }

    public async Task<bool> UpdateProfileAsync(Guid complexId, UpdateComplexProfileRequest request, CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);

        const string sql = @"
            UPDATE complexes
            SET name = @Name,
                tax_id = @TaxId,
                cbu_alias = @CbuAlias,
                address = @Address,
                phone = @Phone,
                city = @City,
                logo_url = @LogoUrl,
                updated_at = NOW()
            WHERE id = @ComplexId AND deleted_at IS NULL;";

        var rowsAffected = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                ComplexId = complexId,
                request.Name,
                request.TaxId,
                request.CbuAlias,
                request.Address,
                request.Phone,
                request.City,
                request.LogoUrl
            },
            cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> UpsertSchedulesAsync(Guid complexId, IEnumerable<ComplexScheduleItemDto> schedules, CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        const string upsertSql = @"
            INSERT INTO complex_schedules (
                id, complex_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at
            ) VALUES (
                @Id, @ComplexId, @DayOfWeek, @OpeningTime, @ClosingTime, @IsClosed, NOW(), NOW()
            )
            ON CONFLICT (complex_id, day_of_week)
            DO UPDATE SET
                opening_time = EXCLUDED.opening_time,
                closing_time = EXCLUDED.closing_time,
                is_closed = EXCLUDED.is_closed,
                updated_at = NOW();";

        foreach (var item in schedules)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                upsertSql,
                new
                {
                    Id = Guid.NewGuid(),
                    ComplexId = complexId,
                    item.DayOfWeek,
                    item.OpeningTime,
                    item.ClosingTime,
                    item.IsClosed
                },
                transaction: transaction,
                cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return true;
    }
}
