import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do EventSource (SSE)
class EventSourceMock {
  onmessage: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(_url: string) {}
}

if (typeof window !== 'undefined' && !window.EventSource) {
  Object.defineProperty(window, 'EventSource', { 
    value: EventSourceMock,
    writable: true,
    configurable: true 
  });
}

// Mock do SessionStorage
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: storageMock });
