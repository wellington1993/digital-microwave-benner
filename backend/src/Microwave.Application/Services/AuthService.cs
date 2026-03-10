using System.Security.Cryptography;
using System.Text;

namespace Microwave.Application.Services;

public interface IAuthService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
}

public sealed class AuthService : IAuthService
{
    /* 
     * Nota Tecnica: O requisito solicita SHA1 (256 bits). 
     * O padrao SHA1 possui nativamente 160 bits. 
     * Implementamos conforme o algoritmo solicitado pelo nome.
     */
    public string HashPassword(string password)
    {
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = SHA1.HashData(bytes);
        return Convert.ToHexString(hash).ToLower();
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        return HashPassword(password) == hashedPassword;
    }
}
