using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microwave.Application.DTOs;
using Microwave.Application.Services;

namespace Microwave.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _config;

    public AuthController(IAuthService authService, IConfiguration config)
    {
        _authService = authService;
        _config = config;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _config.GetSection("Auth:Users").Get<List<UserConfig>>()
            ?.FirstOrDefault(u => u.Username == request.Username);

        if (user is null || !_authService.VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized(new { mensagem = "Credenciais invalidas." });

        var expiresAt = DateTime.UtcNow.AddHours(2);
        var token = GenerateJwt(request.Username, expiresAt);

        return Ok(new TokenResponse(token, expiresAt));
    }

    private string GenerateJwt(string username, DateTime expiresAt)
    {
        var key  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:            _config["Jwt:Issuer"],
            audience:          _config["Jwt:Audience"],
            claims:            claims,
            expires:           expiresAt,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed record UserConfig(string Username, string PasswordHash);