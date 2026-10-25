import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../src/app/routes';

// Mock API service calls for frontend router tests
vi.mock('../src/services/api', () => ({
  api: {
    getHealth: vi.fn().mockResolvedValue({ status: 'ok', service: 'profarm-api' }),
    getDatabaseHealth: vi.fn().mockResolvedValue({ status: 'ok', service: 'profarm-api', database: 'connected', latencyMs: 5 }),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
    }
  },
}));

describe('Frontend Routes & Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HomePage on default route "/"', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ProFarm V2 Architecture Foundation/i })).toBeInTheDocument();
    });
  });

  it('renders DashboardPage on "/dashboard"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Farm Management Dashboard/i })).toBeInTheDocument();
  });

  it('renders KnowledgePage on "/knowledge"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/knowledge'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Agricultural Knowledge Base/i })).toBeInTheDocument();
  });

  it('renders ToolsPage on "/tools"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/tools'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Farm Tools & Analytics/i })).toBeInTheDocument();
  });

  it('renders LoginPage on "/login"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Farmer Authentication/i })).toBeInTheDocument();
  });

  it('renders NotFoundPage on unknown route "/some-random-route"', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/some-random-route'] });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Home/i })).toBeInTheDocument();
  });
});
