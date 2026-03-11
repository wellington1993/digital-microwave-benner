import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import '@testing-library/jest-dom';

describe('Microwave Frontend Resilience', () => {
  it('should display simulation banner when backend is offline', async () => {
    render(<App />);
    
    // Simula o evento de backend offline
    act(() => {
      window.dispatchEvent(new CustomEvent('backend-offline'));
    });

    expect(screen.getByText(/MODO DE SEGURANÇA ATIVADO/i)).toBeInTheDocument();
  });

  it('should start local simulation when offline and START is clicked', async () => {
    render(<App />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('backend-offline'));
    });

    const startButton = screen.getByText('START');
    fireEvent.click(startButton);

    // O visor deve mostrar que esta aquecendo ou os pontos iniciais
    // Como eh uma simulacao de 1s, vamos esperar o proximo tick
    expect(screen.getByText(/Heating/i)).toBeInTheDocument();
  });
});
