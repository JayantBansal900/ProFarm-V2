import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    createCropCycle: vi.fn(),
    updateCropCycle: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mocked = vi.mocked(api);
const stamp = '2026-11-01T00:00:00.000Z';
const pagination = { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 20 };

const cycle = (expectedHarvestDate: string | null) => ({
  id: 'c1', farmId: 'farm-1', cropId: 'crop-wheat', cropName: 'Wheat', sowingDate: '2026-11-10',
  expectedHarvestDate, status: 'planned', createdAt: stamp, updatedAt: stamp,
});

function seed(expectedHarvestDate: string | null = null) {
  mocked.getFarmById.mockResolvedValue({
    status: 'success',
    data: { id: 'farm-1', userId: 'u1', name: 'River Field', isArchived: false, createdAt: stamp, updatedAt: stamp },
  } as never);
  mocked.getCropCycles.mockResolvedValue({ status: 'success', count: 1, data: [cycle(expectedHarvestDate)] } as never);
  mocked.getFarmActivities.mockResolvedValue({ status: 'success', activities: [], pagination } as never);
  mocked.getFarmTasks.mockResolvedValue({ status: 'success', tasks: [], pagination } as never);
  mocked.getAdvisorCrops.mockResolvedValue({
    status: 'success',
    crops: [{ id: 'crop-wheat', name: 'Wheat' }, { id: 'crop-rice', name: 'Rice' }],
  } as never);
  mocked.createCropCycle.mockResolvedValue({ status: 'success', data: cycle(null) } as never);
  mocked.updateCropCycle.mockResolvedValue({ status: 'success', data: cycle(null) } as never);
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

const field = (form: HTMLElement, label: RegExp) => within(form).getByLabelText(label) as HTMLInputElement;

describe('expected harvest date on crop cycles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds an optional harvest date when creating a cycle, with the crop’s usual harvest window as a hint', async () => {
    seed();
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Add Crop Cycle/ }));
    const form = screen.getByRole('heading', { name: 'New Crop Cycle' }).closest('form') as HTMLElement;

    await waitFor(() => expect(within(form).getByRole('option', { name: 'Wheat' })).toBeInTheDocument());
    fireEvent.change(field(form, /^Crop$/), { target: { value: 'crop-wheat' } });
    expect(within(form).getByText(/Usually harvested: March to April/)).toBeInTheDocument();

    fireEvent.change(field(form, /Sowing Date/), { target: { value: '2026-11-10' } });
    const harvest = field(form, /Expected Harvest Date/);
    expect(harvest).not.toBeRequired();
    expect(harvest).toHaveAttribute('min', '2026-11-10');

    fireEvent.change(harvest, { target: { value: '2027-04-10' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Create Cycle' }));

    await waitFor(() => expect(mocked.createCropCycle).toHaveBeenCalledWith('farm-1', {
      cropId: 'crop-wheat', sowingDate: '2026-11-10', expectedHarvestDate: '2027-04-10', status: 'planned',
    }));
  });

  it('still creates a cycle with no harvest date, and sends none', async () => {
    seed();
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Add Crop Cycle/ }));
    const form = screen.getByRole('heading', { name: 'New Crop Cycle' }).closest('form') as HTMLElement;
    await waitFor(() => expect(within(form).getByRole('option', { name: 'Rice' })).toBeInTheDocument());
    fireEvent.change(field(form, /^Crop$/), { target: { value: 'crop-rice' } });
    fireEvent.change(field(form, /Sowing Date/), { target: { value: '2026-06-20' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Create Cycle' }));

    await waitFor(() => expect(mocked.createCropCycle).toHaveBeenCalledWith('farm-1', {
      cropId: 'crop-rice', sowingDate: '2026-06-20', status: 'planned',
    }));
  });

  it('refuses a harvest date before the sowing date without calling the server', async () => {
    seed();
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Add Crop Cycle/ }));
    const form = screen.getByRole('heading', { name: 'New Crop Cycle' }).closest('form') as HTMLElement;
    await waitFor(() => expect(within(form).getByRole('option', { name: 'Wheat' })).toBeInTheDocument());
    fireEvent.change(field(form, /^Crop$/), { target: { value: 'crop-wheat' } });
    fireEvent.change(field(form, /Sowing Date/), { target: { value: '2026-11-10' } });
    fireEvent.change(field(form, /Expected Harvest Date/), { target: { value: '2026-10-01' } });

    // The date picker's own `min` rule blocks the submit first...
    fireEvent.click(within(form).getByRole('button', { name: 'Create Cycle' }));
    expect(mocked.createCropCycle).not.toHaveBeenCalled();

    // ...and the form's own check is the backstop when that validation is bypassed.
    fireEvent.submit(form);
    expect(await within(form).findByText('Expected harvest date cannot be earlier than the sowing date.')).toBeInTheDocument();
    expect(mocked.createCropCycle).not.toHaveBeenCalled();
  });

  it('lets a farmer set the harvest date on an existing cycle, saving only that change', async () => {
    seed(null);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Cycle' }));
    const form = screen.getByRole('heading', { name: 'Edit Crop Cycle' }).closest('form') as HTMLElement;

    const harvest = field(form, /Expected Harvest Date/);
    expect(harvest).toHaveValue('');
    fireEvent.change(harvest, { target: { value: '2027-04-10' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Save Cycle' }));

    await waitFor(() => expect(mocked.updateCropCycle).toHaveBeenCalledWith('farm-1', 'c1', { expectedHarvestDate: '2027-04-10' }));
  });

  it('shows the saved date and clears it when emptied', async () => {
    seed('2027-04-10');
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Cycle' }));
    const form = screen.getByRole('heading', { name: 'Edit Crop Cycle' }).closest('form') as HTMLElement;

    const harvest = field(form, /Expected Harvest Date/);
    expect(harvest).toHaveValue('2027-04-10');
    fireEvent.change(harvest, { target: { value: '' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Save Cycle' }));

    await waitFor(() => expect(mocked.updateCropCycle).toHaveBeenCalledWith('farm-1', 'c1', { expectedHarvestDate: null }));
  });

  it('reports no changes when nothing was edited, and rejects a date before sowing', async () => {
    seed('2027-04-10');
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Cycle' }));
    const form = screen.getByRole('heading', { name: 'Edit Crop Cycle' }).closest('form') as HTMLElement;

    fireEvent.click(within(form).getByRole('button', { name: 'Save Cycle' }));
    expect(await screen.findByText('No changes to save.')).toBeInTheDocument();

    fireEvent.change(field(form, /Expected Harvest Date/), { target: { value: '2026-11-01' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Save Cycle' }));
    expect(mocked.updateCropCycle).not.toHaveBeenCalled();
    fireEvent.submit(form);
    expect(await within(form).findByText('Expected harvest date cannot be earlier than the sowing date.')).toBeInTheDocument();
    expect(mocked.updateCropCycle).not.toHaveBeenCalled();
  });
});
