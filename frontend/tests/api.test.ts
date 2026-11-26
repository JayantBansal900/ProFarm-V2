import { describe, it, expect, vi, afterEach } from 'vitest';
import { api, ApiError } from '../src/api/api';

describe('Centralized API Client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully fetches health probe data', async () => {
    const mockResponse = { status: 'ok', service: 'profarm-api' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const data = await api.getHealth();
    expect(data).toEqual(mockResponse);
  });

  it('throws ApiError with status code and details on HTTP error response', async () => {
    const errorBody = { status: 'error', message: 'Service unavailable' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => errorBody,
    } as Response);

    await expect(api.getHealth()).rejects.toThrow(ApiError);
  });

  it('handles low-level network failure gracefully', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

    const failure = api.getHealth();
    await expect(failure).rejects.toThrow(ApiError);
    await expect(failure).rejects.toThrow('Unable to connect to ProFarm');
  });
});
