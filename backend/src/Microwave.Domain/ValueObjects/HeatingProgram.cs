namespace Microwave.Domain.ValueObjects;

public sealed class HeatingProgram
{
    public string Name { get; init; } = string.Empty;
    public string Alimento { get; init; } = string.Empty;
    public int DurationSeconds { get; init; }
    public int Power { get; init; }
    public char HeatingChar { get; init; } = '.';
    public string? Instructions { get; init; }
    public bool IsPredefined { get; init; }
}
