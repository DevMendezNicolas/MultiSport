using System.Data;
using System.Data.Common;
using Dapper;
using MultiSport.Api.Common;
using MultiSport.Api.Features.Bookings.Models.Dtos;
using MultiSport.Api.Features.Bookings.Models.Entities;

namespace MultiSport.Api.Features.Bookings.Repositories;

public sealed class BookingRepository : IBookingRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    private sealed record CourtOperatingSlotRow(
        Guid SportId,
        int DayOfWeek,
        TimeOnly StartTime,
        TimeOnly EndTime,
        decimal Price,
        int DurationMinutes
    );

    public BookingRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
    }

    private sealed record ComplexCourtOperatingSlotRow(
        Guid CourtId,
        Guid SportId,
        int DayOfWeek,
        TimeOnly StartTime,
        TimeOnly EndTime,
        decimal Price,
        int DurationMinutes
    );

    public async Task<IReadOnlyList<DailyGridCourtItem>> GetComplexCourtsWithSportsAsync(Guid complexId, CancellationToken ct)
    {
        const string sql = @"
            SELECT 
                c.id AS CourtId,
                c.name AS CourtName,
                c.surface_type AS Surface,
                c.is_covered AS IsIndoor,
                cs.sport_id AS SportId,
                s.name AS SportName,
                cs.duration_minutes AS DurationMinutes,
                cs.base_price AS BasePrice
            FROM courts c
            JOIN courts_sports cs ON cs.court_id = c.id
            JOIN sports s ON s.id = cs.sport_id
            WHERE c.complex_id = @ComplexId 
              AND c.deleted_at IS NULL 
              AND s.deleted_at IS NULL 
              AND s.is_active = TRUE
            ORDER BY c.name ASC, s.name ASC;";

        const string operatingRulesSql = @"
            SELECT
                cs.court_id AS CourtId,
                cs.sport_id AS SportId,
                cpr.day_of_week AS DayOfWeek,
                cpr.start_time AS StartTime,
                cpr.end_time AS EndTime,
                cpr.price AS Price,
                cpr.duration_minutes AS DurationMinutes
            FROM court_pricing_rules cpr
            JOIN courts_sports cs ON cs.id = cpr.court_sport_id
            JOIN courts c ON c.id = cs.court_id
            WHERE c.complex_id = @ComplexId
              AND c.deleted_at IS NULL
            ORDER BY cpr.day_of_week ASC, cpr.start_time ASC;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<dynamic>(new CommandDefinition(sql, new { ComplexId = complexId }, cancellationToken: ct));
        var ruleRows = await connection.QueryAsync<ComplexCourtOperatingSlotRow>(new CommandDefinition(
            operatingRulesSql,
            new { ComplexId = complexId },
            cancellationToken: ct));

        var windowsByCourt = ruleRows
            .GroupBy(r => r.CourtId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<GridOperatingWindowItem>)g.Select(r => new GridOperatingWindowItem(
                    r.SportId,
                    r.DayOfWeek,
                    r.StartTime.ToString("HH:mm"),
                    r.EndTime == TimeOnly.MinValue && r.StartTime > TimeOnly.MinValue
                        ? "24:00"
                        : r.EndTime.ToString("HH:mm"),
                    r.Price,
                    r.DurationMinutes
                )).ToList());

        var courtMap = new Dictionary<Guid, (DailyGridCourtItem Court, List<GridSportItem> Sports)>();

        foreach (var row in rows)
        {
            Guid courtId = row.courtid;
            if (!courtMap.TryGetValue(courtId, out var entry))
            {
                var court = new DailyGridCourtItem(
                    courtId,
                    (string)row.courtname,
                    (string)row.surface,
                    (bool)row.isindoor,
                    Array.Empty<GridSportItem>(),
                    Array.Empty<GridBookingItem>(),
                    Array.Empty<GridOperatingWindowItem>()
                );
                entry = (court, new List<GridSportItem>());
                courtMap[courtId] = entry;
            }

            entry.Sports.Add(new GridSportItem(
                (Guid)row.sportid,
                (string)row.sportname,
                (int)row.durationminutes,
                (decimal)row.baseprice
            ));
        }

        return courtMap.Values.Select(v => v.Court with
        {
            Sports = v.Sports,
            OperatingWindows = windowsByCourt.TryGetValue(v.Court.CourtId, out var windows)
                ? windows
                : Array.Empty<GridOperatingWindowItem>()
        }).ToList();
    }

    public async Task<IReadOnlyList<GridBookingItem>> GetBookingsForDateRangeAsync(
        Guid complexId,
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken ct)
    {
        const string sql = @"
            SELECT 
                b.id AS Id,
                b.court_id AS CourtId,
                b.sport_id AS SportId,
                s.name AS SportName,
                b.customer_name AS CustomerName,
                b.customer_phone AS CustomerPhone,
                b.start_time_utc AS StartTimeUtc,
                b.end_time_utc AS EndTimeUtc,
                b.total_price AS TotalPrice,
                b.deposit_amount AS DepositAmount,
                b.status AS Status,
                b.is_recurring AS IsRecurring,
                b.notes AS Notes
            FROM bookings b
            JOIN sports s ON s.id = b.sport_id
            WHERE b.complex_id = @ComplexId
              AND b.start_time_utc < @EndUtc
              AND b.end_time_utc > @StartUtc
              AND b.deleted_at IS NULL
              AND b.status NOT IN ('cancelled', 'expired')
            ORDER BY b.start_time_utc ASC;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var bookings = await connection.QueryAsync<GridBookingItem>(new CommandDefinition(
            sql,
            new { ComplexId = complexId, StartUtc = startUtc, EndUtc = endUtc },
            cancellationToken: ct));

        return bookings.AsList();
    }

    public async Task<IReadOnlyList<RecurringBookingRule>> GetActiveRecurringRulesForDayAsync(
        Guid complexId,
        int dayOfWeek,
        CancellationToken ct)
    {
        var previousDayOfWeek = (dayOfWeek + 6) % 7;

        const string sql = @"
            SELECT 
                id AS Id,
                complex_id AS ComplexId,
                court_id AS CourtId,
                sport_id AS SportId,
                customer_id AS CustomerId,
                customer_name AS CustomerName,
                customer_phone AS CustomerPhone,
                day_of_week AS DayOfWeek,
                start_time AS StartTime,
                end_time AS EndTime,
                price AS Price,
                is_active AS IsActive,
                notes AS Notes,
                created_at AS CreatedAt,
                created_by AS CreatedBy,
                updated_at AS UpdatedAt,
                updated_by AS UpdatedBy,
                deleted_at AS DeletedAt,
                deleted_by AS DeletedBy
            FROM recurring_booking_rules
            WHERE complex_id = @ComplexId
              AND is_active = TRUE
              AND deleted_at IS NULL
              AND (
                  day_of_week = @DayOfWeek
                  OR (day_of_week = @PreviousDayOfWeek AND end_time < start_time AND end_time > '00:00:00'::time)
              );";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var rules = await connection.QueryAsync<RecurringBookingRule>(new CommandDefinition(
            sql,
            new { ComplexId = complexId, DayOfWeek = dayOfWeek, PreviousDayOfWeek = previousDayOfWeek },
            cancellationToken: ct));

        return rules.AsList();
    }

    public async Task<BookingResponse?> GetBookingDetailByIdAsync(Guid bookingId, Guid complexId, CancellationToken ct)
    {
        const string bookingSql = @"
            SELECT 
                b.id AS Id,
                b.complex_id AS ComplexId,
                b.court_id AS CourtId,
                c.name AS CourtName,
                b.sport_id AS SportId,
                s.name AS SportName,
                b.customer_id AS CustomerId,
                b.customer_name AS CustomerName,
                b.customer_phone AS CustomerPhone,
                b.customer_email AS CustomerEmail,
                b.start_time_utc AS StartTimeUtc,
                b.end_time_utc AS EndTimeUtc,
                b.total_price AS TotalPrice,
                b.deposit_amount AS DepositAmount,
                (b.total_price - b.deposit_amount) AS Balance,
                b.status AS Status,
                b.is_recurring AS IsRecurring,
                b.recurring_group_id AS RecurringGroupId,
                b.notes AS Notes,
                b.created_at AS CreatedAt
            FROM bookings b
            JOIN courts c ON c.id = b.court_id
            JOIN sports s ON s.id = b.sport_id
            WHERE b.id = @BookingId 
              AND b.complex_id = @ComplexId
              AND b.deleted_at IS NULL;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var row = await connection.QuerySingleOrDefaultAsync<dynamic>(new CommandDefinition(
            bookingSql,
            new { BookingId = bookingId, ComplexId = complexId },
            cancellationToken: ct));

        if (row is null)
        {
            return null;
        }

        var payments = await GetPaymentsByBookingIdInternalAsync(connection, bookingId, ct);

        return new BookingResponse(
            (Guid)row.id,
            (Guid)row.complexid,
            (Guid)row.courtid,
            (string)row.courtname,
            (Guid)row.sportid,
            (string)row.sportname,
            (Guid?)row.customerid,
            (string)row.customername,
            (string)row.customerphone,
            (string?)row.customeremail,
            (DateTimeOffset)row.starttimeutc,
            (DateTimeOffset)row.endtimeutc,
            (decimal)row.totalprice,
            (decimal)row.depositamount,
            (decimal)row.balance,
            (string)row.status,
            (bool)row.isrecurring,
            (Guid?)row.recurringgroupid,
            (string?)row.notes,
            (DateTimeOffset)row.createdat,
            payments
        );
    }

    public async Task<Booking?> GetBookingEntityByIdAsync(Guid bookingId, Guid complexId, CancellationToken ct)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                complex_id AS ComplexId,
                court_id AS CourtId,
                sport_id AS SportId,
                customer_id AS CustomerId,
                customer_name AS CustomerName,
                customer_phone AS CustomerPhone,
                customer_email AS CustomerEmail,
                start_time_utc AS StartTimeUtc,
                end_time_utc AS EndTimeUtc,
                total_price AS TotalPrice,
                deposit_amount AS DepositAmount,
                status AS Status,
                expires_at_utc AS ExpiresAtUtc,
                is_recurring AS IsRecurring,
                recurring_group_id AS RecurringGroupId,
                notes AS Notes,
                created_at AS CreatedAt,
                created_by AS CreatedBy,
                updated_at AS UpdatedAt,
                updated_by AS UpdatedBy,
                deleted_at AS DeletedAt,
                deleted_by AS DeletedBy
            FROM bookings
            WHERE id = @BookingId 
              AND complex_id = @ComplexId
              AND deleted_at IS NULL;";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Booking>(new CommandDefinition(
            sql,
            new { BookingId = bookingId, ComplexId = complexId },
            cancellationToken: ct));
    }

    public async Task<IReadOnlyList<PaymentResponse>> GetPaymentsByBookingIdAsync(Guid bookingId, CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        return await GetPaymentsByBookingIdInternalAsync(connection, bookingId, ct);
    }

    private static async Task<IReadOnlyList<PaymentResponse>> GetPaymentsByBookingIdInternalAsync(
        DbConnection connection,
        Guid bookingId,
        CancellationToken ct)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                booking_id AS BookingId,
                amount AS Amount,
                payment_method AS PaymentMethod,
                payment_type AS PaymentType,
                status AS Status,
                receipt_url AS ReceiptUrl,
                notes AS Notes,
                created_at AS CreatedAt
            FROM payments
            WHERE booking_id = @BookingId
            ORDER BY created_at ASC;";

        var payments = await connection.QueryAsync<PaymentResponse>(new CommandDefinition(
            sql,
            new { BookingId = bookingId },
            cancellationToken: ct));

        return payments.AsList();
    }

    private static async Task<bool> LockCourtsInDeterministicOrderAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid complexId,
        IEnumerable<Guid> courtIds,
        CancellationToken ct)
    {
        var distinctOrderedIds = courtIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .OrderBy(id => id)
            .ToArray();

        if (distinctOrderedIds.Length == 0)
        {
            return false;
        }

        const string lockSql = @"
            SELECT id
            FROM courts
            WHERE id = ANY(@CourtIds)
              AND complex_id = @ComplexId
              AND deleted_at IS NULL
              AND is_active = TRUE
            ORDER BY id ASC
            FOR UPDATE;";

        var lockedIds = (await connection.QueryAsync<Guid>(new CommandDefinition(
            lockSql,
            new { CourtIds = distinctOrderedIds, ComplexId = complexId },
            transaction: transaction,
            cancellationToken: ct))).AsList();

        return lockedIds.Count == distinctOrderedIds.Length;
    }

    private static async Task<List<CourtOperatingSlotRow>> GetCourtOperatingRulesInternalAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid courtId,
        CancellationToken ct)
    {
        const string sql = @"
            SELECT
                cs.sport_id AS SportId,
                cpr.day_of_week AS DayOfWeek,
                cpr.start_time AS StartTime,
                cpr.end_time AS EndTime,
                cpr.price AS Price,
                cpr.duration_minutes AS DurationMinutes
            FROM court_pricing_rules cpr
            JOIN courts_sports cs ON cs.id = cpr.court_sport_id
            WHERE cs.court_id = @CourtId
            ORDER BY cpr.day_of_week ASC, cpr.start_time ASC;";

        var rows = await connection.QueryAsync<CourtOperatingSlotRow>(new CommandDefinition(
            sql,
            new { CourtId = courtId },
            transaction: transaction,
            cancellationToken: ct));

        return rows.AsList();
    }

    private static async Task<List<Guid>> GetCourtSportIdsInternalAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid courtId,
        CancellationToken ct)
    {
        const string sql = @"
            SELECT sport_id
            FROM courts_sports
            WHERE court_id = @CourtId;";

        var sportIds = await connection.QueryAsync<Guid>(new CommandDefinition(
            sql,
            new { CourtId = courtId },
            transaction: transaction,
            cancellationToken: ct));

        return sportIds.AsList();
    }

    private static async Task<List<RecurringBookingRule>> GetActiveRecurringRulesForCourtInternalAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid complexId,
        Guid courtId,
        CancellationToken ct)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                complex_id AS ComplexId,
                court_id AS CourtId,
                sport_id AS SportId,
                customer_id AS CustomerId,
                customer_name AS CustomerName,
                customer_phone AS CustomerPhone,
                day_of_week AS DayOfWeek,
                start_time AS StartTime,
                end_time AS EndTime,
                price AS Price,
                is_active AS IsActive,
                notes AS Notes,
                created_at AS CreatedAt,
                created_by AS CreatedBy,
                updated_at AS UpdatedAt,
                updated_by AS UpdatedBy,
                deleted_at AS DeletedAt,
                deleted_by AS DeletedBy
            FROM recurring_booking_rules
            WHERE complex_id = @ComplexId
              AND court_id = @CourtId
              AND is_active = TRUE
              AND deleted_at IS NULL;";

        var rules = await connection.QueryAsync<RecurringBookingRule>(new CommandDefinition(
            sql,
            new { ComplexId = complexId, CourtId = courtId },
            transaction: transaction,
            cancellationToken: ct));

        return rules.AsList();
    }

    private static string FormatSliceTime(TimeSpan ts) =>
        ts >= ComplexTimeHelper.EndOfDayTimeSpan
            ? "24:00"
            : $"{(int)ts.TotalHours:D2}:{ts.Minutes:D2}";

    private static BookingWriteResult? ValidateOperatingScheduleAndRecurringRules(
        DateTimeOffset startTimeUtc,
        DateTimeOffset endTimeUtc,
        bool isBlock,
        Guid sportId,
        IReadOnlyList<Guid> courtSportIds,
        IReadOnlyList<CourtOperatingSlotRow> operatingRules,
        IReadOnlyList<RecurringBookingRule> activeRecurringRules)
    {
        if (!isBlock && !courtSportIds.Contains(sportId))
        {
            return new BookingWriteResult(
                BookingWriteStatus.SportNotAvailableOnCourt,
                "La disciplina seleccionada no se encuentra habilitada en esta cancha.");
        }

        var slices = ComplexTimeHelper.SplitIntoComplexLocalDaySlices(startTimeUtc, endTimeUtc);
        if (slices.Count == 0)
        {
            return new BookingWriteResult(
                BookingWriteStatus.OutsideOperatingHours,
                "El rango horario solicitado es inválido.");
        }

        if (slices.Count > 1)
        {
            for (var i = 0; i < slices.Count - 1; i++)
            {
                if (slices[i].SliceEnd != ComplexTimeHelper.EndOfDayTimeSpan ||
                    slices[i + 1].SliceStart != TimeSpan.Zero)
                {
                    return new BookingWriteResult(
                        BookingWriteStatus.OutsideOperatingHours,
                        "El rango que cruza medianoche debe mantener continuidad operativa ininterrumpida entre el cierre a las 24:00 y la apertura a las 00:00 del día siguiente.");
                }
            }
        }

        foreach (var slice in slices)
        {
            var dayRules = isBlock
                ? operatingRules.Where(r => r.DayOfWeek == slice.DayOfWeek)
                : operatingRules.Where(r => r.DayOfWeek == slice.DayOfWeek && r.SportId == sportId);

            var availableIntervals = dayRules.Select(r => (
                Start: r.StartTime.ToTimeSpan(),
                End: ComplexTimeHelper.NormalizeEndTimeSpan(r.EndTime)
            ));

            var isCovered = ComplexTimeHelper.IsSliceCoveredByContinuousIntervals(
                slice.SliceStart,
                slice.SliceEnd,
                availableIntervals);

            if (!isCovered)
            {
                var dayName = ComplexTimeHelper.GetDayOfWeekName(slice.DayOfWeek);
                var startLabel = FormatSliceTime(slice.SliceStart);
                var endLabel = FormatSliceTime(slice.SliceEnd);
                var message = isBlock
                    ? $"El bloqueo solicitado para el día {dayName} ({startLabel} a {endLabel} hs) excede el horario de apertura/cierre configurado para la cancha o atraviesa un cierre intermedio."
                    : $"El turno solicitado para el día {dayName} ({startLabel} a {endLabel} hs) se encuentra fuera del horario operativo continuo configurado para esta disciplina.";

                return new BookingWriteResult(BookingWriteStatus.OutsideOperatingHours, message);
            }

            // Verificar colisión contra reglas fijas (tanto del mismo día como derrames nocturnos del día anterior)
            foreach (var rule in activeRecurringRules)
            {
                var projectedIntervals = ComplexTimeHelper.ProjectRecurringRuleOntoLocalDay(
                    rule.DayOfWeek,
                    rule.StartTime.ToTimeSpan(),
                    rule.EndTime.ToTimeSpan(),
                    slice.DayOfWeek);

                foreach (var projected in projectedIntervals)
                {
                    if (slice.SliceStart < projected.End && slice.SliceEnd > projected.Start)
                    {
                        var dayName = ComplexTimeHelper.GetDayOfWeekName(slice.DayOfWeek);
                        var pStart = FormatSliceTime(projected.Start);
                        var pEnd = FormatSliceTime(projected.End);
                        return new BookingWriteResult(
                            BookingWriteStatus.RecurringRuleConflict,
                            $"El horario solicitado el día {dayName} se superpone con el turno fijo de {rule.CustomerName} ({pStart} a {pEnd} hs).");
                    }
                }
            }
        }

        return null;
    }

    public async Task<BookingWriteResult> CreateBookingWithOptionalPaymentAsync(
        Booking booking,
        Payment? payment,
        Customer? customer,
        RecurringBookingRule? recurringRule,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            // 1. Bloquear la fila de la cancha en orden determinístico
            var courtLocked = await LockCourtsInDeterministicOrderAsync(
                connection,
                transaction,
                booking.ComplexId,
                [booking.CourtId],
                ct);

            if (!courtLocked)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(
                    BookingWriteStatus.CourtNotFound,
                    "La cancha especificada no existe o no se encuentra activa en el complejo.");
            }

            var isBlock = booking.Status == "blocked";
            var courtSportIds = await GetCourtSportIdsInternalAsync(connection, transaction, booking.CourtId, ct);
            if (courtSportIds.Count == 0)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(
                    BookingWriteStatus.SportNotAvailableOnCourt,
                    "La cancha no posee disciplinas configuradas.");
            }

            if (isBlock && booking.SportId == Guid.Empty)
            {
                booking.SportId = courtSportIds[0];
            }

            var operatingRules = await GetCourtOperatingRulesInternalAsync(connection, transaction, booking.CourtId, ct);
            var activeRecurringRules = await GetActiveRecurringRulesForCourtInternalAsync(
                connection,
                transaction,
                booking.ComplexId,
                booking.CourtId,
                ct);

            // 2. Validar cobertura continua de horario operativo y ausencia de colisiones con turnos fijos
            var validationError = ValidateOperatingScheduleAndRecurringRules(
                booking.StartTimeUtc,
                booking.EndTimeUtc,
                isBlock,
                booking.SportId,
                courtSportIds,
                operatingRules,
                activeRecurringRules);

            if (validationError is not null)
            {
                await transaction.RollbackAsync(ct);
                return validationError;
            }

            // 3. Resolver o registrar cliente si es reserva comercial
            if (customer != null)
            {
                const string customerLookupSql = @"
                    SELECT id 
                    FROM customers 
                    WHERE complex_id = @ComplexId 
                      AND phone = @Phone 
                      AND deleted_at IS NULL 
                    LIMIT 1;";

                var existingCustomerId = await connection.ExecuteScalarAsync<Guid?>(new CommandDefinition(
                    customerLookupSql,
                    new { customer.ComplexId, customer.Phone },
                    transaction,
                    cancellationToken: ct));

                if (existingCustomerId.HasValue)
                {
                    booking.CustomerId = existingCustomerId.Value;

                    const string updateCustomerSql = @"
                        UPDATE customers 
                        SET name = @Name,
                            email = COALESCE(@Email, email),
                            updated_at = @UpdatedAt,
                            updated_by = @UpdatedBy
                        WHERE id = @Id;";

                    await connection.ExecuteAsync(new CommandDefinition(
                        updateCustomerSql,
                        new
                        {
                            Id = existingCustomerId.Value,
                            customer.Name,
                            customer.Email,
                            UpdatedAt = DateTimeOffset.UtcNow,
                            UpdatedBy = booking.CreatedBy
                        },
                        transaction,
                        cancellationToken: ct));
                }
                else
                {
                    customer.Id = Guid.NewGuid();
                    customer.CreatedAt = DateTimeOffset.UtcNow;
                    customer.UpdatedAt = DateTimeOffset.UtcNow;
                    customer.CreatedBy = booking.CreatedBy;

                    const string insertCustomerSql = @"
                        INSERT INTO customers (
                            id, complex_id, name, phone, email, notes, created_at, created_by, updated_at
                        ) VALUES (
                            @Id, @ComplexId, @Name, @Phone, @Email, @Notes, @CreatedAt, @CreatedBy, @UpdatedAt
                        );";

                    await connection.ExecuteAsync(new CommandDefinition(
                        insertCustomerSql,
                        customer,
                        transaction,
                        cancellationToken: ct));

                    booking.CustomerId = customer.Id;
                }
            }

            // 4. Si incluye regla de turno fijo, insertarla dentro de la misma transacción
            if (recurringRule != null)
            {
                recurringRule.CustomerId = booking.CustomerId;

                const string insertRecurringRuleSql = @"
                    INSERT INTO recurring_booking_rules (
                        id, complex_id, court_id, sport_id, customer_id, customer_name, customer_phone,
                        day_of_week, start_time, end_time, price, is_active, notes,
                        created_at, created_by, updated_at, updated_by
                    ) VALUES (
                        @Id, @ComplexId, @CourtId, @SportId, @CustomerId, @CustomerName, @CustomerPhone,
                        @DayOfWeek, @StartTime, @EndTime, @Price, @IsActive, @Notes,
                        @CreatedAt, @CreatedBy, @UpdatedAt, @UpdatedBy
                    );";

                await connection.ExecuteAsync(new CommandDefinition(
                    insertRecurringRuleSql,
                    recurringRule,
                    transaction,
                    cancellationToken: ct));

                booking.RecurringGroupId = recurringRule.Id;
            }

            // 5. Insertar reserva o bloqueo (protegido por GiST exc_bookings_no_overlap)
            const string insertBookingSql = @"
                INSERT INTO bookings (
                    id, complex_id, court_id, sport_id, customer_id, customer_name, customer_phone,
                    customer_email, start_time_utc, end_time_utc, total_price, deposit_amount,
                    status, expires_at_utc, is_recurring, recurring_group_id, notes,
                    created_at, created_by, updated_at, updated_by
                ) VALUES (
                    @Id, @ComplexId, @CourtId, @SportId, @CustomerId, @CustomerName, @CustomerPhone,
                    @CustomerEmail, @StartTimeUtc, @EndTimeUtc, @TotalPrice, @DepositAmount,
                    @Status, @ExpiresAtUtc, @IsRecurring, @RecurringGroupId, @Notes,
                    @CreatedAt, @CreatedBy, @UpdatedAt, @UpdatedBy
                );";

            await connection.ExecuteAsync(new CommandDefinition(
                insertBookingSql,
                booking,
                transaction,
                cancellationToken: ct));

            // 6. Registrar pago o seña inicial si corresponde
            if (payment != null)
            {
                payment.BookingId = booking.Id;
                payment.CreatedAt = DateTimeOffset.UtcNow;
                payment.CreatedBy = booking.CreatedBy;

                const string insertPaymentSql = @"
                    INSERT INTO payments (
                        id, booking_id, amount, payment_method, payment_type, status, receipt_url, notes, created_at, created_by
                    ) VALUES (
                        @Id, @BookingId, @Amount, @PaymentMethod, @PaymentType, @Status, @ReceiptUrl, @Notes, @CreatedAt, @CreatedBy
                    );";

                await connection.ExecuteAsync(new CommandDefinition(
                    insertPaymentSql,
                    payment,
                    transaction,
                    cancellationToken: ct));
            }

            await transaction.CommitAsync(ct);
            return new BookingWriteResult(BookingWriteStatus.Success, Booking: booking);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<Payment> RecordPaymentAsync(
        Payment payment,
        decimal newDepositAmount,
        string newStatus,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            const string insertPaymentSql = @"
                INSERT INTO payments (
                    id, booking_id, amount, payment_method, payment_type, status, receipt_url, notes, created_at, created_by
                ) VALUES (
                    @Id, @BookingId, @Amount, @PaymentMethod, @PaymentType, @Status, @ReceiptUrl, @Notes, @CreatedAt, @CreatedBy
                );";

            await connection.ExecuteAsync(new CommandDefinition(
                insertPaymentSql,
                payment,
                transaction,
                cancellationToken: ct));

            const string updateBookingSql = @"
                UPDATE bookings 
                SET deposit_amount = @NewDepositAmount,
                    status = @NewStatus,
                    updated_at = @Now,
                    updated_by = @UserId
                WHERE id = @BookingId;";

            await connection.ExecuteAsync(new CommandDefinition(
                updateBookingSql,
                new
                {
                    NewDepositAmount = newDepositAmount,
                    NewStatus = newStatus,
                    Now = now,
                    UserId = userId,
                    BookingId = payment.BookingId
                },
                transaction,
                cancellationToken: ct));

            await transaction.CommitAsync(ct);
            return payment;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> CancelBookingAsync(
        Guid bookingId,
        Guid complexId,
        string reason,
        Payment? refundPayment,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            var cancelNote = $"[Cancelado: {reason.Trim()}]";

            const string cancelBookingSql = @"
                UPDATE bookings
                SET status = 'cancelled',
                    notes = CASE 
                        WHEN notes IS NULL OR notes = '' THEN @CancelNote
                        ELSE CONCAT(notes, ' | ', @CancelNote)
                    END,
                    updated_at = @Now,
                    updated_by = @UserId
                WHERE id = @BookingId 
                  AND complex_id = @ComplexId 
                  AND deleted_at IS NULL;";

            var affected = await connection.ExecuteAsync(new CommandDefinition(
                cancelBookingSql,
                new
                {
                    BookingId = bookingId,
                    ComplexId = complexId,
                    CancelNote = cancelNote,
                    Now = now,
                    UserId = userId
                },
                transaction,
                cancellationToken: ct));

            if (affected == 0)
            {
                await transaction.RollbackAsync(ct);
                return false;
            }

            if (refundPayment != null)
            {
                const string insertPaymentSql = @"
                    INSERT INTO payments (
                        id, booking_id, amount, payment_method, payment_type, status, receipt_url, notes, created_at, created_by
                    ) VALUES (
                        @Id, @BookingId, @Amount, @PaymentMethod, @PaymentType, @Status, @ReceiptUrl, @Notes, @CreatedAt, @CreatedBy
                    );";

                await connection.ExecuteAsync(new CommandDefinition(
                    insertPaymentSql,
                    refundPayment,
                    transaction,
                    cancellationToken: ct));
            }

            await transaction.CommitAsync(ct);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<BookingWriteResult> RescheduleBookingAsync(
        Guid bookingId,
        Guid complexId,
        Guid sourceCourtId,
        Guid newCourtId,
        Guid sportId,
        DateTimeOffset newStartUtc,
        DateTimeOffset newEndUtc,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            // Bloquear tanto la cancha de origen como la de destino en orden determinístico ascendente
            var courtsLocked = await LockCourtsInDeterministicOrderAsync(
                connection,
                transaction,
                complexId,
                [sourceCourtId, newCourtId],
                ct);

            if (!courtsLocked)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(
                    BookingWriteStatus.CourtNotFound,
                    "La cancha seleccionada no existe o no se encuentra activa en el complejo.");
            }

            var targetCourtSportIds = await GetCourtSportIdsInternalAsync(connection, transaction, newCourtId, ct);
            var operatingRules = await GetCourtOperatingRulesInternalAsync(connection, transaction, newCourtId, ct);
            var activeRecurringRules = await GetActiveRecurringRulesForCourtInternalAsync(
                connection,
                transaction,
                complexId,
                newCourtId,
                ct);

            var validationError = ValidateOperatingScheduleAndRecurringRules(
                newStartUtc,
                newEndUtc,
                isBlock: false,
                sportId,
                targetCourtSportIds,
                operatingRules,
                activeRecurringRules);

            if (validationError is not null)
            {
                await transaction.RollbackAsync(ct);
                return validationError;
            }

            const string sql = @"
                UPDATE bookings
                SET court_id = @NewCourtId,
                    start_time_utc = @NewStartUtc,
                    end_time_utc = @NewEndUtc,
                    updated_at = @Now,
                    updated_by = @UserId
                WHERE id = @BookingId 
                  AND complex_id = @ComplexId 
                  AND deleted_at IS NULL;";

            var affected = await connection.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    BookingId = bookingId,
                    ComplexId = complexId,
                    NewCourtId = newCourtId,
                    NewStartUtc = newStartUtc,
                    NewEndUtc = newEndUtc,
                    Now = now,
                    UserId = userId
                },
                transaction: transaction,
                cancellationToken: ct));

            if (affected == 0)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(BookingWriteStatus.NotFound, "La reserva no fue encontrada.");
            }

            await transaction.CommitAsync(ct);
            return new BookingWriteResult(BookingWriteStatus.Success);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<BookingWriteResult> UpdateBlockAsync(
        Guid bookingId,
        Guid complexId,
        Guid sourceCourtId,
        Guid newCourtId,
        DateTimeOffset newStartUtc,
        DateTimeOffset newEndUtc,
        string reason,
        Guid userId,
        DateTimeOffset now,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            // Bloquear tanto la cancha de origen como la de destino en orden determinístico ascendente
            var courtsLocked = await LockCourtsInDeterministicOrderAsync(
                connection,
                transaction,
                complexId,
                [sourceCourtId, newCourtId],
                ct);

            if (!courtsLocked)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(
                    BookingWriteStatus.CourtNotFound,
                    "La cancha seleccionada no existe o no se encuentra activa en el complejo.");
            }

            var targetCourtSportIds = await GetCourtSportIdsInternalAsync(connection, transaction, newCourtId, ct);
            if (targetCourtSportIds.Count == 0)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(
                    BookingWriteStatus.SportNotAvailableOnCourt,
                    "La cancha seleccionada no tiene disciplinas configuradas.");
            }

            var operatingRules = await GetCourtOperatingRulesInternalAsync(connection, transaction, newCourtId, ct);
            var activeRecurringRules = await GetActiveRecurringRulesForCourtInternalAsync(
                connection,
                transaction,
                complexId,
                newCourtId,
                ct);

            var validationError = ValidateOperatingScheduleAndRecurringRules(
                newStartUtc,
                newEndUtc,
                isBlock: true,
                targetCourtSportIds[0],
                targetCourtSportIds,
                operatingRules,
                activeRecurringRules);

            if (validationError is not null)
            {
                await transaction.RollbackAsync(ct);
                return validationError;
            }

            const string sql = @"
                UPDATE bookings
                SET court_id = @NewCourtId,
                    sport_id = @NewSportId,
                    start_time_utc = @NewStartUtc,
                    end_time_utc = @NewEndUtc,
                    notes = @Reason,
                    updated_at = @Now,
                    updated_by = @UserId
                WHERE id = @BookingId 
                  AND complex_id = @ComplexId 
                  AND status = 'blocked'
                  AND deleted_at IS NULL;";

            var affected = await connection.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    BookingId = bookingId,
                    ComplexId = complexId,
                    NewCourtId = newCourtId,
                    NewSportId = targetCourtSportIds[0],
                    NewStartUtc = newStartUtc,
                    NewEndUtc = newEndUtc,
                    Reason = reason.Trim(),
                    Now = now,
                    UserId = userId
                },
                transaction: transaction,
                cancellationToken: ct));

            if (affected == 0)
            {
                await transaction.RollbackAsync(ct);
                return new BookingWriteResult(BookingWriteStatus.NotFound, "El bloqueo operativo no fue encontrado.");
            }

            await transaction.CommitAsync(ct);
            return new BookingWriteResult(BookingWriteStatus.Success);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IReadOnlyList<CustomerLookupDto>> SearchCustomersAsync(
        Guid complexId,
        string searchTerm,
        CancellationToken ct)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                name AS Name,
                phone AS Phone,
                email AS Email,
                notes AS Notes
            FROM customers
            WHERE complex_id = @ComplexId
              AND deleted_at IS NULL
              AND (name ILIKE @SearchPattern OR phone ILIKE @SearchPattern)
            ORDER BY name ASC
            LIMIT 10;";

        var pattern = $"%{searchTerm.Trim()}%";

        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);
        var customers = await connection.QueryAsync<CustomerLookupDto>(new CommandDefinition(
            sql,
            new { ComplexId = complexId, SearchPattern = pattern },
            cancellationToken: ct));

        return customers.AsList();
    }

    public async Task<(decimal Price, string RuleName, bool HasRule)> GetPriceQuoteAsync(
        Guid courtId,
        Guid sportId,
        int dayOfWeek,
        TimeOnly startTime,
        CancellationToken ct)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(ct);

        const string ruleSql = @"
            SELECT 
                cpr.price AS Price,
                'Tarifa de Franja Horaria' AS RuleName
            FROM court_pricing_rules cpr
            JOIN courts_sports cs ON cs.id = cpr.court_sport_id
            WHERE cs.court_id = @CourtId 
              AND cs.sport_id = @SportId
              AND cpr.day_of_week = @DayOfWeek
              AND (
                  (@StartTime >= cpr.start_time AND @StartTime < cpr.end_time)
                  OR (cpr.end_time = '00:00:00'::time AND @StartTime >= cpr.start_time)
              )
            ORDER BY cpr.start_time ASC
            LIMIT 1;";

        var ruleResult = await connection.QuerySingleOrDefaultAsync<dynamic>(new CommandDefinition(
            ruleSql,
            new
            {
                CourtId = courtId,
                SportId = sportId,
                DayOfWeek = dayOfWeek,
                StartTime = startTime
            },
            cancellationToken: ct));

        if (ruleResult != null)
        {
            return ((decimal)ruleResult.price, (string)ruleResult.rulename, true);
        }

        const string basePriceSql = @"
            SELECT cs.base_price 
            FROM courts_sports cs
            WHERE cs.court_id = @CourtId AND cs.sport_id = @SportId
            LIMIT 1;";

        var basePrice = await connection.ExecuteScalarAsync<decimal?>(new CommandDefinition(
            basePriceSql,
            new { CourtId = courtId, SportId = sportId },
            cancellationToken: ct));

        return (basePrice ?? 0m, "Tarifa Base", false);
    }
}
