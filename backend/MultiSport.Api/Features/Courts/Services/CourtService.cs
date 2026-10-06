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

        var courtSports = request.SportIds.Select(sportId => new CourtSport
        {
            Id = Guid.NewGuid(),
            CourtId = courtId,
            SportId = sportId,
            DurationMinutes = request.DurationMinutes,
            BasePrice = request.BasePrice,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        await _courtRepository.CreateCourtWithSportsAsync(court, courtSports, ct);

        _logger.LogInformation("Cancha '{CourtName}' ({CourtId}) creada exitosamente para el complejo {ComplexId} con {SportsCount} deportes vinculados.",
            court.Name, court.Id, complexId, courtSports.Count);

        // Obtener catalogo para responder con metadata completa (nombres de deportes e iconos)
        var allActiveSports = await _courtRepository.GetActiveSportsAsync(ct);
        var sportsMap = allActiveSports.ToDictionary(s => s.Id);

        var sportsResponseList = courtSports.Select(cs =>
        {
            var sportMeta = sportsMap.TryGetValue(cs.SportId, out var s) ? s : null;
            return new CourtSportResponse(
                SportId: cs.SportId,
                SportName: sportMeta?.Name ?? "Deporte",
                IconUrl: sportMeta?.IconUrl,
                BasePrice: cs.BasePrice,
                DurationMinutes: cs.DurationMinutes
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
            var firstSport = courtSports.FirstOrDefault();

            var sportsResponseList = courtSports.Select(cs =>
            {
                var sportMeta = sportsMap.TryGetValue(cs.SportId, out var s) ? s : null;
                return new CourtSportResponse(
                    SportId: cs.SportId,
                    SportName: sportMeta?.Name ?? "Deporte",
                    IconUrl: sportMeta?.IconUrl,
                    BasePrice: cs.BasePrice,
                    DurationMinutes: cs.DurationMinutes
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
}
