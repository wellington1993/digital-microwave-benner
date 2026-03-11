export type MicrowaveState = 'Idle' | 'Heating' | 'Paused';

export interface Program {
  name: string;
  durationSeconds: number;
  power: number;
  heatingChar: string;
}

export interface SimState {
  state: MicrowaveState;
  time: number;
  output: string;
  isPredefined: boolean;
  char: string;
  power: number;
}

export const PREDEFINED_PROGRAMS: Program[] = [
  { name: 'Pipoca',        durationSeconds: 180, power: 7, heatingChar: '*' },
  { name: 'Leite',         durationSeconds: 300, power: 5, heatingChar: 'o' },
  { name: 'Carnes de boi', durationSeconds: 840, power: 4, heatingChar: 'b' },
  { name: 'Frango',        durationSeconds: 480, power: 7, heatingChar: 'f' },
  { name: 'Feijão',        durationSeconds: 480, power: 9, heatingChar: 'j' },
];

export const INITIAL_STATE: SimState = {
  state: 'Idle', time: 0, output: '', isPredefined: false, char: '.', power: 10,
};

export function applyQuickStart(s: SimState): SimState {
  if (s.state === 'Heating') {
    if (s.isPredefined) throw new Error('Programas pré-definidos não permitem acréscimo de tempo.');
    return { ...s, time: s.time + 30 };
  }
  if (s.state === 'Paused') return { ...s, state: 'Heating' };
  return { ...INITIAL_STATE, state: 'Heating', time: 30 };
}

export function applyPauseCancel(s: SimState): SimState {
  if (s.state === 'Heating') return { ...s, state: 'Paused' };
  return { ...INITIAL_STATE };
}

export function applyStartProgram(s: SimState, programName: string): SimState {
  if (s.state !== 'Idle') throw new Error('O micro-ondas já está em funcionamento.');
  const p = PREDEFINED_PROGRAMS.find(x => x.name === programName);
  if (!p) throw new Error(`Programa "${programName}" não encontrado.`);
  return {
    state: 'Heating',
    time: p.durationSeconds,
    output: '',
    isPredefined: true,
    char: p.heatingChar,
    power: p.power,
  };
}

export function applyTick(s: SimState): SimState {
  if (s.state !== 'Heating') return s;
  if (s.time <= 1) return { ...INITIAL_STATE };
  return { ...s, time: s.time - 1, output: s.output + s.char.repeat(s.power) };
}

export function fmtTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}