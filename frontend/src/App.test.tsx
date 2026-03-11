import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

vi.mock('./api', () => ({
  api: {
    get:  vi.fn(),
    post: vi.fn(),
  },
}));

describe('App — tela de login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renderiza os campos de login', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('entra no modo simulacao ao clicar no link', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulacao/i));
    expect(screen.getByText(/Modo Offline/i)).toBeInTheDocument();
  });
});

describe('App — painel offline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const enterSim = () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulacao/i));
  };

  it('mostra SISTEMA PRONTO no estado Idle', () => {
    enterSim();
    expect(screen.getByText('SISTEMA PRONTO')).toBeInTheDocument();
  });

  it('START inicia contagem regressiva', () => {
    enterSim();
    fireEvent.click(screen.getByRole('button', { name: /inicio rapido/i }));
    expect(screen.getByText('Aquecendo')).toBeInTheDocument();
  });

  it('Pausa/Cancelar muda estado para Pausado', () => {
    enterSim();
    fireEvent.click(screen.getByRole('button', { name: /inicio rapido/i }));
    fireEvent.click(screen.getByRole('button', { name: /pausar ou cancelar/i }));
    expect(screen.getByText('Pausado')).toBeInTheDocument();
  });

  it('segundo Pausa/Cancelar volta ao Idle', () => {
    enterSim();
    fireEvent.click(screen.getByRole('button', { name: /inicio rapido/i }));
    fireEvent.click(screen.getByRole('button', { name: /pausar ou cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText('SISTEMA PRONTO')).toBeInTheDocument();
  });

  it('programa automatico inicia com os valores corretos', () => {
    enterSim();
    fireEvent.click(screen.getByRole('button', { name: /pipoca/i }));
    expect(screen.getByText('Aquecendo')).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo restante/i)).toHaveTextContent('03:00');
  });
});