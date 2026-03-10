using Microwave.Domain.Exceptions;
using Microwave.Domain.ValueObjects;

namespace Microwave.Domain.Entities;

public sealed class MicrowaveOven
{
    private IMicrowaveState _state = new IdleState();
    private DateTime? _heatingStartedAt;
    private int _accumulatedSeconds;

    public int TotalDurationSeconds { get; private set; }
    public int Power { get; private set; } = 10;
    public char HeatingChar { get; private set; } = '.';
    public bool IsPredefined { get; private set; }

    public string CurrentState => _state switch
    {
        HeatingState => "Heating",
        PausedState  => "Paused",
        _            => "Idle"
    };

    public int ElapsedSeconds
    {
        get
        {
            if (_state is IdleState) return 0;
            if (_state is PausedState) return _accumulatedSeconds;
            
            var running = (int)(DateTime.UtcNow - _heatingStartedAt!.Value).TotalSeconds;
            return Math.Min(_accumulatedSeconds + running, TotalDurationSeconds);
        }
    }

    public int RemainingSeconds => Math.Max(0, TotalDurationSeconds - ElapsedSeconds);

    public string TimeDisplay
    {
        get
        {
            int secondsToShow = (_state is IdleState) ? TotalDurationSeconds : RemainingSeconds;
            int minutes = secondsToShow / 60;
            int seconds = secondsToShow % 60;
            return $"{minutes}:{seconds:D2}";
        }
    }

    public string Output => _state.GetOutput(this);

    public void Start(int duration, int power = 10, char heatingChar = '.', bool isPredefined = false)
    {
        if (_state is not PausedState)
            Validate(duration, power);
            
        _state.Start(this, duration, power, heatingChar, isPredefined);
    }

    public void QuickStart() => _state.QuickStart(this);

    public void PauseOrCancel() => _state.PauseOrCancel(this);

    public void Cancel()
    {
        if (_state is IdleState) return;
        Clear();
        TransitionTo(new IdleState());
    }

    internal void TransitionTo(IMicrowaveState state)
    {
        if (state is HeatingState)
            _heatingStartedAt = DateTime.UtcNow;
        else if (state is PausedState)
        {
            _accumulatedSeconds = ElapsedSeconds;
            _heatingStartedAt = null;
        }
        
        _state = state;
    }

    internal void Setup(int duration, int power, char heatingChar, bool isPredefined)
    {
        TotalDurationSeconds = duration;
        Power = power;
        HeatingChar = heatingChar;
        IsPredefined = isPredefined;
        _accumulatedSeconds = 0;
    }

    internal void AddSeconds(int seconds)
    {
        TotalDurationSeconds += seconds;
    }

    internal void Clear()
    {
        TotalDurationSeconds = 0;
        Power = 10;
        HeatingChar = '.';
        _accumulatedSeconds = 0;
        _heatingStartedAt = null;
    }

    internal void Complete()
    {
        TransitionTo(new IdleState());
    }

    private static void Validate(int duration, int power)
    {
        if (duration < 1 || duration > 120)
            throw new BusinessRuleException("O tempo deve ser entre 1 e 120 segundos.");
        
        if (power < 1 || power > 10)
            throw new BusinessRuleException("A potencia deve ser entre 1 e 10.");
    }
}
