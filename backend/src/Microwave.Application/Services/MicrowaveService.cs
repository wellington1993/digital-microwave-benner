using Microwave.Application.DTOs;
using Microwave.Domain.Entities;
using Microwave.Domain.Statics;
using Microwave.Domain.ValueObjects;

namespace Microwave.Application.Services;

public sealed class MicrowaveService
{
    private readonly MicrowaveOven _oven = new();
    private readonly IProgramRepository _repository;

    public MicrowaveService(IProgramRepository repository)
    {
        _repository = repository;
    }

    public MicrowaveStatusResponse GetStatus() => BuildResponse();

    public MicrowaveStatusResponse Start(StartHeatingRequest request)
    {
        _oven.Start(request.DurationSeconds, request.Power, request.HeatingChar);
        return BuildResponse();
    }

    public MicrowaveStatusResponse StartProgram(HeatingProgram program)
    {
        _oven.Start(program.DurationSeconds, program.Power, program.HeatingChar, isPredefined: true);
        return BuildResponse();
    }

    public MicrowaveStatusResponse QuickStart()
    {
        _oven.QuickStart();
        return BuildResponse();
    }

    public MicrowaveStatusResponse PauseOrCancel()
    {
        _oven.PauseOrCancel();
        return BuildResponse();
    }

    public MicrowaveStatusResponse Cancel()
    {
        _oven.Cancel();
        return BuildResponse();
    }

    public async Task<IReadOnlyList<HeatingProgram>> GetAllProgramsAsync()
    {
        var all = new List<HeatingProgram>(PredefinedPrograms.All);
        all.AddRange(await _repository.GetCustomProgramsAsync());
        return all;
    }

    public async Task AddCustomProgramAsync(HeatingProgram program)
    {
        var all = await GetAllProgramsAsync();
        if (all.Any(p => p.HeatingChar == program.HeatingChar) || program.HeatingChar == '.')
            throw new Domain.Exceptions.BusinessRuleException("Caractere de aquecimento ja em uso ou invalido.");

        await _repository.AddAsync(program);
    }

    private MicrowaveStatusResponse BuildResponse() =>
        new(
            State:                _oven.CurrentState,
            TotalDurationSeconds: _oven.TotalDurationSeconds,
            RemainingSeconds:     _oven.RemainingSeconds,
            ElapsedSeconds:       _oven.ElapsedSeconds,
            Power:                _oven.Power,
            HeatingChar:          _oven.HeatingChar,
            TimeDisplay:          _oven.TimeDisplay,
            Output:               _oven.Output
        );
}
