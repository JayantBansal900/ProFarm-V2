import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MandiPage } from '../src/pages/tools/MandiPage';
import { api, ApiError } from '../src/services/api';
import { MandiPriceResponse, MandiFilterOptions } from '../src/types/mandi';

vi.mock('../src/services/api', () => ({
  api: {
    getMandiPrices: vi.fn(),
    getMandiFilters: vi.fn(),
    getMandiTrends: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
    }
  },
}));

const MOCK_FILTERS: MandiFilterOptions = {
  status: 'success',
  commodities: ['Wheat', 'Paddy(Common)', 'Mustard', 'Cotton', 'Maize', 'Potato', 'Onion'],
  states: [
    {
      state: 'Madhya Pradesh',
      districts: ['Sidhi', 'Hoshangabad', 'Dewas', 'Bhopal'],
    },
    {
      state: 'Andhra Pradesh',
      districts: ['Prakasam', 'Guntur', 'Krishna'],
    },
    {
      state: 'Punjab',
      districts: ['Ludhiana', 'Amritsar', 'Patiala'],
    },
  ],
  dataFreshness: {
    fetchedAt: '2026-10-26T05:00:00Z',
    cached: false,
  },
};

const MOCK_PRICES_PAGE_1: MandiPriceResponse = {
  status: 'success',
  records: [
    {
      id: 'mp-hoshangabad-itarsi-apmc-wheat-sharbati-25-10-2026',
      state: 'Madhya Pradesh',
      district: 'Hoshangabad',
      market: 'Itarsi APMC',
      commodity: 'Wheat',
      variety: 'Sharbati',
      grade: 'FAQ',
      arrivalDate: '25/10/2026',
      minPrice: 2800,
      maxPrice: 3200,
      modalPrice: 3050,
      priceUnit: '₹ / quintal',
    },
    {
      id: 'mp-sidhi-sidhi-apmc-wheat-mill-quality-25-10-2026',
      state: 'Madhya Pradesh',
      district: 'Sidhi',
      market: 'Sidhi APMC',
      commodity: 'Wheat',
      variety: 'Mill Quality',
      grade: 'Non-FAQ',
      arrivalDate: '25/10/2026',
      minPrice: 2400,
      maxPrice: 2450,
      modalPrice: 2450,
      priceUnit: '₹ / quintal',
    },
    {
      id: 'mp-dewas-dewas-apmc-wheat-lokwan-25-10-2026',
      state: 'Madhya Pradesh',
      district: 'Dewas',
      market: 'Dewas APMC',
      commodity: 'Wheat',
      variety: 'Lokwan',
      grade: 'FAQ',
      arrivalDate: '25/10/2026',
      minPrice: 2200,
      maxPrice: 2350,
      modalPrice: 2300,
      priceUnit: '₹ / quintal',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    totalRecords: 45,
    totalPages: 3,
  },
  filters: {
    commodity: 'Wheat',
    state: null,
    district: null,
    market: null,
  },
  sorting: 'modal_price_desc',
  attribution: {
    source: 'Government of India — data.gov.in / AGMARKNET',
    datasetTitle: 'Current Daily Price of Various Commodities from Various Markets (Mandi)',
    resourceId: '9ef84268-d588-465a-a308-a864a43d0070',
    url: 'https://data.gov.in/resource/variety-wise-daily-market-prices-data-commodity',
    disclaimer:
      'Prices are reported wholesale market observations and may vary by commodity quality, variety, market, and reporting date.',
  },
  dataFreshness: {
    fetchedAt: '2026-10-26T05:00:00Z',
    cached: false,
  },
};

const MOCK_PRICES_EMPTY: MandiPriceResponse = {
  status: 'success',
  records: [],
  pagination: {
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
  },
  filters: {
    commodity: 'UnknownCrop',
    state: null,
    district: null,
    market: null,
  },
  sorting: 'modal_price_desc',
  attribution: {
    source: 'Government of India — data.gov.in / AGMARKNET',
    datasetTitle: 'Current Daily Price of Various Commodities from Various Markets (Mandi)',
    resourceId: '9ef84268-d588-465a-a308-a864a43d0070',
    url: 'https://data.gov.in/resource/variety-wise-daily-market-prices-data-commodity',
    disclaimer:
      'Prices are reported wholesale market observations and may vary by commodity quality, variety, market, and reporting date.',
  },
  dataFreshness: {
    fetchedAt: '2026-10-26T05:00:00Z',
    cached: false,
  },
};

describe('MandiPage Component & User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getMandiFilters).mockResolvedValue(MOCK_FILTERS);
    vi.mocked(api.getMandiPrices).mockResolvedValue(MOCK_PRICES_PAGE_1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Mandi Price Tracker header, search controls, and filter bar', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Mandi Price Tracker & Market Trends/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search commodity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter by State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter by District/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sort Records By/i)).toBeInTheDocument();
  });

  it('loads and displays initial mandi price records in table and cards', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Itarsi APMC').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sidhi APMC').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Dewas APMC').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹3,050/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹2,450/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays summary metrics: total mandis, highest, lowest, and average rates', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Mandis')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Highest Modal Rate')).toBeInTheDocument();
      expect(screen.getAllByText('₹3,050').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Lowest Modal Rate')).toBeInTheDocument();
      expect(screen.getAllByText('₹2,300').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders like-for-like market price comparison card highlighting rate spread', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Market Price Comparison/i)).toBeInTheDocument();
      expect(screen.getByText('Top Reported Rate on Page')).toBeInTheDocument();
      expect(screen.getByText('Lowest Reported Rate on Page')).toBeInTheDocument();
      expect(screen.getByText(/Rate spread between top and lowest/i)).toBeInTheDocument();
      expect(screen.getByText(/₹750 \/ quintal/i)).toBeInTheDocument(); // 3050 - 2300 = 750
    });
  });

  it('supports selecting a preset commodity button', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Paddy(Common)' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Paddy(Common)' }));

    await waitFor(() => {
      expect(api.getMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          commodity: 'Paddy(Common)',
          page: 1,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('supports searching for a commodity via input form submission', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/Search commodity/i);
    fireEvent.change(input, { target: { value: 'Cotton' } });
    fireEvent.click(screen.getByRole('button', { name: /Search Market Rates/i }));

    await waitFor(() => {
      expect(api.getMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          commodity: 'Cotton',
          page: 1,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('enables district selection only after state is selected and populates relevant districts', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    const stateSelect = screen.getByLabelText(/Filter by State/i);
    const districtSelect = screen.getByLabelText(/Filter by District/i);

    expect(districtSelect).toBeDisabled();

    // Wait for available states to populate from api.getMandiFilters()
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Madhya Pradesh' })).toBeInTheDocument();
    });

    // Select Madhya Pradesh
    fireEvent.change(stateSelect, { target: { value: 'Madhya Pradesh' } });

    await waitFor(() => {
      expect(districtSelect).not.toBeDisabled();
      expect(screen.getByRole('option', { name: 'Sidhi' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Hoshangabad' })).toBeInTheDocument();
    });

    // Select Sidhi district
    fireEvent.change(districtSelect, { target: { value: 'Sidhi' } });

    await waitFor(() => {
      expect(api.getMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'Madhya Pradesh',
          district: 'Sidhi',
          page: 1,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('resets all filters when "Reset All Filters" is clicked', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    const stateSelect = screen.getByLabelText(/Filter by State/i);
    fireEvent.change(stateSelect, { target: { value: 'Madhya Pradesh' } });

    const resetBtn = screen.getByRole('button', { name: /Reset All Filters/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Filter by State/i)).toHaveValue('');
      expect(screen.getByLabelText(/Filter by District/i)).toHaveValue('');
    });
  });

  it('renders empty state when no mandi records match query', async () => {
    vi.mocked(api.getMandiPrices).mockResolvedValueOnce(MOCK_PRICES_EMPTY);

    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Mandi Records Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Filters & Show All/i })).toBeInTheDocument();
    });
  });

  it('renders error state with retry button on API failure', async () => {
    vi.mocked(api.getMandiPrices).mockRejectedValueOnce(
      new ApiError('Government Mandi data service temporarily unavailable', 502)
    );

    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Could Not Retrieve Mandi Prices')).toBeInTheDocument();
      expect(
        screen.getByText(/Government Mandi data service temporarily unavailable/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument();
    });

    // Test retry
    vi.mocked(api.getMandiPrices).mockResolvedValueOnce(MOCK_PRICES_PAGE_1);
    fireEvent.click(screen.getByRole('button', { name: /Retry Connection/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Itarsi APMC').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays transparent historical trends status without fabricating fake charts', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Historical Price Trends & Multi-Day Intelligence/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/ProFarm Data Integrity Standard:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/We do not fabricate synthetic historical trend curves/i)
      ).toBeInTheDocument();
    });
  });

  it('renders official government attribution and disclaimer links', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Government of India — data.gov.in \/ AGMARKNET/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Wholesale market observations are reported in Indian Rupees/i)
      ).toBeInTheDocument();
    });
  });

  it('handles pagination navigation (Next and Previous page)', async () => {
    render(
      <BrowserRouter>
        <MandiPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pagination-info')).toHaveTextContent(/Page 1 of 3/);
      expect(screen.getByRole('button', { name: /Next →/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /← Previous/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));

    await waitFor(() => {
      expect(api.getMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
        expect.any(AbortSignal)
      );
    });
  });
});
