namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record CreateCourtRequest(
    string Name,
    string SurfaceType,
    bool IsCovered,
    bool HasLighting,
    decimal BasePrice,
    int DurationMinutes,
    IReadOnlyList<Guid> SportIds,
    IReadOnlyList<CourtPricingTierDto> PricingTiers,
    IReadOnlyList<CourtSportConfigDto>? CustomSportPrices = null
);
