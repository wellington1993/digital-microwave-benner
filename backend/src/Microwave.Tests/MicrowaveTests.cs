using Microwave.Domain.Entities;
using Microwave.Domain.Exceptions;
using Xunit;

namespace Microwave.Tests;

public sealed class MicrowaveTests
{
    private readonly MicrowaveOven _oven = new();

    [Fact]
    public void Start_ShouldTransitionToHeating_WhenIdle()
    {
        _oven.Start(30, 10);
        Assert.Equal("Heating", _oven.CurrentState);
    }

    [Fact]
    public void TimeDisplay_ShouldShowRemainingTime_WhenHeating()
    {
        _oven.Start(30, 10);
        Assert.Equal("0:30", _oven.TimeDisplay);
    }

    [Fact]
    public void PauseOrCancel_ShouldPause_WhenHeating()
    {
        _oven.Start(60, 10);
        _oven.PauseOrCancel();
        Assert.Equal("Paused", _oven.CurrentState);
    }

    [Fact]
    public void PauseOrCancel_ShouldCancel_WhenPaused()
    {
        _oven.Start(30, 10);
        _oven.PauseOrCancel();
        _oven.PauseOrCancel();
        Assert.Equal("Idle", _oven.CurrentState);
        Assert.Equal(0, _oven.TotalDurationSeconds);
    }

    [Fact]
    public void Output_ShouldBeEmpty_AtStart()
    {
        _oven.Start(60, 3, '*');
        Assert.Equal(string.Empty, _oven.Output);
    }

    [Fact]
    public void QuickStart_ShouldAdd30Seconds_WhenHeating()
    {
        _oven.Start(30, 10);
        _oven.QuickStart();
        Assert.Equal(60, _oven.TotalDurationSeconds);
    }

    [Fact]
    public void Start_ShouldThrow_WhenDurationInvalid()
    {
        Assert.Throws<BusinessRuleException>(() => _oven.Start(0, 10));
        Assert.Throws<BusinessRuleException>(() => _oven.Start(121, 10));
    }

    [Fact]
    public void QuickStart_ShouldThrow_WhenPredefined()
    {
        _oven.Start(60, 7, '*', isPredefined: true);
        Assert.Throws<BusinessRuleException>(() => _oven.QuickStart());
    }

    [Fact]
    public void PausedState_ShouldResumeHeating_WhenStartCalled()
    {
        _oven.Start(60, 10);
        _oven.PauseOrCancel();
        Assert.Equal("Paused", _oven.CurrentState);
        
        _oven.Start(0, 10); 
        Assert.Equal("Heating", _oven.CurrentState);
    }
}
