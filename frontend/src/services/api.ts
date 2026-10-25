import {
  ApiHealthResponse,
  DatabaseHealthResponse,
  ApiErrorResponse,
  AuthResponse,
  LogoutResponse,
} from '../types';
import { LocationsSearchResponse, ForecastResponse } from '../types/weather';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export class ApiError extends Error {
  public statusCode: number;
  public details?: ApiErrorResponse;

  constructor(message: string, statusCode: number, details?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorData: ApiErrorResponse | undefined;
      try {
        errorData = await response.json();
      } catch {
        // Non-JSON response
      }
      throw new ApiError(
        errorData?.message || `Request failed with HTTP status ${response.status}`,
        response.status,
        errorData
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      throw error;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network communication failure',
      0
    );
  }
}

export const api = {
  getHealth: () => request<ApiHealthResponse>('/api/health'),
  getDatabaseHealth: () => request<DatabaseHealthResponse>('/api/health/database'),
  register: (body: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  logout: () =>
    request<LogoutResponse>('/api/auth/logout', {
      method: 'POST',
    }),
  getMe: () => request<AuthResponse>('/api/auth/me'),
  searchLocations: (query: string, signal?: AbortSignal) =>
    request<LocationsSearchResponse>(`/api/weather/locations?query=${encodeURIComponent(query)}`, {
      signal,
    }),
  getWeatherForecast: (
    latitude: number,
    longitude: number,
    locationName?: string,
    signal?: AbortSignal
  ) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (locationName) params.append('locationName', locationName);
    return request<ForecastResponse>(`/api/weather/forecast?${params.toString()}`, { signal });
  },
};


