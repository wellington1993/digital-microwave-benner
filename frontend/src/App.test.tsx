import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api } from './api';
import '@testing-library/jest-dom';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Microwave Application - Resilience Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should work correctly in ONLINE mode', async () => {
    (api.post as any).mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } });
    (api.get as any).mockResolvedValueOnce({ data: { state: 'Idle', remainingSeconds: 0, output: '' } });
    
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    
    await waitFor(() => {
      expect(screen.getByText(/PRONTO/i)).toBeInTheDocument();
    });

    (api.post as any).mockResolvedValueOnce({ data: { state: 'Heating', remainingSeconds: 30, output: '..........' } });
    fireEvent.click(screen.getByText('START'));

    await waitFor(() => {
      expect(screen.getByText('Heating')).toBeInTheDocument();
    });
  });

  it('should switch to SIMULATION mode when backend fails', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Network Error'));
    
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    fireEvent.click(screen.getByText(/Pular para modo Simulaçao/i));

    expect(screen.getByText(/BACKEND OFFLINE/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('START'));
    
    await waitFor(() => {
      expect(screen.getByText('Heating')).toBeInTheDocument();
    });
  });

  it('should clear visor when PAUSE/CANCEL is clicked twice', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Pular para modo Simulaçao/i));

    fireEvent.click(screen.getByText('START')); // Inicia
    
    fireEvent.click(screen.getByText(/Pause \/ Cancel/i)); // Pausa (1o clique)
    expect(screen.getByText('Paused')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Pause \/ Cancel/i)); // Cancela (2o clique)
    
    await waitFor(() => {
      expect(screen.getByText(/PRONTO/i)).toBeInTheDocument();
    });
  });
});
