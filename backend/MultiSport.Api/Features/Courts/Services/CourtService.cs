using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MultiSport.Api.Features.Courts.Models.Dtos;
using MultiSport.Api.Features.Courts.Models.Entities;
using MultiSport.Api.Features.Courts.Repositories;

namespace MultiSport.Api.Features.Courts.Services;

public sealed class CourtService : ICourtService
{
    private readonly ICourtRepository _courtRepository;
    private readonly ILogger<CourtService> _logger;

    public CourtService(
        ICourtRepository courtRepository,
        ILogger<CourtService> logger)
    {
        _courtRepository = courtRepository ?? throw new ArgumentNullException(nameof(courtRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Results<Created<CourtResponse>, ValidationProblem, Conflict<ProblemDetails>, UnauthorizedHttpResult>> CreateCourtAsync(
        Guid complexId,
        Guid userId,
        CreateCourtRequest request,
        CancellationToken ct)
    {
        if (complexId == Guid.Empty)
        {
            _logger.LogWarning("Intento no autorizado de creacion de cancha sin identificador de complejo.");
            return TypedResults.Unauthorized();
        }

        var normalizedName = request.Name.Trim();

        if (await _courtRepository.CourtNameExistsInComplexAsync(complexId, normalizedName, ct))
        {
            _logger.LogWarning("Conflicto al crear cancha: nombre '{CourtName}' ya registrado en el complejo {ComplexId}", normalizedName, complexId);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Nombre de cancha duplicado",
                Detail = $"Ya existe una cancha activa con el nombre '{normalizedName}' en tu complejo.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var existingSportIds = await _courtRepository.GetExistingActiveSportIdsAsync(request.SportIds, ct);
        if (existingSportIds.Count != request.SportIds.Distinct().Count())
        {
            _logger.LogWarning("Validacion fallida: se intentaron vincular deportes inexistentes o inactivos.");
            var errorDict = new Dictionary<string, string[]>
            {
                ["sportIds"] = ["Uno o más deportes seleccionados no se encuentran disponibles o activos."]
            };
            return TypedResults.ValidationProblem(errorDict);
        }

        var courtId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var court = new Court
        {
            Id = courtId,
            ComplexId = complexId,
            Name = normalizedName,
            SurfaceType = request.SurfaceType.Trim(),
            IsCovered = request.IsCovered,
            HasLighting = request.HasLighting,
            IsActive = true,
            CreatedAt = now,
            CreatedBy = userId,
            UpdatedAt = now,
            UpdatedBy = userId
        };

        var customConfigsMap = request.CustomSportPrices?.ToDictionary(c => c.SportId) 
                               ?? new Dictionary<Guid, CourtSportConfigDto>();

        var courtSports = request.SportIds.Select(sportId =>
        {
            customConfigsMap.TryGetValue(sportId, out var custom);
            var basePrice = custom?.BasePrice ?? request.BasePrice;
            var durationMinutes = custom?.DurationMinutes ?? request.DurationMinutes;

            return new CourtSport
            {
                Id = Guid.NewGuid(),
                CourtId = courtId,
                SportId = sportId,
                DurationMinutes = durationMinutes,
                BasePrice = basePrice,
                CreatedAt = now,
                UpdatedAt = now
            };
        }).ToList();

        var pricingRules = GeneratePricingRules(courtSports, request.PricingTiers, now);

        if (HasOverlappingRules(pricingRules, out var conflictDetail))
        {
            _logger.LogWarning("Validacion fallida: superposicion de reglas de horarios. {Detail}", conflictDetail);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Superposición horaria de reglas",
                Detail = conflictDetail,
                Status = StatusCodes.Status409Conflict
            });
        }

        await _courtRepository.CreateCourtWithSportsAndPricingRulesAsync(court, courtSports, pricingRules, ct);

        _logger.LogInformation("Cancha '{CourtName}' ({CourtId}) creada exitosamente para el complejo {ComplexId} con {SportsCount} deportes y {RulesCount} reglas de precio.",
            court.Name, court.Id, complexId, courtSports.Count, pricingRules.Count);

        var allActiveSports = await _courtRepository.GetActiveSportsAsync(ct);
        var sportsMap = allActiveSports.ToDictionary(s => s.Id);

        var sportsResponseList = BuildCourtSportsResponse(courtSports, pricingRules, sportsMap);

        var courtResponse = new CourtResponse(
            Id: court.Id,
            ComplexId: court.ComplexId,
            Name: court.Name,
            SurfaceType: court.SurfaceType,
            IsCovered: court.IsCovered,
            HasLighting: court.HasLighting,
            BasePrice: request.BasePrice,
            DurationMinutes: request.DurationMinutes,
            IsActive: court.IsActive,
            Sports: sportsResponseList,
            CreatedAt: court.CreatedAt
        );

        return TypedResults.Created($"/api/v1/courts/{court.Id}", courtResponse);
    }

    public async Task<Results<Ok<CourtResponse>, NotFound, UnauthorizedHttpResult>> GetCourtByIdAsync(
        Guid courtId,
        Guid complexId,
        CancellationToken ct)
    {
        if (complexId == Guid.Empty)
        {
            return TypedResults.Unauthorized();
        }

        var court = await _courtRepository.GetCourtByIdAsync(courtId, complexId, ct);
        if (court is null)
        {
            return TypedResults.NotFound();
        }

        var allSports = await _courtRepository.GetActiveSportsAsync(ct);
        var sportsMap = allSports.ToDictionary(s => s.Id);

        var courtSports = await _courtRepository.GetCourtSportsByCourtIdAsync(court.Id, ct);
        var courtSportIds = courtSports.Select(cs => cs.Id).ToList();
        var pricingRules = await _courtRepository.GetPricingRulesByCourtSportIdsAsync(courtSportIds, ct);

        var firstSport = courtSports.FirstOrDefault();
        var sportsResponseList = BuildCourtSportsResponse(courtSports, pricingRules, sportsMap);

        var response = new CourtResponse(
            Id: court.Id,
            ComplexId: court.ComplexId,
            Name: court.Name,
            SurfaceType: court.SurfaceType,
            IsCovered: court.IsCovered,
            HasLighting: court.HasLighting,
            BasePrice: firstSport?.BasePrice ?? 0,
            DurationMinutes: firstSport?.DurationMinutes ?? 60,
            IsActive: court.IsActive,
            Sports: sportsResponseList,
            CreatedAt: court.CreatedAt
        );

        return TypedResults.Ok(response);
    }

    public async Task<Results<Ok<CourtResponse>, NotFound, ValidationProblem, Conflict<ProblemDetails>, UnauthorizedHttpResult>> UpdateCourtAsync(
        Guid courtId,
        Guid complexId,
        Guid userId,
        UpdateCourtRequest request,
        CancellationToken ct)
    {
        if (complexId == Guid.Empty)
        {
            return TypedResults.Unauthorized();
        }

        var existingCourt = await _courtRepository.GetCourtByIdAsync(courtId, complexId, ct);
        if (existingCourt is null)
        {
            return TypedResults.NotFound();
        }

        var normalizedName = request.Name.Trim();

        // Validar unicidad de nombre excluyendo la cancha actual
        if (await _courtRepository.CourtNameExistsInComplexExcludingCourtAsync(complexId, normalizedName, courtId, ct))
        {
            _logger.LogWarning("Conflicto al actualizar cancha: nombre '{CourtName}' ya en uso en el complejo {ComplexId}", normalizedName, complexId);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Nombre de cancha duplicado",
                Detail = $"Ya existe otra cancha activa con el nombre '{normalizedName}' en tu complejo.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var existingSportIds = await _courtRepository.GetExistingActiveSportIdsAsync(request.SportIds, ct);
        if (existingSportIds.Count != request.SportIds.Distinct().Count())
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["sportIds"] = ["Uno o más deportes seleccionados no se encuentran disponibles o activos."]
            });
        }

        var currentCourtSports = await _courtRepository.GetCourtSportsByCourtIdAsync(courtId, ct);
        var allActiveSports = await _courtRepository.GetActiveSportsAsync(ct);
        var sportsMap = allActiveSports.ToDictionary(s => s.Id);

        // 1. Validar que no se desvinculen disciplinas con turnos futuros agendados
        var removedSports = currentCourtSports.Where(cs => !request.SportIds.Contains(cs.SportId)).ToList();
        foreach (var removed in removedSports)
        {
            var futureBookingsForSport = await _courtRepository.GetActiveFutureBookingsCountForSportAsync(courtId, removed.SportId, ct);
            if (futureBookingsForSport > 0)
            {
                var sportName = sportsMap.TryGetValue(removed.SportId, out var s) ? s.Name : "Deporte";
                _logger.LogWarning("Intento de quitar deporte {SportName} con {Count} reservas futuras en cancha {CourtId}", sportName, futureBookingsForSport, courtId);
                return TypedResults.Conflict(new ProblemDetails
                {
                    Title = "Disciplina con turnos futuros",
                    Detail = $"No es posible desvincular el deporte '{sportName}' porque tiene {futureBookingsForSport} turno(s) futuro(s) agendado(s) en esta cancha. Debe reubicar o cancelar dichos turnos antes de retirar la disciplina.",
                    Status = StatusCodes.Status409Conflict
                });
            }
        }

        var now = DateTimeOffset.UtcNow;

        var updatedCourt = new Court
        {
            Id = courtId,
            ComplexId = complexId,
            Name = normalizedName,
            SurfaceType = request.SurfaceType.Trim(),
            IsCovered = request.IsCovered,
            HasLighting = request.HasLighting,
            IsActive = existingCourt.IsActive,
            CreatedAt = existingCourt.CreatedAt,
            CreatedBy = existingCourt.CreatedBy,
            UpdatedAt = now,
            UpdatedBy = userId
        };

        var customConfigsMap = request.CustomSportPrices?.ToDictionary(c => c.SportId) 
                               ?? new Dictionary<Guid, CourtSportConfigDto>();

        var updatedCourtSports = request.SportIds.Select(sportId =>
        {
            var existingCs = currentCourtSports.FirstOrDefault(cs => cs.SportId == sportId);
            customConfigsMap.TryGetValue(sportId, out var custom);
            var basePrice = custom?.BasePrice ?? request.BasePrice;
            var durationMinutes = custom?.DurationMinutes ?? request.DurationMinutes;

            return new CourtSport
            {
                Id = existingCs?.Id ?? Guid.NewGuid(),
                CourtId = courtId,
                SportId = sportId,
                DurationMinutes = durationMinutes,
                BasePrice = basePrice,
                CreatedAt = existingCs?.CreatedAt ?? now,
                UpdatedAt = now
            };
        }).ToList();

        var newPricingRules = GeneratePricingRules(updatedCourtSports, request.PricingTiers, now);

        if (HasOverlappingRules(newPricingRules, out var conflictDetail))
        {
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Superposición horaria de reglas",
                Detail = conflictDetail,
                Status = StatusCodes.Status409Conflict
            });
        }

        // 2. Validar que no queden turnos futuros desamparados fuera del nuevo horario comercial (Decisión 1: Alternativa A)
        var futureBookings = await _courtRepository.GetActiveFutureBookingsAsync(courtId, ct);
        if (HasUncoveredFutureBookings(futureBookings, updatedCourtSports, newPricingRules, out var uncoveredCount))
        {
            _logger.LogWarning("Conflicto al modificar horarios: {Count} turnos futuros quedan fuera de la nueva disponibilidad", uncoveredCount);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Turnos futuros fuera del nuevo horario",
                Detail = $"No es posible modificar el horario operativo porque existen {uncoveredCount} turno(s) futuro(s) agendado(s) que quedan fuera de la nueva disponibilidad configurada. Debe reubicar o cancelar los turnos afectados antes de recortar el horario.",
                Status = StatusCodes.Status409Conflict
            });
        }

        await _courtRepository.UpdateCourtWithSportsAndPricingRulesAsync(updatedCourt, updatedCourtSports, newPricingRules, ct);

        _logger.LogInformation("Cancha '{CourtName}' ({CourtId}) modificada exitosamente en el complejo {ComplexId}.",
            updatedCourt.Name, courtId, complexId);

        var sportsResponseList = BuildCourtSportsResponse(updatedCourtSports, newPricingRules, sportsMap);

        var courtResponse = new CourtResponse(
            Id: updatedCourt.Id,
            ComplexId: updatedCourt.ComplexId,
            Name: updatedCourt.Name,
            SurfaceType: updatedCourt.SurfaceType,
            IsCovered: updatedCourt.IsCovered,
            HasLighting: updatedCourt.HasLighting,
            BasePrice: request.BasePrice,
            DurationMinutes: request.DurationMinutes,
            IsActive: updatedCourt.IsActive,
            Sports: sportsResponseList,
            CreatedAt: updatedCourt.CreatedAt
        );

        return TypedResults.Ok(courtResponse);
    }

    public async Task<Results<NoContent, NotFound, Conflict<ProblemDetails>, UnauthorizedHttpResult>> DeleteCourtAsync(
        Guid courtId,
        Guid complexId,
        Guid userId,
        CancellationToken ct)
    {
        if (complexId == Guid.Empty)
        {
            return TypedResults.Unauthorized();
        }

        var existingCourt = await _courtRepository.GetCourtByIdAsync(courtId, complexId, ct);
        if (existingCourt is null)
        {
            return TypedResults.NotFound();
        }

        var futureBookingsCount = await _courtRepository.GetActiveFutureBookingsCountAsync(courtId, ct);
        if (futureBookingsCount > 0)
        {
            _logger.LogWarning("Intento de eliminar cancha {CourtId} con {Count} reservas futuras activas", courtId, futureBookingsCount);
            return TypedResults.Conflict(new ProblemDetails
            {
                Title = "Cancha con turnos futuros activos",
                Detail = $"No es posible dar de baja la cancha '{existingCourt.Name}' porque posee {futureBookingsCount} turno(s) futuro(s) agendado(s). Debe cancelar o reubicar las reservas antes de proceder a la baja.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var now = DateTimeOffset.UtcNow;
        await _courtRepository.SoftDeleteCourtAsync(courtId, complexId, userId, now, ct);

        _logger.LogInformation("Cancha '{CourtName}' ({CourtId}) eliminada lógicamente (soft delete) en el complejo {ComplexId}.",
            existingCourt.Name, courtId, complexId);

        return TypedResults.NoContent();
    }

    public async Task<IReadOnlyList<SportResponse>> GetAvailableSportsAsync(CancellationToken ct)
    {
        var sports = await _courtRepository.GetActiveSportsAsync(ct);
        return sports.Select(s => new SportResponse(
            Id: s.Id,
            Name: s.Name,
            IconUrl: s.IconUrl,
            MaxPlayers: s.MaxPlayers
        )).ToList();
    }

    public async Task<IReadOnlyList<CourtResponse>> GetCourtsAsync(Guid complexId, CancellationToken ct)
    {
        var courts = await _courtRepository.GetCourtsByComplexIdAsync(complexId, ct);
        if (courts.Count == 0)
        {
            return Array.Empty<CourtResponse>();
        }

        var allSports = await _courtRepository.GetActiveSportsAsync(ct);
        var sportsMap = allSports.ToDictionary(s => s.Id);

        var responses = new List<CourtResponse>();

        foreach (var court in courts)
        {
            var courtSports = await _courtRepository.GetCourtSportsByCourtIdAsync(court.Id, ct);
            var courtSportIds = courtSports.Select(cs => cs.Id).ToList();
            var pricingRules = await _courtRepository.GetPricingRulesByCourtSportIdsAsync(courtSportIds, ct);

            var firstSport = courtSports.FirstOrDefault();
            var sportsResponseList = BuildCourtSportsResponse(courtSports, pricingRules, sportsMap);

            responses.Add(new CourtResponse(
                Id: court.Id,
                ComplexId: court.ComplexId,
                Name: court.Name,
                SurfaceType: court.SurfaceType,
                IsCovered: court.IsCovered,
                HasLighting: court.HasLighting,
                BasePrice: firstSport?.BasePrice ?? 0,
                DurationMinutes: firstSport?.DurationMinutes ?? 60,
                IsActive: court.IsActive,
                Sports: sportsResponseList,
                CreatedAt: court.CreatedAt
            ));
        }

        return responses;
    }

    private static List<CourtSportResponse> BuildCourtSportsResponse(
        IReadOnlyList<CourtSport> courtSports,
        IReadOnlyList<CourtPricingRule> pricingRules,
        IReadOnlyDictionary<Guid, Sport> sportsMap)
    {
        return courtSports.Select(cs =>
        {
            var sportMeta = sportsMap.TryGetValue(cs.SportId, out var s) ? s : null;
            var sportRules = pricingRules
                .Where(r => r.CourtSportId == cs.Id)
                .OrderBy(r => r.DayOfWeek)
                .ThenBy(r => r.StartTime)
                .Select(r => new CourtPricingRuleResponse(
                    Id: r.Id,
                    CourtSportId: r.CourtSportId,
                    DayOfWeek: r.DayOfWeek,
                    StartTime: r.StartTime,
                    EndTime: r.EndTime,
                    Price: r.Price,
                    DurationMinutes: r.DurationMinutes
                )).ToList();

            return new CourtSportResponse(
                CourtSportId: cs.Id,
                SportId: cs.SportId,
                SportName: sportMeta?.Name ?? "Deporte",
                IconUrl: sportMeta?.IconUrl,
                BasePrice: cs.BasePrice,
                DurationMinutes: cs.DurationMinutes,
                PricingRules: sportRules
            );
        }).ToList();
    }

    private static List<CourtPricingRule> GeneratePricingRules(
        IEnumerable<CourtSport> courtSports,
        IReadOnlyList<CourtPricingTierDto> pricingTiers,
        DateTimeOffset now)
    {
        var rules = new List<CourtPricingRule>();
        var courtSportsList = courtSports.ToList();

        var generalTiers = pricingTiers.Where(t => !t.SportId.HasValue).ToList();
        var specificTiers = pricingTiers.Where(t => t.SportId.HasValue).ToList();

        foreach (var courtSport in courtSportsList)
        {
            var sportSpecific = specificTiers.Where(t => t.SportId == courtSport.SportId).ToList();
            var effectiveTiers = sportSpecific.Count > 0 ? sportSpecific : generalTiers;

            foreach (var tier in effectiveTiers)
            {
                // Si la franja es general (sin deporte específico) y el deporte tiene tarifa base propia configurada,
                // respetamos el precio de la disciplina en lugar de aplanarlo al base general de la cancha.
                var effectivePrice = tier.SportId.HasValue 
                    ? tier.Price 
                    : (courtSport.BasePrice > 0 ? courtSport.BasePrice : tier.Price);
                var effectiveDuration = tier.DurationMinutes ?? courtSport.DurationMinutes;

                var start = tier.StartTime;
                var end = tier.EndTime;
                var startMins = start.Hour * 60 + start.Minute;
                var endMins = end == TimeOnly.MinValue ? 1440 : (end.Hour * 60 + end.Minute);

                if (endMins > startMins)
                {
                    rules.Add(new CourtPricingRule
                    {
                        Id = Guid.NewGuid(),
                        CourtSportId = courtSport.Id,
                        DayOfWeek = tier.DayOfWeek,
                        StartTime = start,
                        EndTime = end,
                        Price = effectivePrice,
                        DurationMinutes = effectiveDuration,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }
                else
                {
                    // Cruza medianoche: representar inequívocamente mediante dos reglas contiguas
                    // Regla 1 (Día de inicio): desde start hasta medianoche (00:00)
                    rules.Add(new CourtPricingRule
                    {
                        Id = Guid.NewGuid(),
                        CourtSportId = courtSport.Id,
                        DayOfWeek = tier.DayOfWeek,
                        StartTime = start,
                        EndTime = new TimeOnly(0, 0),
                        Price = effectivePrice,
                        DurationMinutes = effectiveDuration,
                        CreatedAt = now,
                        UpdatedAt = now
                    });

                    // Regla 2 (Día siguiente): desde medianoche (00:00) hasta end
                    var nextDayOfWeek = (tier.DayOfWeek + 1) % 7;
                    rules.Add(new CourtPricingRule
                    {
                        Id = Guid.NewGuid(),
                        CourtSportId = courtSport.Id,
                        DayOfWeek = nextDayOfWeek,
                        StartTime = new TimeOnly(0, 0),
                        EndTime = end,
                        Price = effectivePrice,
                        DurationMinutes = effectiveDuration,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }
            }
        }

        return rules;
    }

    private static bool HasOverlappingRules(IEnumerable<CourtPricingRule> rules, out string conflictDescription)
    {
        conflictDescription = string.Empty;
        var grouped = rules.GroupBy(r => (r.CourtSportId, r.DayOfWeek));

        foreach (var group in grouped)
        {
            var list = group.OrderBy(r => r.StartTime).ToList();
            for (var i = 0; i < list.Count; i++)
            {
                var r1 = list[i];
                var r1Start = r1.StartTime.Hour * 60 + r1.StartTime.Minute;
                var r1End = r1.EndTime == TimeOnly.MinValue ? 1440 : (r1.EndTime.Hour * 60 + r1.EndTime.Minute);

                for (var j = i + 1; j < list.Count; j++)
                {
                    var r2 = list[j];
                    var r2Start = r2.StartTime.Hour * 60 + r2.StartTime.Minute;
                    var r2End = r2.EndTime == TimeOnly.MinValue ? 1440 : (r2.EndTime.Hour * 60 + r2.EndTime.Minute);

                    if (Math.Max(r1Start, r2Start) < Math.Min(r1End, r2End))
                    {
                        var dayName = GetDayOfWeekName(group.Key.DayOfWeek);
                        conflictDescription = $"Existe una superposición horaria en las reglas configuradas para el día {dayName}.";
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static bool HasUncoveredFutureBookings(
        IReadOnlyList<CourtFutureBooking> futureBookings,
        IReadOnlyList<CourtSport> courtSports,
        IReadOnlyList<CourtPricingRule> pricingRules,
        out int uncoveredCount)
    {
        uncoveredCount = 0;
        var courtSportBySportId = courtSports.ToDictionary(cs => cs.SportId, cs => cs.Id);

        foreach (var booking in futureBookings)
        {
            if (!courtSportBySportId.TryGetValue(booking.SportId, out var courtSportId))
            {
                uncoveredCount++;
                continue;
            }

            var dayOfWeek = (int)booking.StartTimeUtc.DayOfWeek;
            var bookingStart = TimeOnly.FromTimeSpan(booking.StartTimeUtc.TimeOfDay);
            var bookingEnd = TimeOnly.FromTimeSpan(booking.EndTimeUtc.TimeOfDay);

            var covers = pricingRules.Any(r =>
                r.CourtSportId == courtSportId &&
                r.DayOfWeek == dayOfWeek &&
                r.StartTime <= bookingStart &&
                (r.EndTime == TimeOnly.MinValue || r.EndTime >= bookingEnd));

            if (!covers)
            {
                uncoveredCount++;
            }
        }

        return uncoveredCount > 0;
    }

    private static string GetDayOfWeekName(int dayOfWeek) => dayOfWeek switch
    {
        0 => "Domingo",
        1 => "Lunes",
        2 => "Martes",
        3 => "Miércoles",
        4 => "Jueves",
        5 => "Viernes",
        6 => "Sábado",
        _ => "Día desconocido"
    };
}
