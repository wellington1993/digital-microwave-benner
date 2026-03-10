namespace Microwave.Application.DTOs;

public record LoginRequest(string Username, string Password);

public record TokenResponse(string Token, DateTime ExpiresAt);
