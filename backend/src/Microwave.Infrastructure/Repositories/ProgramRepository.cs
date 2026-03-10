using System.Text.Json;
using Microwave.Application.Services;
using Microwave.Domain.Exceptions;
using Microwave.Domain.ValueObjects;

namespace Microwave.Infrastructure.Repositories;

public sealed class ProgramRepository : IProgramRepository
{
    private readonly string _filePath;
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };
    private static readonly SemaphoreSlim _semaphore = new(1, 1);

    public ProgramRepository(string filePath = "data/programs.json")
    {
        _filePath = filePath;
    }

    public async Task<IReadOnlyList<HeatingProgram>> GetCustomProgramsAsync()
    {
        await _semaphore.WaitAsync();
        try
        {
            return await LoadAsync();
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task AddAsync(HeatingProgram program)
    {
        await _semaphore.WaitAsync();
        try
        {
            var programs = (await LoadAsync()).ToList();
            if (programs.Any(p => p.Name.Equals(program.Name, StringComparison.OrdinalIgnoreCase)))
                throw new BusinessRuleException($"Ja existe um programa com o nome '{program.Name}'.");

            programs.Add(program);
            await SaveAsync(programs);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task RemoveAsync(string name)
    {
        var programs = (await LoadAsync()).ToList();
        var program = programs.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? throw new BusinessRuleException($"Programa '{name}' nao encontrado.");

        programs.Remove(program);
        await SaveAsync(programs);
    }

    private async Task<List<HeatingProgram>> LoadAsync()
    {
        if (!File.Exists(_filePath))
            return new List<HeatingProgram>();

        var json = await File.ReadAllTextAsync(_filePath);
        return JsonSerializer.Deserialize<List<HeatingProgram>>(json) ?? new List<HeatingProgram>();
    }

    private async Task SaveAsync(List<HeatingProgram> programs)
    {
        var directory = Path.GetDirectoryName(_filePath);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        var json = JsonSerializer.Serialize(programs, _jsonOptions);
        await File.WriteAllTextAsync(_filePath, json);
    }
}
