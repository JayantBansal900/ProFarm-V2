import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide mock for window.matchMedia if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Fix for Node 24 + JSDOM AbortSignal / Request webidl incompatibility
const NativeRequest = globalThis.Request;
if (NativeRequest) {
  globalThis.Request = class Request extends NativeRequest {
    constructor(input: any, init?: any) {
      if (init && init.signal) {
        // Strip signal if it fails internal webidl brand check
        const cleanInit = { ...init };
        delete cleanInit.signal;
        super(input, cleanInit);
      } else {
        super(input, init);
      }
    }
  } as any;
}


