using Microwave.Domain.ValueObjects;

namespace Microwave.Application.Services;

public interface IProgramRepository
{
    Task<IReadOnlyList<HeatingProgram>> GetCustomProgramsAsync();
    Task AddAsync(HeatingProgram program);
    Task RemoveAsync(string name);
}
