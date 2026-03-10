using Microwave.Domain.ValueObjects;

namespace Microwave.Domain.Statics;

public static class PredefinedPrograms
{
    public static readonly IReadOnlyList<HeatingProgram> All = new List<HeatingProgram>
    {
        new() { Name = "Pipoca", Alimento = "Pipoca (de micro-ondas)", DurationSeconds = 180, Power = 7, HeatingChar = '*', Instructions = "Observar o barulho de estouros do milho, caso houver um intervalo de mais de 10 segundos entre um estouro e outro, interrompa o aquecimento.", IsPredefined = true },
        new() { Name = "Leite", Alimento = "Leite", DurationSeconds = 300, Power = 5, HeatingChar = 'o', Instructions = "Cuidado com aquecimento de líquidos, o choque térmico aliado ao movimento do recipiente pode causar fervura imediata causando risco de queimaduras.", IsPredefined = true },
        new() { Name = "Carnes de boi", Alimento = "Carne em pedaço ou fatias", DurationSeconds = 840, Power = 4, HeatingChar = 'b', Instructions = "Interrompa o processo na metade e vire o conteúdo com a parte de baixo para cima para o descongelamento uniforme.", IsPredefined = true },
        new() { Name = "Frango", Alimento = "Frango (qualquer corte)", DurationSeconds = 480, Power = 7, HeatingChar = 'f', Instructions = "Interrompa o processo na metade e vire o conteúdo com a parte de baixo para cima para o descongelamento uniforme.", IsPredefined = true },
        new() { Name = "Feijão", Alimento = "Feijão congelado", DurationSeconds = 480, Power = 9, HeatingChar = 'j', Instructions = "Deixe o recipiente destampado e em casos de plástico, cuidado ao retirar o recipiente pois o mesmo pode perder resistência em altas temperaturas.", IsPredefined = true }
    };
}
