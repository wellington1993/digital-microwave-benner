import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import '@testing-library/jest-dom';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Microwave Frontend - Automated Programs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should start predefined program in ONLINE mode', async () => {
    const { api } = await import('./api');
    (api.post as any).mockResolvedValueOnce({ data: { token: 'fake-token' } });
    (api.get as any).mockResolvedValueOnce({ data: { state: 'Idle', remainingSeconds: 0, output: '' } });
    
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    
    (api.post as any).mockResolvedValueOnce({ data: { state: 'Heating', remainingSeconds: 180, output: '*******' } });
    
    await waitFor(async () => {
      const pipocaBtn = screen.getByText('Pipoca');
      fireEvent.click(pipocaBtn);
    });

    expect(api.post).toHaveBeenCalledWith('/microwave/start-program', { programName: 'Pipoca' });
  });

  it('should start predefined program in SIMULATION mode', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulação/i));

    const leiteBtn = screen.getByText('Leite');
    fireEvent.click(leiteBtn);

    expect(screen.getByText('Aquecendo')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });
});
