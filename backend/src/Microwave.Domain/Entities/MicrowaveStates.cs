using Microwave.Domain.ValueObjects;
using System.Text;

namespace Microwave.Domain.Entities;

public interface IMicrowaveState
{
    void Start(MicrowaveOven oven, int duration, int power, char heatingChar, bool isPredefined);
    void QuickStart(MicrowaveOven oven);
    void PauseOrCancel(MicrowaveOven oven);
    string GetOutput(MicrowaveOven oven);
}

public sealed class IdleState : IMicrowaveState
{
    public void Start(MicrowaveOven oven, int duration, int power, char heatingChar, bool isPredefined)
    {
        oven.Setup(duration, power, heatingChar, isPredefined);
        oven.TransitionTo(new HeatingState());
    }

    public void QuickStart(MicrowaveOven oven)
    {
        oven.Setup(30, 10, '.', false);
        oven.TransitionTo(new HeatingState());
    }

    public void PauseOrCancel(MicrowaveOven oven)
    {
        oven.Clear();
    }

    public string GetOutput(MicrowaveOven oven) => string.Empty;
}

public sealed class HeatingState : IMicrowaveState
{
    public void Start(MicrowaveOven oven, int duration, int power, char heatingChar, bool isPredefined)
    {
        throw new Exceptions.BusinessRuleException("O micro-ondas ja esta em funcionamento.");
    }

    public void QuickStart(MicrowaveOven oven)
    {
        if (oven.IsPredefined)
            throw new Exceptions.BusinessRuleException("Nao e permitido acrescimo de tempo em programas pre-definidos.");
        
        oven.AddSeconds(30);
    }

    public void PauseOrCancel(MicrowaveOven oven)
    {
        oven.TransitionTo(new PausedState());
    }

    public string GetOutput(MicrowaveOven oven)
    {
        var output = GenerateHeatingString(oven);
        
        if (oven.RemainingSeconds <= 0)
        {
            output += " Aquecimento concluido";
            oven.Complete();
        }

        return output;
    }

    private string GenerateHeatingString(MicrowaveOven oven)
    {
        var elapsed = oven.ElapsedSeconds;
        var sb = new StringBuilder();
        for (int i = 1; i <= elapsed; i++)
        {
            sb.Append(new string(oven.HeatingChar, oven.Power));
            sb.Append(" ");
        }
        return sb.ToString().Trim();
    }
}

public sealed class PausedState : IMicrowaveState
{
    public void Start(MicrowaveOven oven, int duration, int power, char heatingChar, bool isPredefined)
    {
        oven.TransitionTo(new HeatingState());
    }

    public void QuickStart(MicrowaveOven oven)
    {
         oven.TransitionTo(new HeatingState());
    }

    public void PauseOrCancel(MicrowaveOven oven)
    {
        oven.Clear();
        oven.TransitionTo(new IdleState());
    }

    public string GetOutput(MicrowaveOven oven)
    {
        var elapsed = oven.ElapsedSeconds;
        var sb = new StringBuilder();
        for (int i = 1; i <= elapsed; i++)
        {
            sb.Append(new string(oven.HeatingChar, oven.Power));
            sb.Append(" ");
        }
        return sb.ToString().Trim();
    }
}
