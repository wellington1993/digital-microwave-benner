import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import '@testing-library/jest-dom';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Microwave Frontend — testes de regressao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('login com 404 (GitHub Pages sem backend) vai para modo offline', async () => {
    const { api } = await import('./api');
    (api.post as any).mockRejectedValueOnce({ response: { status: 404 } });

    render(<App />);
    fireEvent.click(screen.getByText('ENTRAR'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('login com 401 exibe mensagem e permanece na tela de login', async () => {
    const { api } = await import('./api');
    (api.post as any).mockRejectedValueOnce({
      response: { status: 401, data: { mensagem: 'Credenciais invalidas.' } },
    });

    render(<App />);
    fireEvent.click(screen.getByText('ENTRAR'));

    await waitFor(() => {
      expect(screen.getByText('Credenciais invalidas.')).toBeInTheDocument();
    });
    expect(screen.getByText('Micro-ondas Digital')).toBeInTheDocument();
  });

  it('handleAction com resposta 400 exibe mensagem sem loop infinito', async () => {
    sessionStorage.setItem('microwave_token', 'tok');
    const { api } = await import('./api');
    (api.post as any).mockRejectedValueOnce({
      response: { status: 400, data: { mensagem: 'O tempo deve ser entre 1 e 120 segundos.' } },
    });

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });

    await waitFor(() => {
      expect(screen.getByText('O tempo deve ser entre 1 e 120 segundos.')).toBeInTheDocument();
    });
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('handleAction sem rede ativa modo offline e roda simulacao', async () => {
    sessionStorage.setItem('microwave_token', 'tok');
    const { api } = await import('./api');
    (api.post as any).mockRejectedValueOnce({ request: {}, response: undefined });

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText('Aquecendo')).toBeInTheDocument();
  });

  it('programa fixo funciona no modo offline', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulação/i));

    fireEvent.click(screen.getByText('Leite'));

    await waitFor(() => {
      expect(screen.getByText('Aquecendo')).toBeInTheDocument();
    });
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('quick-start no modo offline inicia aquecimento de 30 segundos', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulação/i));

    fireEvent.click(screen.getByText('Start'));

    await waitFor(() => {
      expect(screen.getByText('00:30')).toBeInTheDocument();
    });
  });

  it('inicia programa fixo no modo online e chama endpoint correto', async () => {
    const { api } = await import('./api');
    (api.post as any)
      .mockResolvedValueOnce({ data: { token: 'fake-token' } })
      .mockResolvedValueOnce({ data: { state: 'Heating', remainingSeconds: 180, output: '*' } });

    render(<App />);
    fireEvent.click(screen.getByText('ENTRAR'));

    await waitFor(() => screen.getByText('Programas Fixos'));

    fireEvent.click(screen.getByText('Pipoca'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/microwave/start-program', { programName: 'Pipoca' });
    });
  });
});

