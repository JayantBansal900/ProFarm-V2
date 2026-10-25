import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../src/app/routes';

// Mock API service calls for frontend router tests
vi.mock('../src/services/api', () => ({
  api: {
    getHealth: vi.fn().mockResolvedValue({ status: 'ok', service: 'profarm-api' }),
    getDatabaseHealth: vi.fn().mockResolvedValue({
      status: 'ok',
      service: 'profarm-api',
      database: 'connected',
      latencyMs: 5,
    }),
    getMe: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    searchLocations: vi.fn().mockResolvedValue({ status: 'success', locations: [] }),
    getWeatherForecast: vi.fn().mockResolvedValue({ status: 'success', data: null }),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
    }
  },
}));

import { api, ApiError } from '../src/services/api';

describe('Frontend Routes & Authentication Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HomePage on default route "/"', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /ProFarm V2 Architecture Foundation/i })
      ).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated user accessing "/dashboard" to "/login"', async () => {
    vi.mocked(api.getMe).mockRejectedValueOnce(new ApiError('Unauthorized', 401));

    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Farmer Sign In/i })).toBeInTheDocument();
    });
  });

  it('renders DashboardPage on "/dashboard" when authenticated', async () => {
    vi.mocked(api.getMe).mockResolvedValueOnce({
      status: 'success',
      user: { id: 'farmer-123', name: 'Ramesh Patel', email: 'ramesh@example.com' },
    });

    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Farm Management Dashboard/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Ramesh Patel/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders KnowledgePage on "/knowledge"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/knowledge'] });
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /Crop & Soil Knowledge Explorer/i })
    ).toBeInTheDocument();
  });

  it('renders CropCatalogPage on "/knowledge/crops"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/knowledge/crops'] });
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /Indian Crop Knowledge Catalog/i })
    ).toBeInTheDocument();
  });

  it('renders SoilCatalogPage on "/knowledge/soils"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/knowledge/soils'] });
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /Soil Health & Classification Catalog/i })
    ).toBeInTheDocument();
  });

  it('renders ToolsPage on "/tools"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/tools'] });
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /Farm Tools & Decision Analytics/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Weather Tool/i })).toBeInTheDocument();
  });

  it('renders WeatherPage on "/tools/weather"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/tools/weather'] });
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /Live Weather & Rainfall/i })
    ).toBeInTheDocument();
  });

  it('renders LoginPage on "/login"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Farmer Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders SignupPage on "/signup"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/signup'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Create Farmer Account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage on unknown route "/some-random-route"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/some-random-route'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Home/i })).toBeInTheDocument();
  });
});
