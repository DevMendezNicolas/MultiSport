namespace MultiSport.Api.Features.Courts.Models.Dtos;

public sealed record SportResponse(
    Guid Id,
    string Name,
    string? IconUrl,
    int MaxPlayers
);
