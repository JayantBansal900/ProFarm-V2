import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FarmDetailPage } from '../src/pages/FarmDetailPage';
import { api } from '../src/api/api';

vi.mock('../src/api/api', () => ({
  api: {
    getFarmById: vi.fn(),
    getCropCycles: vi.fn(),
    getFarmActivities: vi.fn(),
    getFarmTasks: vi.fn(),
    getAdvisorCrops: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mocked = vi.mocked(api);
const stamp = '2024-01-01T00:00:00.000Z';
const pagination = { page: 1, limit: 10, totalRecords: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false };

function seed(isArchived: boolean) {
  mocked.getFarmById.mockResolvedValue({
    status: 'success',
    data: { id: 'farm-1', userId: 'u1', name: 'River Field', isArchived, createdAt: stamp, updatedAt: stamp },
  } as never);
  mocked.getCropCycles.mockResolvedValue({
    status: 'success', count: 1,
    data: [{ id: 'c1', farmId: 'farm-1', cropId: 'crop-wheat', cropName: 'Wheat', sowingDate: '2024-01-01',
      status: 'active', createdAt: stamp, updatedAt: stamp }],
  } as never);
  mocked.getFarmActivities.mockResolvedValue({
    status: 'success', pagination,
    activities: [{ id: 'a1', farmId: 'farm-1', category: 'general', activityDate: '2024-01-02',
      title: 'Walked the field', createdAt: stamp, updatedAt: stamp }],
  } as never);
  mocked.getFarmTasks.mockResolvedValue({
    status: 'success', pagination,
    tasks: [{ id: 't1', farmId: 'farm-1', category: 'general', title: 'Check pump', dueDate: '2024-01-03',
      status: 'pending', createdAt: stamp, updatedAt: stamp }],
  } as never);
  mocked.getAdvisorCrops.mockResolvedValue({ status: 'success', crops: [] } as never);
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/my-farms/farm-1']}>
      <Routes>
        <Route path="/my-farms/:farmId" element={<FarmDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const writeControls = () => [
  screen.getByRole('button', { name: 'Edit Farm' }),
  screen.getByRole('button', { name: /Add Crop Cycle/ }),
  screen.getByRole('button', { name: 'Edit Cycle' }),
  screen.getByRole('button', { name: /Log Activity/ }),
  screen.getByRole('button', { name: /Add Task/ }),
  screen.getByRole('button', { name: 'Delete' }),
  screen.getByRole('button', { name: 'Complete' }),
  ...screen.getAllByRole('button', { name: 'Edit' }),
];

describe('FarmDetailPage archived farms', () => {
  beforeEach(() => vi.clearAllMocks());

  it('disables every write control on an archived farm but keeps Restore enabled', async () => {
    seed(true);
    renderPage();
    await waitFor(() => expect(screen.getByText('Check pump')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Walked the field')).toBeInTheDocument());

    for (const control of writeControls()) expect(control).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restore Farm' })).toBeEnabled();
  });

  it('leaves write controls enabled on an active farm', async () => {
    seed(false);
    renderPage();
    await waitFor(() => expect(screen.getByText('Check pump')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Walked the field')).toBeInTheDocument());

    for (const control of writeControls()) expect(control).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Archive Farm' })).toBeEnabled();
  });
});
