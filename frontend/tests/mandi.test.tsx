
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';
import { MandiPage } from '../src/pages/MandiPage';
import { api, ApiError } from '../src/api/api';

import type {
  MandiPriceResponse,
  MandiFilterOptions,
} from '../src/types/mandi';

vi.mock('../src/api/api', () => ({
  api: {
    getMandiPrices: vi.fn(),
    getMandiFilters: vi.fn(),
    getMandiTrends: vi.fn(),
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

const MOCK_FILTERS: MandiFilterOptions = {
  status: 'success',
  commodities: [
    'Wheat',
    'Paddy(Common)',
    'Mustard',
    'Cotton',
    'Maize',
    'Potato',
    'Onion',
  ],
  states: [
    {
      state: 'Madhya Pradesh',
      districts: [
        'Sidhi',
        'Hoshangabad',
        'Dewas',
        'Bhopal',
      ],
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
    datasetTitle:
      'Current Daily Price of Various Commodities from Various Markets (Mandi)',
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
  ...MOCK_PRICES_PAGE_1,
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
};

const mockedGetMandiPrices = vi.mocked(api.getMandiPrices);
const mockedGetMandiFilters = vi.mocked(api.getMandiFilters);

function renderMandiPage() {
  return render(
    <BrowserRouter>
      <MandiPage />
    </BrowserRouter>
  );
}

async function waitForMarketRecords() {
  await screen.findByRole('heading', {
    name: 'Mandi Price Directory',
  });

  await waitFor(() => {
    expect(
      screen.getAllByText('Itarsi APMC').length
    ).toBeGreaterThanOrEqual(1);
  });
}

describe('MandiPage Component & User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedGetMandiFilters.mockResolvedValue(MOCK_FILTERS);

    mockedGetMandiPrices.mockImplementation(async (params) => {
      const requestedPage = params?.page ?? 1;

      return {
        ...MOCK_PRICES_PAGE_1,
        pagination: {
          ...MOCK_PRICES_PAGE_1.pagination,
          page: requestedPage,
        },
      };
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders Mandi page heading, search controls, and filters', async () => {
    renderMandiPage();

    expect(
      screen.getByRole('heading', {
        name: 'Mandi Prices & Market Trends',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('searchbox', {
        name: 'Search commodity',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        /Search wheat, cotton, onion, mustard/i
      )
    ).toBeInTheDocument();

    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('District')).toBeDisabled();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Search rates' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Reset filters' })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetMandiFilters).toHaveBeenCalled();
    });

    await waitForMarketRecords();
  });

  it('loads and displays initial mandi price records in table and cards', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    expect(
      screen.getAllByText('Itarsi APMC').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('Sidhi APMC').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('Dewas APMC').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('₹3,050').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('₹2,450').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays matching records, highest, lowest, and average modal prices', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    expect(
      screen.getAllByText('Matching records').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('45').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('Highest modal price').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('Lowest modal price').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getByText('Average modal price')
    ).toBeInTheDocument();

    expect(
      screen.getAllByText('₹3,050').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText('₹2,300').length
    ).toBeGreaterThanOrEqual(1);

    // (3050 + 2450 + 2300) / 3 = 2600.
    expect(
      screen.getAllByText('₹2,600').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders market price comparison and correct rate spread', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    expect(
      screen.getByRole('heading', {
        name: 'Price Difference',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText('Visible market comparison')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Highest reported')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Lowest reported')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Spread per quintal on this page')
    ).toBeInTheDocument();

    // 3050 - 2300 = 750.
    expect(screen.getByText('₹750')).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: 'Price by Mandi',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: 'Minimum to Maximum',
      })
    ).toBeInTheDocument();
  });

  it('supports selecting a preset commodity button', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Paddy(Common)',
      })
    );

    await waitFor(() => {
      expect(mockedGetMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          commodity: 'Paddy(Common)',
          page: 1,
        }),
        expect.any(AbortSignal)
      );
    });

    expect(
      screen.getByRole('searchbox', {
        name: 'Search commodity',
      })
    ).toHaveValue('Paddy(Common)');
  });

  it('supports searching for a commodity via form submission', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    const input = screen.getByRole('searchbox', {
      name: 'Search commodity',
    });

    fireEvent.change(input, {
      target: { value: 'Cotton' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Search rates',
      })
    );

    await waitFor(() => {
      expect(mockedGetMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          commodity: 'Cotton',
          page: 1,
        }),
        expect.any(AbortSignal)
      );
    });

    expect(input).toHaveValue('Cotton');
  });

  it('enables district selection after state selection and populates districts', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: 'Madhya Pradesh',
        })
      ).toBeInTheDocument();
    });

    const stateSelect = screen.getByLabelText('State');
    const districtSelect = screen.getByLabelText('District');

    expect(districtSelect).toBeDisabled();

    fireEvent.change(stateSelect, {
      target: { value: 'Madhya Pradesh' },
    });

    await waitFor(() => {
      expect(districtSelect).not.toBeDisabled();

      expect(
        screen.getByRole('option', {
          name: 'Sidhi',
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('option', {
          name: 'Hoshangabad',
        })
      ).toBeInTheDocument();
    });

    fireEvent.change(districtSelect, {
      target: { value: 'Sidhi' },
    });

    await waitFor(() => {
      expect(mockedGetMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'Madhya Pradesh',
          district: 'Sidhi',
          page: 1,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('resets commodity, state, district, and sort filters', async () => {
    renderMandiPage();
    await waitForMarketRecords();

    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: 'Madhya Pradesh',
        })
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('State'), {
      target: { value: 'Madhya Pradesh' },
    });

    fireEvent.change(screen.getByLabelText('District'), {
      target: { value: 'Sidhi' },
    });

    fireEvent.change(screen.getByLabelText('Sort by'), {
      target: { value: 'modal_price_asc' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reset filters',
      })
    );

    await waitFor(() => {
      expect(screen.getByLabelText('State')).toHaveValue('');
      expect(screen.getByLabelText('District')).toHaveValue('');
      expect(screen.getByLabelText('Sort by')).toHaveValue(
        'modal_price_desc'
      );

      expect(
        screen.getByRole('searchbox', {
          name: 'Search commodity',
        })
      ).toHaveValue('Wheat');
    });

    expect(screen.getByLabelText('District')).toBeDisabled();
  });

  it('renders empty state when no mandi records match the query', async () => {
    mockedGetMandiPrices.mockResolvedValueOnce(
      MOCK_PRICES_EMPTY
    );

    renderMandiPage();

    await screen.findByRole('heading', {
      name: 'No market records found',
    });

    expect(
      screen.getByText(
        /Try another commodity or broaden the state and district filters/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole('button', {
        name: 'Reset filters',
      }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders API error and retries successfully', async () => {
    mockedGetMandiPrices.mockRejectedValueOnce(
      new ApiError(
        'Government Mandi data service temporarily unavailable',
        502
      )
    );

    renderMandiPage();

    await screen.findByRole('heading', {
      name: 'Market data unavailable',
    });

    expect(
      screen.getByRole('alert')
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Government Mandi data service temporarily unavailable/i
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Try again',
      })
    );

    await waitFor(() => {
      expect(mockedGetMandiPrices).toHaveBeenCalledTimes(2);
    });

    await waitForMarketRecords();
  });

  it('displays honest historical trends coverage without fabricated data', async () => {
    renderMandiPage();

    expect(
      screen.getByRole('heading', {
        name: 'Historical Price Trends',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText('Daily market snapshots')
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /The current feed provides reported daily prices/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Historical trend charts will require accumulated dated records/i
      )
    ).toBeInTheDocument();

    await waitForMarketRecords();

    expect(
      screen.getByText('Example arrival date')
    ).toBeInTheDocument();

    expect(
      screen.getAllByText('25/10/2026').length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getByText('Data retrieval')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Fetched')
    ).toBeInTheDocument();

    expect(api.getMandiTrends).not.toHaveBeenCalled();
  });

  it('renders official government source and wholesale price disclaimer', async () => {
    renderMandiPage();

    const sourceLink = screen.getByRole('link', {
      name: 'Government of India · AGMARKNET / data.gov.in',
    });

    expect(sourceLink).toHaveAttribute(
      'href',
      'https://data.gov.in/resource/variety-wise-daily-market-prices-data-commodity'
    );

    expect(sourceLink).toHaveAttribute(
      'target',
      '_blank'
    );

    expect(
      screen.getByText(
        /Prices are in ₹ per quintal \(100 kg\)/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Compare variety, grade, reporting date, transport and handling costs/i
      )
    ).toBeInTheDocument();

    await waitForMarketRecords();
  });

  it('handles pagination navigation to next and previous pages', async () => {
    renderMandiPage();

    // Wait until the initial API response has rendered.
    await waitForMarketRecords();

    expect(
      screen.getByTestId('pagination-info')
    ).toHaveTextContent('Page 1 of 3');

    expect(
      screen.getByRole('button', {
        name: 'Previous',
      })
    ).toBeDisabled();

    expect(
      screen.getByRole('button', {
        name: 'Next',
      })
    ).not.toBeDisabled();

    // Navigate to page 2.
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Next',
      })
    );

    // Verify the page 2 API request.
    await waitFor(() => {
      expect(mockedGetMandiPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          commodity: 'Wheat',
        }),
        expect.any(AbortSignal)
      );
    });

    // Wait for page 2 to finish loading.
    // The results and pagination controls are remounted.
    await waitFor(() => {
      expect(
        screen.getByTestId('pagination-info')
      ).toHaveTextContent('Page 2 of 3');
    });

    // IMPORTANT: Get a fresh reference to the Previous button.
    const previousOnPageTwo = screen.getByRole('button', {
      name: 'Previous',
    });

    expect(previousOnPageTwo).not.toBeDisabled();

    const callsBeforePrevious =
      mockedGetMandiPrices.mock.calls.length;

    // Navigate back to page 1 using the current DOM element.
    fireEvent.click(previousOnPageTwo);

    // Verify the return request.
    await waitFor(() => {
      expect(
        mockedGetMandiPrices.mock.calls.length
      ).toBeGreaterThan(callsBeforePrevious);

      expect(mockedGetMandiPrices).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          commodity: 'Wheat',
        }),
        expect.any(AbortSignal)
      );
    });

    // Wait for page 1 to finish loading again.
    await waitFor(() => {
      expect(
        screen.getByTestId('pagination-info')
      ).toHaveTextContent('Page 1 of 3');
    });

    // Re-query both buttons after the final render.
    expect(
      screen.getByRole('button', {
        name: 'Previous',
      })
    ).toBeDisabled();

    expect(
      screen.getByRole('button', {
        name: 'Next',
      })
    ).not.toBeDisabled();
  });
});
