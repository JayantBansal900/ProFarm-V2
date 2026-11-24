
import {
  ApiHealthResponse,
  DatabaseHealthResponse,
  ApiErrorResponse,
  AuthResponse,
  LogoutResponse,
} from '../types';

import {
  LocationsSearchResponse,
  ForecastResponse,
} from '../types/weather';

import {
  MandiPriceQueryParams,
  MandiPriceResponse,
  MandiFilterOptions,
  MandiTrendsResponse,
} from '../types/mandi';

import {
  AdvisorRequestInput,
  AdvisorRecommendationsResponse,
  AdvisorCropsResponse,
  AdvisorSoilsResponse,
} from '../types/advisor';

import {
  FarmListResponse,
  FarmDetailResponse,
  CropCyclesResponse,
  ActivitiesResponse,
  TasksResponse,
  FarmOverviewResponse,
  CalendarResponse,
  CropCycleRecord,
  FarmActivityRecord,
  FarmTaskRecord,
  CreateCropCycleRequest,
  UpdateCropCycleRequest,
} from '../types/farm';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type SuccessData<T> = {
  status: 'success';
  data: T;
};

type CropCycleMutationResponse = SuccessData<CropCycleRecord>;
type ActivityMutationResponse = SuccessData<FarmActivityRecord>;
type TaskMutationResponse = SuccessData<FarmTaskRecord>;

/**
 * Phase 3 pagination options for crop cycles.
 *
 * Both properties are optional.
 * Omitting both preserves legacy complete-list retrieval.
 */
export interface CropCyclePaginationOptions {
  page?: number;
  limit?: number;
}

export interface FarmActivityQuery {
  category?: string;
  cropCycleId?: string;
  page?: number;
  limit?: number;
}

export interface FarmTaskQuery {
  status?: string;
  category?: string;
  cropCycleId?: string;
  page?: number;
  limit?: number;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: ApiErrorResponse;

  constructor(
    message: string,
    statusCode: number,
    details?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
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
        errorData = (await response.json()) as ApiErrorResponse;
      } catch {
        // Non-JSON error response.
      }

      throw new ApiError(
        errorData?.message ||
          `Request failed with HTTP status ${response.status}`,
        response.status,
        errorData
      );
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' ||
        error.message.includes('aborted'))
    ) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'Unable to connect to ProFarm. Check your connection and try again.',
      0
    );
  }
}

/**
 * Shared optional query-string builder.
 *
 * Undefined parameters are omitted.
 * Values are encoded using URLSearchParams.
 */
function buildQueryString(
  values: Record<string, string | number | boolean | undefined>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }

  const query = params.toString();

  return query ? `?${query}` : '';
}

