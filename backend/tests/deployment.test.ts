import { describe, expect, it } from 'vitest';
import { resolveFrontendOrigin, resolveTrustProxy } from '../src/lib/deployment';

describe('resolveFrontendOrigin', () => {
  it('prefers an explicit origin over the Render address', () => {
    expect(resolveFrontendOrigin('https://profarm.example.org', 'https://profarm.onrender.com')).toBe('https://profarm.example.org');
  });

  it.each([undefined, '', '   '])('uses the Render address when FRONTEND_ORIGIN is %j', (explicit) => {
    expect(resolveFrontendOrigin(explicit, 'https://profarm-abcd.onrender.com')).toBe('https://profarm-abcd.onrender.com');
  });

  it('falls back to the local Vite address', () => {
    expect(resolveFrontendOrigin(undefined, undefined)).toBe('http://localhost:5173');
  });

  it('drops trailing slashes so the CSRF origin comparison matches', () => {
    expect(resolveFrontendOrigin('https://profarm.example.org/', undefined)).toBe('https://profarm.example.org');
    expect(resolveFrontendOrigin(undefined, 'https://profarm.onrender.com//')).toBe('https://profarm.onrender.com');
  });
});

describe('resolveTrustProxy', () => {
  it('trusts one proxy in production and none elsewhere', () => {
    expect(resolveTrustProxy(undefined, 'production')).toBe(1);
    expect(resolveTrustProxy(undefined, 'development')).toBe(0);
    expect(resolveTrustProxy(undefined, 'test')).toBe(0);
  });

  it('honours an explicit value, including 0', () => {
    expect(resolveTrustProxy(2, 'production')).toBe(2);
    expect(resolveTrustProxy(0, 'production')).toBe(0);
  });
});
