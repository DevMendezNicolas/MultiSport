namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record UpdateCourtRequest(
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
