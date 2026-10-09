using MultiSport.Api.Features.Courts.Models.Entities;

namespace MultiSport.Api.Features.Courts.Repositories;

public interface ICourtRepository
{
    Task<bool> CourtNameExistsInComplexAsync(Guid complexId, string name, CancellationToken ct);
    Task<bool> CourtNameExistsInComplexExcludingCourtAsync(Guid complexId, string name, Guid courtId, CancellationToken ct);
    Task<IReadOnlyList<Sport>> GetActiveSportsAsync(CancellationToken ct);
    Task<IReadOnlyList<Guid>> GetExistingActiveSportIdsAsync(IEnumerable<Guid> sportIds, CancellationToken ct);
    Task<Court> CreateCourtWithSportsAndPricingRulesAsync(
        Court court,
        IEnumerable<CourtSport> courtSports,
        IEnumerable<CourtPricingRule> pricingRules,
        CancellationToken ct);
    Task<Court?> GetCourtByIdAsync(Guid courtId, Guid complexId, CancellationToken ct);
    Task<IReadOnlyList<CourtSport>> GetCourtSportsByCourtIdAsync(Guid courtId, CancellationToken ct);
    Task<IReadOnlyList<CourtPricingRule>> GetPricingRulesByCourtSportIdsAsync(IEnumerable<Guid> courtSportIds, CancellationToken ct);
    Task<IReadOnlyList<Court>> GetCourtsByComplexIdAsync(Guid complexId, CancellationToken ct);

    Task<int> GetActiveFutureBookingsCountAsync(Guid courtId, CancellationToken ct);
    Task<int> GetActiveFutureBookingsCountForSportAsync(Guid courtId, Guid sportId, CancellationToken ct);
    Task<IReadOnlyList<CourtFutureBooking>> GetActiveFutureBookingsAsync(Guid courtId, CancellationToken ct);
    Task<Court> UpdateCourtWithSportsAndPricingRulesAsync(
        Court court,
        IEnumerable<CourtSport> courtSports,
        IEnumerable<CourtPricingRule> pricingRules,
        CancellationToken ct);
    Task<bool> SoftDeleteCourtAsync(Guid courtId, Guid complexId, Guid userId, DateTimeOffset now, CancellationToken ct);
}
