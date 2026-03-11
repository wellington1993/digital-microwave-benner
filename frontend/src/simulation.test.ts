import { describe, it, expect } from 'vitest';
import { 
  INITIAL_STATE, 
  applyQuickStart, 
  applyPauseCancel, 
  applyStartProgram, 
  applyTick 
} from './simulation';

describe('Microwave Simulation Logic', () => {
  it('should start with 30s on quick start from idle', () => {
    const s = applyQuickStart(INITIAL_STATE);
    expect(s.state).toBe('Heating');
    expect(s.time).toBe(30);
    expect(s.isPredefined).toBe(false);
  });

  it('should add 30s on quick start when heating', () => {
    const s1 = applyQuickStart(INITIAL_STATE);
    const s2 = applyQuickStart(s1);
    expect(s2.time).toBe(60);
  });

  it('should pause when heating and pause-cancel is clicked', () => {
    const s1 = applyQuickStart(INITIAL_STATE);
    const s2 = applyPauseCancel(s1);
    expect(s2.state).toBe('Paused');
  });

  it('should cancel when paused and pause-cancel is clicked', () => {
    const s1 = applyQuickStart(INITIAL_STATE);
    const s2 = applyPauseCancel(s1);
    const s3 = applyPauseCancel(s2);
    expect(s3.state).toBe('Idle');
    expect(s3.time).toBe(0);
  });

  it('should resume heating when paused and quick start is clicked', () => {
    const s1 = applyQuickStart(INITIAL_STATE);
    const s2 = applyPauseCancel(s1);
    const s3 = applyQuickStart(s2);
    expect(s3.state).toBe('Heating');
  });

  it('should throw error when adding time to predefined program', () => {
    const s1 = applyStartProgram(INITIAL_STATE, 'Pipoca');
    expect(() => applyQuickStart(s1)).toThrow('Programas pré-definidos não permitem acréscimo de tempo.');
  });

  it('should load predefined program correctly', () => {
    const s = applyStartProgram(INITIAL_STATE, 'Frango');
    expect(s.state).toBe('Heating');
    expect(s.time).toBe(480);
    expect(s.char).toBe('f');
    expect(s.power).toBe(7);
  });

  it('should generate output dots on tick', () => {
    const s1 = applyQuickStart(INITIAL_STATE); // 10 power, '.' char
    const s2 = applyTick(s1);
    expect(s2.time).toBe(29);
    expect(s2.output).toBe('..........');
  });

  it('should complete and clear on last tick', () => {
    const s1 = { ...INITIAL_STATE, state: 'Heating' as const, time: 1 };
    const s2 = applyTick(s1);
    expect(s2.state).toBe('Idle');
    expect(s2.time).toBe(0);
  });
});
