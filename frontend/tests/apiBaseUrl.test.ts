import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from '../src/api/baseUrl';

describe('resolveApiBaseUrl', () => {
  it('talks to the local backend during development', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('http://localhost:4000');
  });

  it('uses the page’s own address in a production build, where the API serves the app', () => {
    expect(resolveApiBaseUrl(undefined, true)).toBe('');
  });

  it('lets an explicit address win everywhere', () => {
    expect(resolveApiBaseUrl('https://api.example.org', true)).toBe('https://api.example.org');
    expect(resolveApiBaseUrl('http://localhost:4100', false)).toBe('http://localhost:4100');
  });

  it('treats an empty value as "same address" even in development, and trims trailing slashes', () => {
    expect(resolveApiBaseUrl('', false)).toBe('');
    expect(resolveApiBaseUrl('https://api.example.org/', true)).toBe('https://api.example.org');
  });
});
