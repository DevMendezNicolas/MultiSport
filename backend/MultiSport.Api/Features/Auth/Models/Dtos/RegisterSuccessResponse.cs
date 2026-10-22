namespace MultiSport.Api.Features.Auth.Models.Dtos;

public sealed record RegisterSuccessResponse(
    string Message,
    string Email
);
