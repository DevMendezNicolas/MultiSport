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

        // Regla: No duplicar nombres de canchas activas dentro del mismo complejo
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

        // Verificacion de que los deportes seleccionados existan y esten activos
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
            BufferMinutes = request.BufferMinutes,
            IsActive = true,
            CreatedAt = now,
            CreatedBy = userId,
            UpdatedAt = now,
            UpdatedBy = userId
        };

        // Construir mapa de configuraciones personalizadas de deportes (si fueron provistas)
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

        // Generar reglas de disponibilidad y precios respetando turnos que atraviesan medianoche
        var pricingRules = GeneratePricingRules(courtSports, request.Schedules, now);

        // Validar que no se produzcan solapamientos temporales para un mismo deporte y día
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

        // Persistir atomicamente Cancha, Deportes y Reglas de Precios
        await _courtRepository.CreateCourtWithSportsAndPricingRulesAsync(court, courtSports, pricingRules, ct);

        _logger.LogInformation("Cancha '{CourtName}' ({CourtId}) creada exitosamente para el complejo {ComplexId} con {SportsCount} deportes y {RulesCount} reglas de precio.",
            court.Name, court.Id, complexId, courtSports.Count, pricingRules.Count);

        // Obtener catalogo de deportes para complementar metadata en la respuesta
        var allActiveSports = await _courtRepository.GetActiveSportsAsync(ct);
        var sportsMap = allActiveSports.ToDictionary(s => s.Id);

        var sportsResponseList = courtSports.Select(cs =>
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

        var courtResponse = new CourtResponse(
            Id: court.Id,
            ComplexId: court.ComplexId,
            Name: court.Name,
            SurfaceType: court.SurfaceType,
            IsCovered: court.IsCovered,
            HasLighting: court.HasLighting,
            BufferMinutes: court.BufferMinutes,
            BasePrice: request.BasePrice,
            DurationMinutes: request.DurationMinutes,
            IsActive: court.IsActive,
            Sports: sportsResponseList,
            CreatedAt: court.CreatedAt
        );

        return TypedResults.Created($"/api/v1/courts/{court.Id}", courtResponse);
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

            var sportsResponseList = courtSports.Select(cs =>
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

            responses.Add(new CourtResponse(
                Id: court.Id,
                ComplexId: court.ComplexId,
                Name: court.Name,
                SurfaceType: court.SurfaceType,
                IsCovered: court.IsCovered,
                HasLighting: court.HasLighting,
                BufferMinutes: court.BufferMinutes,
                BasePrice: firstSport?.BasePrice ?? 0,
                DurationMinutes: firstSport?.DurationMinutes ?? 60,
                IsActive: court.IsActive,
                Sports: sportsResponseList,
                CreatedAt: court.CreatedAt
            ));
        }

        return responses;
    }

    private static List<CourtPricingRule> GeneratePricingRules(
        IEnumerable<CourtSport> courtSports,
        IReadOnlyList<CourtDayScheduleDto> schedules,
        DateTimeOffset now)
    {
        var rules = new List<CourtPricingRule>();

        foreach (var courtSport in courtSports)
        {
            foreach (var schedule in schedules)
            {
                var effectivePrice = schedule.PriceOverride ?? courtSport.BasePrice;
                var effectiveDuration = schedule.DurationMinutesOverride ?? courtSport.DurationMinutes;

                var firstStartMins = schedule.FirstShiftStart.Hour * 60 + schedule.FirstShiftStart.Minute;
                var lastStartMins = schedule.LastShiftStart.Hour * 60 + schedule.LastShiftStart.Minute;

                if (lastStartMins < firstStartMins)
                {
                    // Turno que inicia al día siguiente dentro del mismo ciclo continuo
                    lastStartMins += 1440;
                }

                var endMins = lastStartMins + effectiveDuration;

                if (endMins <= 1440)
                {
                    // Rango contenido íntegramente dentro de la misma jornada calendario
                    var endTime = endMins == 1440 
                        ? new TimeOnly(0, 0) 
                        : new TimeOnly(endMins / 60, endMins % 60);

                    rules.Add(new CourtPricingRule
                    {
                        Id = Guid.NewGuid(),
                        CourtSportId = courtSport.Id,
                        DayOfWeek = schedule.DayOfWeek,
                        StartTime = schedule.FirstShiftStart,
                        EndTime = endTime,
                        Price = effectivePrice,
                        DurationMinutes = effectiveDuration,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }
                else
                {
                    // Cruza medianoche: representar inequívocamente mediante dos reglas contiguas
                    // Regla 1 (Día de inicio): desde FirstShiftStart hasta medianoche (00:00)
                    rules.Add(new CourtPricingRule
                    {
                        Id = Guid.NewGuid(),
                        CourtSportId = courtSport.Id,
                        DayOfWeek = schedule.DayOfWeek,
                        StartTime = schedule.FirstShiftStart,
                        EndTime = new TimeOnly(0, 0),
                        Price = effectivePrice,
                        DurationMinutes = effectiveDuration,
                        CreatedAt = now,
                        UpdatedAt = now
                    });

                    // Regla 2 (Día siguiente): desde medianoche (00:00) hasta fin del turno
                    var nextDayOfWeek = (schedule.DayOfWeek + 1) % 7;
                    var remainingMins = endMins - 1440;
                    var nextDayEndTime = remainingMins >= 1440 
                        ? new TimeOnly(0, 0) 
                        : new TimeOnly(remainingMins / 60, remainingMins % 60);

                    rules.Add(new CourtPricingRule
                    {
                        Id = Guid.NewGuid(),
                        CourtSportId = courtSport.Id,
                        DayOfWeek = nextDayOfWeek,
                        StartTime = new TimeOnly(0, 0),
                        EndTime = nextDayEndTime,
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
