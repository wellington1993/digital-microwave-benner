using Microwave.Application.DTOs;
using Microwave.Domain.Exceptions;
using Microwave.Domain.Statics;
using Microwave.Domain.ValueObjects;

namespace Microwave.Application.Services;

public sealed class ProgramService
{
    private readonly IProgramRepository _repository;

    public ProgramService(IProgramRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<HeatingProgramResponse>> GetAllAsync()
    {
        var predefined = PredefinedPrograms.All.Select(ToResponse);
        var custom = (await _repository.GetCustomProgramsAsync()).Select(ToResponse);
        return predefined.Concat(custom);
    }

    public async Task<HeatingProgram> GetByNameAsync(string name)
    {
        var custom = await _repository.GetCustomProgramsAsync();
        var all = PredefinedPrograms.All.Concat(custom);

        var program = all.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        if (program is null)
            throw new BusinessRuleException($"Programa '{name}' nao encontrado.");

        return program;
    }

    public async Task<HeatingProgramResponse> CreateAsync(CreateProgramRequest request)
    {
        if (PredefinedPrograms.All.Any(p => p.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
            throw new BusinessRuleException($"Nao e possivel criar um programa com o nome reservado '{request.Name}'.");

        if (request.HeatingChar == '.')
            throw new BusinessRuleException("O caractere padrao '.' nao pode ser usado em programas customizados.");

        var customPrograms = await _repository.GetCustomProgramsAsync();

        if (PredefinedPrograms.All.Any(p => p.HeatingChar == request.HeatingChar) ||
            customPrograms.Any(p => p.HeatingChar == request.HeatingChar))
        {
            throw new BusinessRuleException($"O caractere '{request.HeatingChar}' ja esta em uso.");
        }

        var program = new HeatingProgram
        {
            Name = request.Name,
            Alimento = request.Alimento,
            DurationSeconds = request.DurationSeconds,
            Power = request.Power,
            HeatingChar = request.HeatingChar,
            Instructions = request.Instructions,
            IsPredefined = false
        };

        await _repository.AddAsync(program);
        return ToResponse(program);
    }

    public async Task DeleteAsync(string name)
    {
        if (PredefinedPrograms.All.Any(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
            throw new BusinessRuleException("Programas pre-definidos nao podem ser removidos.");

        await _repository.RemoveAsync(name);
    }

    private static HeatingProgramResponse ToResponse(HeatingProgram p) =>
        new(p.Name, p.Alimento, p.DurationSeconds, p.Power, p.HeatingChar, p.Instructions, p.IsPredefined);
}