export const api = {
  // ============================================================
  // Health
  // ============================================================

  getHealth: () =>
    request<ApiHealthResponse>('/api/health'),

  getDatabaseHealth: () =>
    request<DatabaseHealthResponse>('/api/health/database'),

  // ============================================================
  // Authentication
  // ============================================================

  register: (body: {
    name: string;
    email: string;
    password: string;
  }) =>
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

  getMe: () =>
    request<AuthResponse>('/api/auth/me'),

  // ============================================================
  // Weather
  // ============================================================

  searchLocations: (
    query: string,
    signal?: AbortSignal
  ) =>
    request<LocationsSearchResponse>(
      `/api/weather/locations?query=${encodeURIComponent(query)}`,
      { signal }
    ),

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

    if (locationName) {
      params.append('locationName', locationName);
    }

    return request<ForecastResponse>(
      `/api/weather/forecast?${params.toString()}`,
      { signal }
    );
  },

  // ============================================================
  // Mandi
  // ============================================================

  getMandiPrices: (
    params?: MandiPriceQueryParams,
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();

    if (params?.commodity) {
      query.append('commodity', params.commodity);
    }

    if (params?.state) {
      query.append('state', params.state);
    }

    if (params?.district) {
      query.append('district', params.district);
    }

    if (params?.market) {
      query.append('market', params.market);
    }

    if (params?.page) {
      query.append('page', params.page.toString());
    }

    if (params?.limit) {
      query.append('limit', params.limit.toString());
    }

    if (params?.sort) {
      query.append('sort', params.sort);
    }

    const qStr = query.toString();

    return request<MandiPriceResponse>(
      `/api/mandi/prices${qStr ? `?${qStr}` : ''}`,
      { signal }
    );
  },

  getMandiFilters: (
    state?: string,
    signal?: AbortSignal
  ) => {
    const qStr = state
      ? `?state=${encodeURIComponent(state)}`
      : '';

    return request<MandiFilterOptions>(
      `/api/mandi/filters${qStr}`,
      { signal }
    );
  },

  getMandiTrends: (signal?: AbortSignal) =>
    request<MandiTrendsResponse>(
      '/api/mandi/trends',
      { signal }
    ),

  // ============================================================
  // Sustainable Farming Advisor
  // ============================================================

  getAdvisorRecommendations: (
    body: AdvisorRequestInput,
    signal?: AbortSignal
  ) =>
    request<AdvisorRecommendationsResponse>(
      '/api/advisor/recommendations',
      {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
      }
    ),

  getAdvisorCrops: (signal?: AbortSignal) =>
    request<AdvisorCropsResponse>(
      '/api/advisor/crops',
      { signal }
    ),

  getAdvisorSoils: (signal?: AbortSignal) =>
    request<AdvisorSoilsResponse>(
      '/api/advisor/soils',
      { signal }
    ),

  // ============================================================
  // Farm Management
  // ============================================================

  getFarms: (
    includeArchived = false,
    page = 1,
    limit = 20,
    signal?: AbortSignal
  ) => {
    const qStr = new URLSearchParams({
      includeArchived: String(includeArchived),
      page: String(page),
      limit: String(limit),
    }).toString();

    return request<FarmListResponse>(
      `/api/farms?${qStr}`,
      { signal }
    );
  },

  createFarm: (
    body: Record<string, unknown>,
    signal?: AbortSignal
  ) =>
    request<FarmDetailResponse>('/api/farms', {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    }),

  getFarmById: (
    farmId: string,
    signal?: AbortSignal
  ) =>
    request<FarmDetailResponse>(
      `/api/farms/${farmId}`,
      { signal }
    ),

  updateFarm: (
    farmId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ) =>
    request<FarmDetailResponse>(
      `/api/farms/${farmId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        signal,
      }
    ),

  archiveFarm: (
    farmId: string,
    signal?: AbortSignal
  ) =>
    request<FarmDetailResponse>(
      `/api/farms/${farmId}/archive`,
      {
        method: 'POST',
        signal,
      }
    ),

  restoreFarm: (
    farmId: string,
    signal?: AbortSignal
  ) =>
    request<FarmDetailResponse>(
      `/api/farms/${farmId}/restore`,
      {
        method: 'POST',
        signal,
      }
    ),

  // ============================================================
  // Crop Cycles — Phase 3 Pagination
  // ============================================================

  /**
   * Existing calls remain supported:
   *
   * api.getCropCycles(farmId)
   * api.getCropCycles(farmId, signal)
   *
   * New paginated calls:
   *
   * api.getCropCycles(farmId, { page: 1, limit: 20 })
   * api.getCropCycles(farmId, { page: 2, limit: 10 }, signal)
   *
   * Pagination is opt-in.
   *
   * Without pagination options, the backend returns the
   * complete crop-cycle collection as before.
   */
  getCropCycles: (
    farmId: string,
    optionsOrSignal?: CropCyclePaginationOptions | AbortSignal,
    signal?: AbortSignal
  ) => {
    const isSignal =
      typeof AbortSignal !== 'undefined' &&
      optionsOrSignal instanceof AbortSignal;

    const options = isSignal
      ? undefined
      : (optionsOrSignal as CropCyclePaginationOptions | undefined);

    const requestSignal = isSignal
      ? (optionsOrSignal as AbortSignal)
      : signal;

    const query = buildQueryString({
      page: options?.page,
      limit: options?.limit,
    });

    return request<CropCyclesResponse>(
      `/api/farms/${farmId}/cycles${query}`,
      { signal: requestSignal }
    );
  },

  createCropCycle: (
    farmId: string,
    body: CreateCropCycleRequest,
    signal?: AbortSignal
  ) =>
    request<CropCycleMutationResponse>(
      `/api/farms/${farmId}/cycles`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
      }
    ),

  updateCropCycle: (
    farmId: string,
    cycleId: string,
    body: UpdateCropCycleRequest,
    signal?: AbortSignal
  ) =>
    request<CropCycleMutationResponse>(
      `/api/farms/${farmId}/cycles/${cycleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        signal,
      }
    ),

  // ============================================================
  // Farm Activities
  // ============================================================

  getFarmActivities: (
    farmId: string,
    query?: FarmActivityQuery,
    signal?: AbortSignal
  ) => {
    const qStr = buildQueryString({
      category: query?.category,
      cropCycleId: query?.cropCycleId,
      page: query?.page,
      limit: query?.limit,
    });

    return request<ActivitiesResponse>(
      `/api/farms/${farmId}/activities${qStr}`,
      { signal }
    );
  },

  createFarmActivity: (
    farmId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ) =>
    request<ActivityMutationResponse>(
      `/api/farms/${farmId}/activities`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
      }
    ),

  updateFarmActivity: (
    farmId: string,
    activityId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ) =>
    request<ActivityMutationResponse>(
      `/api/farms/${farmId}/activities/${activityId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        signal,
      }
    ),

  deleteFarmActivity: (
    farmId: string,
    activityId: string,
    signal?: AbortSignal
  ) =>
    request<{
      status: 'success';
      message: string;
    }>(
      `/api/farms/${farmId}/activities/${activityId}`,
      {
        method: 'DELETE',
        signal,
      }
    ),

  // ============================================================
  // Farm Tasks — Phase 3 Category Filtering
  // ============================================================

  getFarmTasks: (
    farmId: string,
    query?: FarmTaskQuery,
    signal?: AbortSignal
  ) => {
    const qStr = buildQueryString({
      status: query?.status,
      category: query?.category,
      cropCycleId: query?.cropCycleId,
      page: query?.page,
      limit: query?.limit,
    });

    return request<TasksResponse>(
      `/api/farms/${farmId}/tasks${qStr}`,
      { signal }
    );
  },

  createFarmTask: (
    farmId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ) =>
    request<TaskMutationResponse>(
      `/api/farms/${farmId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
      }
    ),

  updateFarmTask: (
    farmId: string,
    taskId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ) =>
    request<TaskMutationResponse>(
      `/api/farms/${farmId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        signal,
      }
    ),

  // ============================================================
  // Farm Dashboard
  // ============================================================

  getFarmsOverview: (signal?: AbortSignal) =>
    request<FarmOverviewResponse>(
      '/api/farms/overview',
      { signal }
    ),

  // ============================================================
  // Farm Calendar
  // ============================================================

  getFarmCalendar: (
    year: number,
    month: number,
    farmId?: string,
    signal?: AbortSignal
  ) => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });

    if (farmId) {
      params.append('farmId', farmId);
    }

    return request<CalendarResponse>(
      `/api/farms/calendar?${params.toString()}`,
      { signal }
    );
  },
};
