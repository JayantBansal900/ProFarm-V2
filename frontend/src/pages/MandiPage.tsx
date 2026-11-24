import { tr, useLocale, locale, formatReportedDate } from '../i18n';
import { LocalizedLabel } from '../i18n/LocalizedLabel';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/api';
import type { MandiPriceResponse, StateDistrictFilter } from '../types/mandi';

type SortOrder =
  | 'modal_price_desc'
  | 'modal_price_asc'
  | 'arrival_date_desc';

type MandiRecord = MandiPriceResponse['records'][number];

const PRESET_COMMODITIES = [
  'Wheat',
  'Paddy(Common)',
  'Mustard',
  'Cotton',
  'Maize',
  'Groundnut',
  'Potato',
  'Onion',
  'Tomato',
];

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85',
  crops: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=85',
};

const formatPrice = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? '—'
    : `₹${value.toLocaleString(locale(), { maximumFractionDigits: 0 })}`;

const formatCount = (value: number) => value.toLocaleString(locale());

const shortDate = (value: string | null | undefined) => {
  return formatReportedDate(value);
};

const isAbortError = (error: unknown) =>
  error instanceof Error &&
  (error.name === 'AbortError' ||
    error.message.toLowerCase().includes('abort'));

const ArrowIcon: React.FC<{ direction?: 'left' | 'right' }> = ({
  direction = 'right',
}) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={direction === 'left' ? 'rotate-180' : ''}
  >
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="10.8" cy="10.8" r="6.8" />
    <path d="m16 16 5 5" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" />
  </svg>
);

const MarketIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 10h18M5 10v10h14V10M3 10l2-6h14l2 6M9 20v-6h6v6" />
    <path d="M7 4V2m10 2V2" />
  </svg>
);

const SectionTitle: React.FC<{
  title: string;
  eyebrow?: string;
  trailing?: React.ReactNode;
}> = ({ title, eyebrow, trailing }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      {eyebrow && (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#4A7852]">
          {tr(eyebrow)}
        </p>
      )}
      <h2 className="font-serif text-[23px] font-semibold tracking-tight text-[#193D2B] sm:text-[26px]">
        {tr(title)}
      </h2>
    </div>
    {trailing}
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
  footnote: string;
  accent?: string;
}> = ({ label, value, footnote, accent = '#295D40' }) => (
  <div className="rounded-xl border border-[#DCE6D9] bg-white px-5 py-5 sm:px-6">
    <div className="mb-4 h-1 w-9 rounded-full" style={{ backgroundColor: accent }} />
    <p className="text-xs font-semibold text-[#4A6250]">{tr(label)}</p>
    <p className="mt-2 break-words text-[26px] font-bold leading-tight tracking-tight text-[#193D2B] sm:text-[30px]">
      {value}
    </p>
    <p className="mt-2 text-xs font-medium text-[#526857]">{tr(footnote)}</p>
  </div>
);

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-[#C9D9C6] bg-[#F8FAF7] px-5 text-center">
    <p className="max-w-sm text-sm font-medium text-[#526B57]">{tr(message)}</p>
  </div>
);

/**
 * This chart compares prices reported in the CURRENT API PAGE.
 * It does not imply a time series or a national market ranking.
 */
