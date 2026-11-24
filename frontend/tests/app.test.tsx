
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../src/routes';

vi.mock('../src/api/api', () => ({
  api: {
    getHealth: vi.fn().mockResolvedValue({
      status: 'ok',
      service: 'profarm-api',
    }),

    getDatabaseHealth: vi.fn().mockResolvedValue({
      status: 'ok',
      service: 'profarm-api',
      database: 'connected',
      latencyMs: 5,
    }),

    // Unauthenticated sessions return a 401 error.
    getMe: vi.fn().mockRejectedValue(
      new Error('Unauthorized')
    ),

    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),

    searchLocations: vi.fn().mockResolvedValue({
      status: 'success',
      locations: [],
    }),

    getWeatherForecast: vi.fn().mockResolvedValue({
      status: 'success',
      data: null,
    }),

    getMandiPrices: vi.fn().mockResolvedValue({
      status: 'success',
      records: [],
      pagination: {
        totalRecords: 0,
        totalPages: 1,
        page: 1,
        limit: 20,
      },
    }),

    getMandiFilters: vi.fn().mockResolvedValue({
      status: 'success',
      commodities: [],
      states: [],
    }),

    getMandiTrends: vi.fn().mockResolvedValue({
      status: 'success',
      available: false,
    }),

    getAdvisorRecommendations: vi.fn().mockResolvedValue({
      status: 'success',
      data: null,
    }),

    getAdvisorCrops: vi.fn().mockResolvedValue({
      status: 'success',
      crops: [],
    }),

    getAdvisorSoils: vi.fn().mockResolvedValue({
      status: 'success',
      soils: [],
    }),

    getFarmsOverview: vi.fn().mockResolvedValue({
      status: 'success',
      data: {
        activeFarmsCount: 0,
        activeCropCyclesCount: 0,
        pendingTasksCount: 0,
        overdueTasksCount: 0,
        recentActivities: [],
        upcomingTasks: [],
      },
    }),
  },

  ApiError: class ApiError extends Error {
    constructor(
      public message: string,
      public statusCode: number
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

import { api, ApiError } from '../src/api/api';

function renderRoute(path: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
  });

  render(<RouterProvider router={router} />);

  return router;
}

describe('Frontend Routes & Authentication Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default every test to an unauthenticated session.
    // This matches the API's AuthResponse return type:
    // authentication failure is represented by rejection,
    // not by resolving with null.
    vi.mocked(api.getMe).mockReset();

    vi.mocked(api.getMe).mockRejectedValue(
      new ApiError('Unauthorized', 401)
    );
  });

  it('renders HomePage on default route "/"', async () => {
    const router = renderRoute('/');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');

      expect(
        screen.getByRole('link', {
          name: /Get Started/i,
        })
      ).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated user accessing "/dashboard" to "/login"', async () => {
    const router = renderRoute('/dashboard');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Welcome Back/i,
        })
      ).toBeInTheDocument();
    });

    expect(api.getMe).toHaveBeenCalled();
  });

  it('renders DashboardPage on "/dashboard" when authenticated', async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      status: 'success',
      user: {
        id: 'farmer-123',
        name: 'Ramesh Patel',
        email: 'ramesh@example.com',
      },
    });

    const router = renderRoute('/dashboard');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard');

      expect(
        screen.getAllByText(/Ramesh Patel/i).length
      ).toBeGreaterThanOrEqual(1);
    });

    expect(api.getMe).toHaveBeenCalled();
  });

  it('renders KnowledgePage on "/knowledge"', async () => {
    const router = renderRoute('/knowledge');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/knowledge');

      expect(
        screen.getByRole('link', {
          name: /Crop Library/i,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders CropCatalogPage on "/knowledge/crops"', async () => {
    const router = renderRoute('/knowledge/crops');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/knowledge/crops');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Explore Crops/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('region', {
          name: 'Crop catalog',
        })
      ).toBeInTheDocument();
    });
  });

  it('renders SoilCatalogPage on "/knowledge/soils"', async () => {
    const router = renderRoute('/knowledge/soils');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/knowledge/soils');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Explore Soils/i,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders ToolsPage on "/tools"', async () => {
    const router = renderRoute('/tools');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/tools');

      expect(
        screen.getByRole('link', {
          name: /Weather Insights/i,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders WeatherPage on "/tools/weather"', async () => {
    const router = renderRoute('/tools/weather');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/tools/weather');

      expect(
        screen.getByRole('heading', {
          level: 1,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders MandiPage on "/tools/mandi"', async () => {
    const router = renderRoute('/tools/mandi');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/tools/mandi');

      expect(
        screen.getByRole('heading', {
          level: 1,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders AdvisorPage on "/tools/advisor"', async () => {
    const router = renderRoute('/tools/advisor');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/tools/advisor');

      expect(
        screen.getByRole('heading', {
          level: 1,
        })
      ).toBeInTheDocument();
    });
  });

  it('renders LoginPage on "/login"', async () => {
    const router = renderRoute('/login');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Welcome Back/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(/^Email Address$/i, {
          selector: 'input',
        })
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(/^Password$/i, {
          selector: 'input',
        })
      ).toBeInTheDocument();
    });
  });

  it('renders SignupPage on "/signup"', async () => {
    const router = renderRoute('/signup');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/signup');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Create Your Account/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(/^Full Name$/i, {
          selector: 'input',
        })
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(/^Confirm Password$/i, {
          selector: 'input',
        })
      ).toBeInTheDocument();
    });
  });

  it('renders NotFoundPage on unknown route "/some-random-route"', async () => {
    const router = renderRoute('/some-random-route');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/some-random-route'
      );

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Looks like you've wandered off the path/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', {
          name: /Back to Home/i,
        })
      ).toHaveAttribute('href', '/');
    });
  });
});
