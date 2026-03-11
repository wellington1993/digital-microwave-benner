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

describe('Microwave Frontend - Error Handling and Sync', () => {
  const mockPost = api.post as any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('resposta 404 (GitHub Pages sem backend) → modo offline', async () => {
    mockPost.mockRejectedValueOnce({ response: null });
    render(<App />);
    fireEvent.click(screen.getByText(/ENTRAR COMO ADMIN/i));
    await waitFor(() => expect(screen.getByText(/SERVIDOR OFFLINE/i)).toBeInTheDocument());
  });

  it('clique em Pipoca no modo offline inicia Heating com 03:00', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Modo Simulacao/i));
    
    const pipocaBtn = await screen.findByText('Pipoca');
    fireEvent.click(pipocaBtn);
    
    expect(screen.getByText('03:00')).toBeInTheDocument();
    expect(screen.getByText('Aquecendo')).toBeInTheDocument();
  });
});
