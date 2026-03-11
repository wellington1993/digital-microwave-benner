using System.ComponentModel.DataAnnotations;

namespace Microwave.Application.DTOs;

public record StartHeatingRequest(
    [Range(1, 120, ErrorMessage = "O tempo deve ser entre 1 e 120 segundos.")]
    int DurationSeconds,
    
    [Range(1, 10, ErrorMessage = "A potencia deve ser entre 1 e 10.")]
    int Power = 10,
    
    char HeatingChar = '.'
);

public record StartProgramRequest(
    [Required(ErrorMessage = "O nome do programa e obrigatorio.")]
    string ProgramName
);

public record CreateProgramRequest(
    [Required(ErrorMessage = "O nome e obrigatorio.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 50 caracteres.")]
    string Name,

    [Required(ErrorMessage = "O alimento e obrigatorio.")]
    string Alimento,

    [Range(1, 1200, ErrorMessage = "O tempo deve ser entre 1 e 1200 segundos.")]
    int DurationSeconds,

    [Range(1, 10, ErrorMessage = "A potencia deve ser entre 1 e 10.")]
    int Power,

    [Range(1, char.MaxValue, ErrorMessage = "O caractere de aquecimento e obrigatorio.")]
    char HeatingChar,

    string? Instructions = null
);

public record MicrowaveStatusResponse(
    string State,
    int TotalDurationSeconds,
    int RemainingSeconds,
    int ElapsedSeconds,
    int Power,
    char HeatingChar,
    string TimeDisplay,
    string Output
);

public record HeatingProgramResponse(
    string Name,
    string Alimento,
    int DurationSeconds,
    int Power,
    char HeatingChar,
    string? Instructions,
    bool IsPredefined
);
