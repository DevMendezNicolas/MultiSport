namespace MultiSport.Api.Features.Auth.Models.Dtos;

public sealed record AuthResponse(
    string AccessToken,
    string TokenType,
    int ExpiresIn,
    UserInfoDto User
);

public sealed record UserInfoDto(
    Guid Id,
    Guid ComplexId,
    string ComplexName,
    string Email,
    string Role
);
