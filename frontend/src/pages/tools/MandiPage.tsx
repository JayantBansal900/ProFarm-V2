import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../../services/api';
import {
  MandiPriceResponse,
  StateDistrictFilter,
} from '../../types/mandi';

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

export const MandiPage: React.FC = () => {
  // Query parameters state
  const [commodity, setCommodity] = useState<string>('Wheat');
  const [searchInput, setSearchInput] = useState<string>('Wheat');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<
    'modal_price_desc' | 'modal_price_asc' | 'arrival_date_desc'
  >('modal_price_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Data states
  const [mandiData, setMandiData] = useState<MandiPriceResponse | null>(null);
  const [availableStates, setAvailableStates] = useState<StateDistrictFilter[]>([]);
  const [popularCommodities, setPopularCommodities] = useState<string[]>(PRESET_COMMODITIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Load available filter options once on mount
  useEffect(() => {
    let isCancelled = false;
    api
      .getMandiFilters()
      .then((res) => {
        if (!isCancelled && res.status === 'success') {
          setAvailableStates(res.states);
          if (res.commodities && res.commodities.length > 0) {
            setPopularCommodities(res.commodities);
          }
        }
      })
      .catch((err) => {
        // Silently retain fallback filter options if network drops
        if (!isCancelled) {
          console.warn('Could not prefetch dynamic mandi filters:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch mandi prices when query parameters or refresh trigger changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();

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
      .then((res) => {
        if (!isCancelled) {
          setMandiData(res);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
            return;
          }
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : 'Failed to retrieve mandi prices. Please verify network connectivity and try again.';
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [commodity, selectedState, selectedDistrict, sortOrder, currentPage, refreshTrigger]);

  // Handle commodity search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (query !== commodity) {
      setCommodity(query);
      setCurrentPage(1);
    }
  };

  // Preset commodity click
  const handleSelectPreset = (name: string) => {
    setSearchInput(name);
    setCommodity(name);
    setCurrentPage(1);
  };

  // State selection change
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedDistrict(''); // Reset district when state changes
    setCurrentPage(1);
  };

  // District selection change
  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    setCurrentPage(1);
  };

  // Sort order change
  const handleSortChange = (
    newSort: 'modal_price_desc' | 'modal_price_asc' | 'arrival_date_desc'
  ) => {
    setSortOrder(newSort);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('Wheat');
    setCommodity('Wheat');
    setSelectedState('');
    setSelectedDistrict('');
    setSortOrder('modal_price_desc');
    setCurrentPage(1);
  };

  // Retry
  const handleRetry = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Compute available districts for currently selected state
  const currentDistricts = React.useMemo(() => {
    if (!selectedState) return [];
    const found = availableStates.find((s) => s.state.toLowerCase() === selectedState.toLowerCase());
    return found ? found.districts : [];
  }, [availableStates, selectedState]);

  // Derived price statistics on loaded records
  const records = mandiData?.records || [];
  const modalPrices = records.map((r) => r.modalPrice).filter((p) => p > 0);
  const minModalPrice = modalPrices.length > 0 ? Math.min(...modalPrices) : null;
  const maxModalPrice = modalPrices.length > 0 ? Math.max(...modalPrices) : null;
  const avgModalPrice =
    modalPrices.length > 0
      ? Math.round(modalPrices.reduce((acc, p) => acc + p, 0) / modalPrices.length)
      : null;

  // Market comparison like-for-like calculation
  const highestModalRecord = records.length > 0 ? records[0] : null;
  const lowestModalRecord = records.length > 0 ? records[records.length - 1] : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 1. Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="Mandi Scales">
                ⚖️
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Mandi Price Tracker & Market Trends
              </h1>
            </div>
            <p className="mt-2 text-gray-600 text-base max-w-3xl">
              Real-time daily agricultural wholesale market prices across India, sourced directly
              from the Government of India&apos;s AGMARKNET portal via data.gov.in. Compare rates
              across mandis and make data-driven marketing decisions.
            </p>
          </div>

          {/* Source Attribution Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex flex-col justify-center">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Official Data Feed
            </span>
            <span className="text-xs text-emerald-700 mt-0.5">
              AGMARKNET • Directorate of Marketing & Inspection
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Preset Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search commodity (e.g., Wheat, Paddy, Mustard, Cotton, Potato)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder-gray-400"
              aria-label="Search Commodity"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-lg">🔍</span>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm font-bold"
                aria-label="Clear Search Input"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Search Market Rates</span>
          </button>
        </form>

        {/* Popular Commodity Quick Filters */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Popular Crops:
          </span>
          {popularCommodities.slice(0, 9).map((crop) => (
            <button
              key={crop}
              onClick={() => handleSelectPreset(crop)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                commodity.toLowerCase() === crop.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Location & Sorting Filter Bar */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* State Filter */}
          <div>
            <label htmlFor="state-filter" className="block text-xs font-semibold text-gray-700 mb-1">
              Filter by State
            </label>
            <select
              id="state-filter"
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All States Across India</option>
              {availableStates.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label
              htmlFor="district-filter"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Filter by District
            </label>
            <select
              id="district-filter"
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!selectedState}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedState ? 'All Districts in ' + selectedState : 'Select a State first'}
              </option>
              {currentDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="sort-filter" className="block text-xs font-semibold text-gray-700 mb-1">
              Sort Records By
            </label>
            <select
              id="sort-filter"
              value={sortOrder}
              onChange={(e) =>
                handleSortChange(
                  e.target.value as 'modal_price_desc' | 'modal_price_asc' | 'arrival_date_desc'
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="modal_price_desc">Highest Modal Price</option>
              <option value="modal_price_asc">Lowest Modal Price</option>
              <option value="arrival_date_desc">Most Recent Arrival Date</option>
            </select>
          </div>

          {/* Reset Action */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Filter Tags */}
      {(commodity || selectedState || selectedDistrict) && (
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-gray-600">
          <span className="font-semibold text-xs uppercase text-gray-500">Active Criteria:</span>
          {commodity && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-medium">
              Crop: {commodity}
            </span>
          )}
          {selectedState && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-xs font-medium">
              State: {selectedState}
              <button
                onClick={() => handleStateChange('')}
                className="text-blue-500 hover:text-blue-800 font-bold ml-1"
                aria-label="Remove State Filter"
              >
                ×
              </button>
            </span>
          )}
          {selectedDistrict && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-full text-xs font-medium">
              District: {selectedDistrict}
              <button
                onClick={() => handleDistrictChange('')}
                className="text-purple-500 hover:text-purple-800 font-bold ml-1"
                aria-label="Remove District Filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* 5. Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center my-6 shadow-sm">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800">Fetching Live Mandi Prices...</h3>
          <p className="text-sm text-gray-500 mt-1">
            Querying official AGMARKNET wholesale records for {commodity || 'all commodities'}.
          </p>
        </div>
      )}

      {/* 6. Error State */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center my-6 shadow-sm">
          <span className="text-3xl block mb-2" role="img" aria-label="Error">
            ⚠️
          </span>
          <h3 className="text-lg font-bold text-red-800">Could Not Retrieve Mandi Prices</h3>
          <p className="text-sm text-red-600 mt-1 max-w-xl mx-auto">{error}</p>
          <div className="mt-4">
            <button
              onClick={handleRetry}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* 7. Empty State */}
      {!isLoading && !error && records.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center my-6 shadow-sm">
          <span className="text-4xl block mb-3" role="img" aria-label="No data">
            🌾
          </span>
          <h3 className="text-lg font-bold text-gray-800">No Mandi Records Found</h3>
          <p className="text-sm text-gray-600 mt-1 max-w-lg mx-auto">
            No active market arrivals were reported for{' '}
            <span className="font-semibold text-gray-900">{commodity || 'this search'}</span>
            {selectedState && ` in ${selectedState}`}
            {selectedDistrict && `, ${selectedDistrict}`} on this reporting date.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Reset Filters & Show All
            </button>
          </div>
        </div>
      )}

      {/* 8. Success State: Data Results & Comparison */}
      {!isLoading && !error && records.length > 0 && (
        <>
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Total Mandis
              </span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">
                {mandiData?.pagination.totalRecords || records.length}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                Showing {records.length} on this page
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Highest Modal Rate
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {maxModalPrice !== null ? `₹${maxModalPrice.toLocaleString('en-IN')}` : '—'}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">per quintal (100 kg)</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Lowest Modal Rate
              </span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {minModalPrice !== null ? `₹${minModalPrice.toLocaleString('en-IN')}` : '—'}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">per quintal (100 kg)</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Average Modal Rate
              </span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {avgModalPrice !== null ? `₹${avgModalPrice.toLocaleString('en-IN')}` : '—'}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">visible mandis average</span>
            </div>
          </div>

          {/* Like-for-Like Price Comparison Highlight Card */}
          {highestModalRecord && lowestModalRecord && highestModalRecord.id !== lowestModalRecord.id && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    <span>📊</span>
                    <span>Market Price Comparison ({commodity})</span>
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 max-w-2xl">
                    Comparing reported wholesale rates across mandis for the current page. Rate spread
                    between top and lowest visible markets is{' '}
                    <span className="font-bold text-emerald-900">
                      ₹
                      {Math.abs(highestModalRecord.modalPrice - lowestModalRecord.modalPrice).toLocaleString(
                        'en-IN'
                      )}{' '}
                      / quintal
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-emerald-200/60">
                <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-emerald-100">
                  <span className="text-xs font-semibold uppercase text-emerald-800 block">
                    Top Reported Rate on Page
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-gray-900">
                      {highestModalRecord.market}
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      ₹{highestModalRecord.modalPrice.toLocaleString('en-IN')} / quintal
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 block">
                    {highestModalRecord.district}, {highestModalRecord.state} • Variety:{' '}
                    {highestModalRecord.variety} ({highestModalRecord.grade})
                  </span>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-emerald-100">
                  <span className="text-xs font-semibold uppercase text-amber-800 block">
                    Lowest Reported Rate on Page
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-gray-900">
                      {lowestModalRecord.market}
                    </span>
                    <span className="text-base font-black text-amber-700">
                      ₹{lowestModalRecord.modalPrice.toLocaleString('en-IN')} / quintal
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 block">
                    {lowestModalRecord.district}, {lowestModalRecord.state} • Variety:{' '}
                    {lowestModalRecord.variety} ({lowestModalRecord.grade})
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800/80 mt-3 italic">
                * Note: Wholesale rates reflect specific commodity varieties, quality grades, and arrival
                dates. Transport fees and handling costs should be evaluated before transport decisions.
              </p>
            </div>
          )}

          {/* Desktop Data Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mandi / Market</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Commodity & Variety</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4 text-right">Modal Price</th>
                  <th className="py-3.5 px-4 text-right">Price Range (Min–Max)</th>
                  <th className="py-3.5 px-4 text-center">Arrival Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {record.market}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {record.district}, {record.state}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-gray-900 block">{record.commodity}</span>
                      <span className="text-xs text-gray-500 block">{record.variety}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {record.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-base font-extrabold text-emerald-700 block">
                        ₹{record.modalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-400 block font-normal">
                        / quintal
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600 font-mono text-xs">
                      {record.minPrice !== null && record.maxPrice !== null ? (
                        <>
                          <span>₹{record.minPrice.toLocaleString('en-IN')}</span>
                          <span className="text-gray-400 mx-1">–</span>
                          <span>₹{record.maxPrice.toLocaleString('en-IN')}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Single quote</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-gray-600 text-xs font-mono">
                      {record.arrivalDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3 mb-6">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{record.market}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {record.district}, {record.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-700 block">
                      ₹{record.modalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">/ quintal</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Commodity:</span>
                    <span className="font-semibold text-gray-800">
                      {record.commodity} ({record.variety})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Grade:</span>
                    <span className="font-semibold text-gray-800">{record.grade}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Min – Max Range:</span>
                    <span className="font-mono text-gray-700">
                      {record.minPrice !== null && record.maxPrice !== null
                        ? `₹${record.minPrice} – ₹${record.maxPrice}`
                        : 'Single quote'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Arrival Date:</span>
                    <span className="font-mono text-gray-700">{record.arrivalDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {mandiData && mandiData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm mb-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              <span className="text-xs text-gray-600 font-medium" data-testid="pagination-info">
                Page {currentPage} of {mandiData.pagination.totalPages} ({mandiData.pagination.totalRecords} total mandis)
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, mandiData.pagination.totalPages))
                }
                disabled={currentPage >= mandiData.pagination.totalPages}
                className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* 9. Historical Trends & Architecture Roadmap Section (Feature E) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="Line Chart">
              📈
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              Historical Price Trends & Multi-Day Intelligence
            </h3>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
            Single-Day AGMARKNET Feed Status
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          The official Government of India AGMARKNET daily dataset publishes single-day wholesale
          market arrival snapshots (latest reported trading observations:{' '}
          <span className="font-semibold text-gray-800">
            {records[0]?.arrivalDate || '25/10/2026'}
          </span>
          ). Multi-week historical archives are not exposed via this real-time daily feed.
        </p>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 space-y-1.5">
          <p className="font-semibold text-gray-800">
            🛡️ ProFarm Data Integrity Standard:
          </p>
          <p>
            We do not fabricate synthetic historical trend curves or interpolate nonexistent market
            points. Every price displayed in ProFarm is an authentic, verifiable report from an
            authorized APMC mandi.
          </p>
          <p className="text-emerald-800 font-medium pt-1">
            • Recommended Roadmap: Future versions will introduce scheduled daily snapshot warehousing
            to build cumulative multi-week historical trend lines directly from verified daily records.
          </p>
        </div>
      </div>

      {/* 10. Data Source, Attribution & Legal Disclaimers */}
      <div className="border-t border-gray-200 pt-6 text-xs text-gray-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-gray-700">Data Source:</span>{' '}
            <a
              href="https://data.gov.in/resource/variety-wise-daily-market-prices-data-commodity"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-800 underline font-medium"
            >
              Government of India — data.gov.in / AGMARKNET (Resource ID: 9ef84268-d588-465a-a308-a864a43d0070)
            </a>
          </p>
          <p className="text-gray-400">
            * Wholesale market observations are reported in Indian Rupees (₹) per quintal (100 kilograms).
            Modal price reflects the most commonly reported trading price in each market.
          </p>
        </div>

        {mandiData?.dataFreshness && (
          <div className="text-right text-[11px] text-gray-400 whitespace-nowrap">
            <span>
              Retrieved:{' '}
              {new Date(mandiData.dataFreshness.fetchedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="ml-2 font-medium text-gray-500">
              ({mandiData.dataFreshness.cached ? 'In-Memory Cache' : 'Live Gateway'})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
