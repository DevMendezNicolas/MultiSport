using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;
using MultiSport.Api.Features.Complexes.Models.Dtos;
using MultiSport.Api.Features.Complexes.Repositories;

namespace MultiSport.Api.Features.Complexes.Services;

public sealed class ComplexService : IComplexService
{
    private readonly IComplexRepository _repository;
    private readonly ILogger<ComplexService> _logger;

    public ComplexService(IComplexRepository repository, ILogger<ComplexService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Results<Ok<ComplexProfileResponse>, NotFound, UnauthorizedHttpResult>> GetProfileAsync(
        Guid complexId,
        CancellationToken ct)
    {
        var profile = await _repository.GetProfileAsync(complexId, ct);
        if (profile is null)
        {
            _logger.LogWarning("Complejo con ID {ComplexId} no encontrado.", complexId);
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(profile);
    }

    public async Task<Results<NoContent, NotFound, UnauthorizedHttpResult>> UpdateProfileAsync(
        Guid complexId,
        UpdateComplexProfileRequest request,
        CancellationToken ct)
    {
        var updated = await _repository.UpdateProfileAsync(complexId, request, ct);
        if (!updated)
        {
            _logger.LogWarning("No se pudo actualizar el perfil del complejo {ComplexId} porque no existe.", complexId);
            return TypedResults.NotFound();
        }

        _logger.LogInformation("Perfil del complejo {ComplexId} actualizado exitosamente.", complexId);
        return TypedResults.NoContent();
    }

    public async Task<Results<NoContent, NotFound, UnauthorizedHttpResult>> UpdateSchedulesAsync(
        Guid complexId,
        UpdateComplexSchedulesRequest request,
        CancellationToken ct)
    {
        var updated = await _repository.UpsertSchedulesAsync(complexId, request.Schedules, ct);
        if (!updated)
        {
            _logger.LogWarning("No se pudieron actualizar los horarios del complejo {ComplexId}.", complexId);
            return TypedResults.NotFound();
        }

        _logger.LogInformation("Horarios de atención actualizados para el complejo {ComplexId}.", complexId);
        return TypedResults.NoContent();
    }
}