const MarketPriceChart: React.FC<{
  records: MandiRecord[];
  commodity: string;
}> = ({ records, commodity }) => {
  const [view, setView] = useState<'highest' | 'lowest'>('highest');

  const valid = useMemo(
    () => records.filter((record) => Number.isFinite(record.modalPrice) && record.modalPrice > 0),
    [records]
  );

  const ranked = useMemo(() => {
    const sorted = [...valid].sort((a, b) =>
      view === 'highest'
        ? b.modalPrice - a.modalPrice
        : a.modalPrice - b.modalPrice
    );
    return sorted.slice(0, 7);
  }, [valid, view]);

  const maxPrice = Math.max(1, ...ranked.map((record) => record.modalPrice));

  return (
    <section className="rounded-xl border border-[#DCE6D9] bg-white p-5 sm:p-7">
      <SectionTitle
        eyebrow={tr("Market comparison")}
        title={tr("Price by Mandi")}
        trailing={
          <div className="flex rounded-lg bg-[#F0F5ED] p-1">
            <button
              type="button"
              onClick={() => setView('highest')}
              aria-pressed={view === 'highest'}
              className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                view === 'highest'
                  ? 'bg-[#285C3D] text-white shadow-sm'
                  : 'text-[#365841] hover:bg-white'
              }`}
            >{tr("Highest")}</button>
            <button
              type="button"
              onClick={() => setView('lowest')}
              aria-pressed={view === 'lowest'}
              className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                view === 'lowest'
                  ? 'bg-[#285C3D] text-white shadow-sm'
                  : 'text-[#365841] hover:bg-white'
              }`}
            >{tr("Lowest")}</button>
          </div>
        }
      />

      <p className="mt-2 text-xs font-medium text-[#516956]">
        {tr(commodity) || tr("Selected commodities")}{tr("· up to 7 markets from this results page")}</p>

      <div className="mt-7">
        {ranked.length === 0 ? (
          <EmptyChart message="No valid modal prices are available for comparison." />
        ) : (
          <div className="space-y-5">
            {ranked.map((record, index) => {
              const percent = (record.modalPrice / maxPrice) * 100;

              return (
                <div
                  key={`${record.id}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_90px] items-center gap-x-4 gap-y-2 sm:grid-cols-[155px_minmax(0,1fr)_100px]"
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-xs font-bold text-[#244731]"
                      title={tr(record.market)}
                    >
                      {tr(record.market)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#627365]">
                      {tr(record.district)}
                    </p>
                  </div>

                  <div className="order-3 col-span-2 h-3 overflow-hidden rounded-full bg-[#E8EFE5] sm:order-none sm:col-span-1">
                    <div
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-[#2D704A]' : 'bg-[#94B69A]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="text-end text-sm font-bold tabular-nums text-[#1C412D]">
                    {formatPrice(record.modalPrice)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-7 border-t border-[#E4EBE1] pt-4 text-[11px] font-medium text-[#617264]">{tr("Modal prices in ₹/quintal. Varieties, grades and arrival dates may differ between markets.")}</p>
    </section>
  );
};

const PriceRangeChart: React.FC<{ records: MandiRecord[] }> = ({ records }) => {
  const entries = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.minPrice !== null &&
            record.maxPrice !== null &&
            Number.isFinite(record.minPrice) &&
            Number.isFinite(record.maxPrice) &&
            record.maxPrice >= record.minPrice
        )
        .slice(0, 6),
    [records]
  );

  const max = Math.max(
    1,
    ...entries.map((record) => record.maxPrice ?? 0)
  );

  return (
    <section className="rounded-xl border border-[#DCE6D9] bg-white p-5 sm:p-7">
      <SectionTitle
        eyebrow={tr("Trading range")}
        title={tr("Minimum to Maximum")}
      />

      <p className="mt-2 text-xs font-medium text-[#516956]">{tr("Reported price bands for up to 6 visible records")}</p>

      <div className="mt-7">
        {entries.length === 0 ? (
          <EmptyChart message="No complete minimum and maximum price ranges were reported." />
        ) : (
          <div className="space-y-5">
            {entries.map((record, index) => {
              const low = record.minPrice ?? 0;
              const high = record.maxPrice ?? 0;
              const start = (low / max) * 100;
              const width = ((high - low) / max) * 100;

              return (
                <div key={`${record.id}-${index}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p
                      className="min-w-0 truncate text-xs font-bold text-[#294A35]"
                      title={tr(record.market)}
                    >
                      {tr(record.market)}
                    </p>
                    <p className="shrink-0 text-[11px] font-semibold tabular-nums text-[#506754]">
                      {formatPrice(low)} – {formatPrice(high)}
                    </p>
                  </div>

                  <div className="relative h-3 rounded-full bg-[#EEF3EB]">
                    <div
                      className="absolute h-3 rounded-full bg-[#85B3A0]"
                      style={{
                        left: `${start}%`,
                        width: `${Math.max(width, 0.5)}%`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-full bg-[#285C3D]"
                      style={{ left: `${(record.modalPrice / max) * 100}%` }}
                      title={tr("Modal: {{v0}}", { v0: formatPrice(record.modalPrice) })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-5 border-t border-[#E4EBE1] pt-4 text-[11px] font-semibold text-[#536957]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-full bg-[#85B3A0]" />{tr("Min–max range")}</span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-[3px] rounded-full bg-[#285C3D]" />{tr("Modal price")}</span>
      </div>
    </section>
  );
};

export const MandiPage: React.FC = () => {
  useLocale();
  const [commodity, setCommodity] = useState('Wheat');
  const [searchInput, setSearchInput] = useState('Wheat');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('modal_price_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [mandiData, setMandiData] = useState<MandiPriceResponse | null>(null);
  const [availableStates, setAvailableStates] = useState<StateDistrictFilter[]>([]);
  const [popularCommodities, setPopularCommodities] = useState<string[]>(PRESET_COMMODITIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .getMandiFilters()
      .then((response) => {
        if (cancelled || response.status !== 'success') return;

        setAvailableStates(response.states || []);

        if (response.commodities?.length) {
          setPopularCommodities(response.commodities);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Unable to load mandi filter options:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    api
      .getMandiPrices(
        {
          commodity: commodity.trim() || undefined,
          state: selectedState || undefined,
          district: selectedDistrict || undefined,
          page: currentPage,
          limit: pageSize,
          sort: sortOrder,
        },
        controller.signal
      )
      .then((response) => {
        if (cancelled) return;
        setMandiData(response);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled || isAbortError(err)) return;

        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Unable to retrieve mandi prices. Please try again.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    commodity,
    selectedState,
    selectedDistrict,
    sortOrder,
    currentPage,
    refreshTrigger,
  ]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = searchInput.trim();

    if (next !== commodity) {
      setCommodity(next);
      setCurrentPage(1);
    }
  };

  const handleSelectPreset = (name: string) => {
    setSearchInput(name);
    setCommodity(name);
    setCurrentPage(1);
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('');
    setCurrentPage(1);
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortOrder) => {
    setSortOrder(sort);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('Wheat');
    setCommodity('Wheat');
    setSelectedState('');
    setSelectedDistrict('');
    setSortOrder('modal_price_desc');
    setCurrentPage(1);
  };

  const handleRetry = useCallback(() => {
    setRefreshTrigger((value) => value + 1);
  }, []);

  const currentDistricts = useMemo(() => {
    if (!selectedState) return [];
    const match = availableStates.find(
      (item) => item.state.toLowerCase() === selectedState.toLowerCase()
    );
    return match?.districts || [];
  }, [availableStates, selectedState]);

  const records = mandiData?.records || [];

  const validRecords = records.filter(
    (record) => Number.isFinite(record.modalPrice) && record.modalPrice > 0
  );

  const prices = validRecords.map((record) => record.modalPrice);

  const highestRecord =
    validRecords.length > 0
      ? validRecords.reduce((a, b) =>
          a.modalPrice >= b.modalPrice ? a : b
        )
      : null;

  const lowestRecord =
    validRecords.length > 0
      ? validRecords.reduce((a, b) =>
          a.modalPrice <= b.modalPrice ? a : b
        )
      : null;

  const averagePrice =
    prices.length > 0
      ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      : null;

  const priceSpread =
    highestRecord && lowestRecord
      ? highestRecord.modalPrice - lowestRecord.modalPrice
      : null;

  const totalRecords = mandiData?.pagination.totalRecords ?? records.length;
  const totalPages = mandiData?.pagination.totalPages ?? 1;

  const freshness = mandiData?.dataFreshness;
  const latestVisibleDate = records[0]?.arrivalDate || '—';

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6 pb-14 text-[#203B29]">
      {/* Page heading */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-[#536758]">
            <Link to="/" className="hover:text-[#245F3C]">{tr("Home")}</Link>
            <span>/</span>
            <span className="text-[#285F3E]">{tr("Mandi Prices")}</span>
          </nav>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#173C29] sm:text-4xl">{tr("Mandi Prices & Market Trends")}</h1>

          <p className="mt-2 text-sm text-[#425B49]">{tr("Explore wholesale crop prices reported across Indian markets.")}</p>
        </div>

        <span className="flex items-center gap-2 rounded-full border border-[#D2E2CF] bg-[#F0F6ED] px-3 py-2 text-xs font-bold text-[#326243]">
          <span className="h-2 w-2 rounded-full bg-[#659B6B]" />{tr("AGMARKNET data")}</span>
      </header>

      {/* Image hero */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#1B452D]">
        <img
          src={IMAGES.hero}
          alt={tr("Agricultural landscape")}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#103A26]/95 via-[#17452D]/85 to-[#17452D]/25" />

        <div className="relative grid min-h-[265px] gap-8 p-6 sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-xl text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D9EED7]">{tr("Agricultural market intelligence")}</p>

            <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{tr("Know the market.")}<br />{tr("Compare the price.")}</h2>

            <p className="mt-4 max-w-md text-sm font-medium leading-6 text-[#E2EEE1]">{tr("Search commodities, compare mandi rates and review reported price ranges.")}</p>
          </div>

          <div className="rounded-xl border border-white/25 bg-[#163D29]/70 p-5 text-white backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-2.5">
                <MarketIcon />
              </div>

              <div>
                <p className="text-xs font-medium text-[#D8EAD7]">{tr("Current selection")}</p>
                <p className="mt-0.5 text-lg font-bold">
                  {tr(commodity) || tr("All commodities")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-5 border-t border-white/20 pt-5">
              <div>
                <p className="text-xs text-[#D8EAD7]">{tr("Matching records")}</p>
                <p className="mt-1 text-2xl font-bold">
                  {isLoading || error ? '—' : formatCount(totalRecords)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#D8EAD7]">{tr("Selected region")}</p>
                <p className="mt-2 truncate text-sm font-bold">
                  {selectedDistrict || selectedState || tr("All India")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-xl border border-[#DCE6D9] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1C422D]">{tr("Find Market Rates")}</h2>
            <p className="mt-1 text-xs font-medium text-[#5B705F]">{tr("Search by commodity and narrow results by location.")}</p>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-bold text-[#286241] hover:text-[#17492C] disabled:opacity-50"
          >
            <RefreshIcon />{tr("Refresh rates")}</button>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6B816E]">
              <SearchIcon />
            </span>

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={tr("Search wheat, cotton, onion, mustard...")}
              aria-label={tr("Search commodity")}
              className="w-full rounded-lg border border-[#D4E0D1] bg-[#F8FAF7] py-3 ps-11 pe-4 text-sm font-medium text-[#203F2C] placeholder:text-[#708171] outline-none focus:border-[#649775] focus:ring-2 focus:ring-[#649775]/15"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#285C3D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1D4B30]"
          >{tr("Search rates")}<ArrowIcon />
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold text-[#526B57]">{tr("Popular:")}</span>

          {popularCommodities.slice(0, 9).map((crop) => {
            const active = crop.toLowerCase() === commodity.toLowerCase();

            return (
              <button
                key={crop}
                type="button"
                onClick={() => handleSelectPreset(crop)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'border-[#285C3D] bg-[#285C3D] text-white'
                    : 'border-[#D7E4D4] bg-[#F5F8F3] text-[#385842] hover:border-[#A9C7AA]'
                }`}
              >
                <LocalizedLabel text={crop} />
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 border-t border-[#E5ECE3] pt-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr_auto] lg:items-end">
          <div>
            <label
              htmlFor="mandi-state"
              className="mb-2 block text-xs font-bold text-[#34543E]"
            >{tr("State")}</label>
            <select
              id="mandi-state"
              value={selectedState}
              onChange={(event) => handleStateChange(event.target.value)}
              className="w-full rounded-lg border border-[#D6E2D3] bg-[#FAFCF9] px-3 py-3 text-sm font-medium text-[#274833] outline-none focus:border-[#649775]"
            >
              <option value="">{tr("All states")}</option>
              {availableStates.map((item) => (
                <option key={item.state} value={item.state}>
                  {tr(item.state)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mandi-district"
              className="mb-2 block text-xs font-bold text-[#34543E]"
            >{tr("District")}</label>
            <select
              id="mandi-district"
              value={selectedDistrict}
              onChange={(event) => handleDistrictChange(event.target.value)}
              disabled={!selectedState}
              className="w-full rounded-lg border border-[#D6E2D3] bg-[#FAFCF9] px-3 py-3 text-sm font-medium text-[#274833] outline-none focus:border-[#649775] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <option value="">
                {selectedState ? tr("All districts") : tr("Select state first")}
              </option>
              {currentDistricts.map((district) => (
                <option key={district} value={district}>
                  {tr(district)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mandi-sort"
              className="mb-2 block text-xs font-bold text-[#34543E]"
            >{tr("Sort by")}</label>
            <select
              id="mandi-sort"
              value={sortOrder}
              onChange={(event) =>
                handleSortChange(event.target.value as SortOrder)
              }
              className="w-full rounded-lg border border-[#D6E2D3] bg-[#FAFCF9] px-3 py-3 text-sm font-medium text-[#274833] outline-none focus:border-[#649775]"
            >
              <option value="modal_price_desc">{tr("Highest modal price")}</option>
              <option value="modal_price_asc">{tr("Lowest modal price")}</option>
              <option value="arrival_date_desc">{tr("Most recent arrival")}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-lg border border-[#C9D9C7] bg-white px-5 py-3 text-sm font-bold text-[#365B42] hover:bg-[#F2F7F0]"
          >{tr("Reset filters")}</button>
        </div>
      </section>

      {/* Loading, error and empty states */}
      {isLoading ? (
        <section
          role="status"
          className="rounded-xl border border-[#DCE6D9] bg-white px-6 py-20 text-center"
        >
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E0EADD] border-t-[#2E704A]" />
          <h2 className="mt-5 text-base font-bold text-[#234B33]">{tr("Loading market prices")}</h2>
          <p className="mt-2 text-sm text-[#536C59]">{tr("Retrieving reported wholesale rates...")}</p>
        </section>
      ) : error ? (
        <section
          role="alert"
          className="rounded-xl border border-red-200 bg-white p-8"
        >
          <h2 className="text-lg font-bold text-red-800">{tr("Market data unavailable")}</h2>
          <p className="mt-2 text-sm text-red-700">{tr(error)}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 rounded-lg bg-[#285C3D] px-5 py-2.5 text-sm font-bold text-white"
          >{tr("Try again")}</button>
        </section>
      ) : records.length === 0 ? (
        <section className="rounded-xl border border-[#DCE6D9] bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#EDF5EA] text-[#285C3D]">
            <MarketIcon />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#1E432E]">{tr("No market records found")}</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-[#4C6552]">{tr("Try another commodity or broaden the state and district filters.")}</p>

          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-6 rounded-lg bg-[#285C3D] px-5 py-3 text-sm font-bold text-white"
          >{tr("Reset filters")}</button>
        </section>
      ) : (
        <>
          {/* Statistics */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label={tr("Matching records")}
              value={formatCount(totalRecords)}
              footnote={tr("{{v0}} shown on this page", { v0: records.length })}
              accent="#3E7B51"
            />
            <MetricCard
              label={tr("Highest modal price")}
              value={formatPrice(highestRecord?.modalPrice)}
              footnote={tr("Visible records · ₹/quintal")}
              accent="#2D7651"
            />
            <MetricCard
              label={tr("Lowest modal price")}
              value={formatPrice(lowestRecord?.modalPrice)}
              footnote={tr("Visible records · ₹/quintal")}
              accent="#C08B48"
            />
            <MetricCard
              label={tr("Average modal price")}
              value={formatPrice(averagePrice)}
              footnote={tr("Visible records · ₹/quintal")}
              accent="#6C91A0"
            />
          </section>

          {/* Chart pair */}
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <MarketPriceChart records={records} commodity={commodity} />
            <PriceRangeChart records={records} />
          </div>

          {/* Market spread */}
          {highestRecord && lowestRecord && validRecords.length > 1 && (
            <section className="overflow-hidden rounded-xl border border-[#D6E5D3] bg-[#F0F6EC]">
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#477A4F]">{tr("Visible market comparison")}</p>

                  <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1B442D]">{tr("Price Difference")}</h2>

                  <p className="mt-3 text-[36px] font-bold tracking-tight text-[#1B442D]">
                    {formatPrice(priceSpread)}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#506C55]">{tr("Spread per quintal on this page")}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#D6E5D3] bg-white p-5">
                    <p className="text-xs font-bold text-[#467B4E]">{tr("Highest reported")}</p>
                    <p className="mt-3 text-xl font-bold text-[#1D452E]">
                      {formatPrice(highestRecord.modalPrice)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#2B4B36]">
                      {tr(highestRecord.market)}
                    </p>
                    <p className="mt-1 text-xs text-[#5B6D5E]">
                      {tr(highestRecord.district)}, {tr(highestRecord.state)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#617262]">
                      {highestRecord.variety} · {highestRecord.grade}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#D6E5D3] bg-white p-5">
                    <p className="text-xs font-bold text-[#A27539]">{tr("Lowest reported")}</p>
                    <p className="mt-3 text-xl font-bold text-[#1D452E]">
                      {formatPrice(lowestRecord.modalPrice)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#2B4B36]">
                      {tr(lowestRecord.market)}
                    </p>
                    <p className="mt-1 text-xs text-[#5B6D5E]">
                      {tr(lowestRecord.district)}, {tr(lowestRecord.state)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#617262]">
                      {lowestRecord.variety} · {lowestRecord.grade}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Records */}
          <section className="overflow-hidden rounded-xl border border-[#DCE6D9] bg-white">
            <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-7">
              <SectionTitle
                eyebrow={tr("Wholesale market records")}
                title={tr("Mandi Price Directory")}
              />

              <div className="text-end">
                <p className="text-xs font-bold text-[#34583F]">
                  {formatCount(totalRecords)}{tr("matching records")}</p>
                <p className="mt-1 text-xs text-[#637465]">{tr('Page {{page}} of {{total}}', { page: currentPage, total: totalPages })}
                </p>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] border-collapse text-start">
                <thead className="bg-[#F1F6EF]">
                  <tr className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#3C5D45]">
                    <th className="px-5 py-4 sm:ps-7">{tr("Mandi / Market")}</th>
                    <th className="px-4 py-4">{tr("Commodity")}</th>
                    <th className="px-4 py-4">{tr("Grade")}</th>
                    <th className="px-4 py-4 text-end">{tr("Modal Price")}</th>
                    <th className="px-4 py-4 text-end">{tr("Min–Max")}</th>
                    <th className="px-4 py-4 text-end">{tr("Arrival")}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5ECE3]">
                  {records.map((record, index) => (
                    <tr
                      key={`${record.id}-${index}`}
                      className="transition hover:bg-[#F8FBF7]"
                    >
                      <td className="px-5 py-4 sm:ps-7">
                        <p className="text-sm font-bold text-[#1D412C]">
                          {tr(record.market)}
                        </p>
                        <p className="mt-1 text-xs text-[#5C705F]">
                          {tr(record.district)}, {tr(record.state)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-[#294936]">
                          <LocalizedLabel text={record.commodity} />
                        </p>
                        <p className="mt-1 text-xs text-[#637566]">
                          {record.variety || '—'}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-[#EEF4EB] px-2.5 py-1.5 text-xs font-semibold text-[#42634A]">
                          {record.grade || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-end">
                        <p className="text-base font-bold tabular-nums text-[#236342]">
                          {formatPrice(record.modalPrice)}
                        </p>
                        <p className="mt-1 text-[11px] text-[#617464]">{tr("/ quintal")}</p>
                      </td>

                      <td className="px-4 py-4 text-end text-xs font-semibold tabular-nums text-[#425C48]">
                        {record.minPrice !== null && record.maxPrice !== null
                          ? `${formatPrice(record.minPrice)} – ${formatPrice(record.maxPrice)}`
                          : '—'}
                      </td>

                      <td className="px-4 py-4 text-end text-xs font-semibold text-[#4D6552]">
                        {shortDate(record.arrivalDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile records */}
            <div className="space-y-3 px-4 pb-5 md:hidden">
              {records.map((record, index) => (
                <article
                  key={`${record.id}-${index}`}
                  className="rounded-xl border border-[#E0E9DD] bg-[#FBFCFA] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1E442E]">
                        {tr(record.market)}
                      </h3>
                      <p className="mt-1 text-xs text-[#5D715F]">
                        {tr(record.district)}, {tr(record.state)}
                      </p>
                    </div>

                    <div className="shrink-0 text-end">
                      <p className="text-lg font-bold text-[#256643]">
                        {formatPrice(record.modalPrice)}
                      </p>
                      <p className="text-[10px] text-[#657768]">{tr("/ quintal")}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E1EADF] pt-4 text-xs">
                    <div>
                      <p className="text-[#657768]">{tr("Commodity")}</p>
                      <p className="mt-1 font-bold text-[#294A35]">
                        <LocalizedLabel text={record.commodity} />
                      </p>
                      <p className="mt-0.5 text-[#5B6F5E]">
                        {record.variety}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#657768]">{tr("Grade")}</p>
                      <p className="mt-1 font-bold text-[#294A35]">
                        {record.grade || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#657768]">{tr("Price range")}</p>
                      <p className="mt-1 font-bold text-[#294A35]">
                        {record.minPrice !== null && record.maxPrice !== null
                          ? `${formatPrice(record.minPrice)} – ${formatPrice(record.maxPrice)}`
                          : '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#657768]">{tr("Arrival date")}</p>
                      <p className="mt-1 font-bold text-[#294A35]">
                        {shortDate(record.arrivalDate)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2EAE0] bg-[#FBFCFA] px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-2 rounded-lg border border-[#D1DFCE] bg-white px-4 py-2.5 text-xs font-bold text-[#31563D] hover:bg-[#F1F6EF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowIcon direction="left" />{tr("Previous")}</button>

                <span
                  data-testid="pagination-info"
                  className="text-xs font-bold text-[#4C6552]"
                >{tr('Page {{page}} of {{total}}', { page: currentPage, total: totalPages })}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-2 rounded-lg border border-[#D1DFCE] bg-white px-4 py-2.5 text-xs font-bold text-[#31563D] hover:bg-[#F1F6EF] disabled:cursor-not-allowed disabled:opacity-40"
                >{tr("Next")}<ArrowIcon />
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {/* Source status and visual feature */}
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-[#DCE6D9] bg-white p-5 sm:p-7">
          <SectionTitle
            eyebrow={tr("Data coverage")}
            title={tr("Historical Price Trends")}
          />

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-[#D9E6D6] bg-[#F3F8F0] p-4">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6C9D72]" />

            <div>
              <p className="text-sm font-bold text-[#254A32]">{tr("Daily market snapshots")}</p>
              <p className="mt-1 text-xs leading-5 text-[#4C6652]">{tr("The current feed provides reported daily prices, not a verified multi-week historical series. Historical trend charts will require accumulated dated records.")}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#E0E9DE] p-4">
              <p className="text-xs font-medium text-[#526B58]">{tr("Example arrival date")}</p>
              <p className="mt-2 text-lg font-bold text-[#214730]">
                {shortDate(latestVisibleDate)}
              </p>
            </div>

            <div className="rounded-lg border border-[#E0E9DE] p-4">
              <p className="text-xs font-medium text-[#526B58]">{tr("Data retrieval")}</p>
              <p className="mt-2 text-lg font-bold text-[#214730]">
                {freshness ? freshness.cached ? tr("Cached") : tr("Fetched") : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[290px] overflow-hidden rounded-xl bg-[#204A31]">
          <img
            src={IMAGES.crops}
            alt={tr("Agricultural field at sunset")}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#103B28]/90 via-[#103B28]/55 to-[#103B28]/15" />

          <div className="relative flex h-full min-h-[290px] flex-col justify-end p-7 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D9ECD6]">{tr("ProFarm Market Intelligence")}</p>

            <h2 className="mt-3 max-w-sm font-serif text-3xl font-semibold leading-tight">{tr("Better prices begin with better information.")}</h2>

            <p className="mt-3 max-w-xs text-xs font-medium leading-5 text-[#E1EFE0]">{tr("Compare reported rates before choosing where to sell.")}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-start justify-between gap-4 border-t border-[#DCE6D9] pt-5 text-xs text-[#506753]">
        <div className="max-w-3xl space-y-2">
          <p>
            <span className="font-bold text-[#2D5138]">{tr("Source:")}</span>{' '}
            <a
              href="https://data.gov.in/resource/variety-wise-daily-market-prices-data-commodity"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#286541] underline underline-offset-2"
            >{tr("Government of India · AGMARKNET / data.gov.in")}</a>
          </p>

          <p className="leading-5">{tr("Prices are in ₹ per quintal (100 kg). Compare variety, grade, reporting date, transport and handling costs before making a sale.")}</p>
        </div>

        {freshness && (
          <p className="text-xs font-semibold text-[#536B58]">{tr("Retrieved:")}{' '}
            {new Date(freshness.fetchedAt).toLocaleString(locale(), {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        )}
      </footer>
    </div>
  );
};
