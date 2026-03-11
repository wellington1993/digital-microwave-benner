import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock do EventSource (SSE)
class EventSourceMock {
  onmessage: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(_url: string) {}
}
Object.defineProperty(window, 'EventSource', { value: EventSourceMock });

describe('Microwave Frontend - Full Suite', () => {
  const mockPost = api.post as any;
  const mockGet = api.get as any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('1. Deve entrar em modo offline quando login falha por rede', async () => {
    mockPost.mockRejectedValueOnce({ response: null });
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    await waitFor(() => expect(screen.getByText(/SERVIDOR OFFLINE/i)).toBeInTheDocument());
  });

  it('2. Deve mostrar mensagem de erro em login inválido (401)', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401, data: { mensagem: 'Credenciais invalidas.' } } });
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Credenciais invalidas.'));
  });

  it('3. Deve carregar programa Pipoca no modo offline', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulação/i));
    
    const btn = await screen.findByText('Pipoca');
    fireEvent.click(btn);
    
    expect(screen.getByText('03:00')).toBeInTheDocument();
    expect(screen.getByText('Aquecendo')).toBeInTheDocument();
  });

  it('4. Deve limpar o visor ao cancelar aquecimento pausado (offline)', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulação/i));
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByText(/Pausa \/ Cancelar/i)); // Pausa
    fireEvent.click(screen.getByText(/Pausa \/ Cancelar/i)); // Cancela
    
    expect(screen.getByText(/PRONTO/i)).toBeInTheDocument();
  });

  it('5. Deve exibir mensagem ao tentar acréscimo em programas fixos (offline)', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulação/i));
    fireEvent.click(screen.getByText('Pipoca'));
    
    fireEvent.click(screen.getByText('+30s'));
    expect(screen.getByText(/Programas não permitem acréscimo/i)).toBeInTheDocument();
  });

  it('6. Deve chamar API ao clicar em START (online)', async () => {
    mockPost.mockResolvedValueOnce({ data: { token: 'tok' } });
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    
    await waitFor(() => expect(screen.getByText('Start')).toBeInTheDocument());
    
    mockPost.mockResolvedValueOnce({ data: { state: 'Heating', remainingSeconds: 30 } });
    fireEvent.click(screen.getByText('Start'));
    
    expect(mockPost).toHaveBeenCalledWith('/microwave/start', expect.anything());
  });

  it('7. Deve listar programas vindos da API (online)', async () => {
    mockPost.mockResolvedValueOnce({ data: { token: 'tok' } });
    mockGet.mockResolvedValueOnce({ data: [] }); // Programs list
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR/i));
    
    await waitFor(() => expect(screen.getByText('Pipoca')).toBeInTheDocument());
  });
});
