import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import {
  AdvisorData,
  AdvisorRecommendation,
  AdvisorCropSummary,
  AdvisorSoilSummary,
} from '../../types/advisor';
import { LocationResult } from '../../types/weather';
import { getStoredLocation } from './WeatherPage';

// Fallback crops list in case backend API lookup is warming up
const STATIC_CROPS: AdvisorCropSummary[] = [
  { id: 'crop-wheat', slug: 'wheat', name: 'Wheat', hindiName: 'गेहूं', category: 'Cereal & Grain', seasons: ['Rabi'], waterLevel: 'Moderate', icon: '🌾' },
  { id: 'crop-rice', slug: 'rice', name: 'Rice / Paddy', hindiName: 'चावल / धान', category: 'Cereal & Grain', seasons: ['Kharif'], waterLevel: 'Very High', icon: '🍚' },
  { id: 'crop-maize', slug: 'maize', name: 'Maize / Corn', hindiName: 'मक्का', category: 'Cereal & Grain', seasons: ['Kharif', 'Rabi'], waterLevel: 'Moderate', icon: '🌽' },
  { id: 'crop-chickpea', slug: 'chickpea', name: 'Chickpea / Gram', hindiName: 'चना', category: 'Pulse & Legume', seasons: ['Rabi'], waterLevel: 'Low', icon: '🌱' },
  { id: 'crop-pigeonpea', slug: 'pigeonpea', name: 'Pigeon Pea / Arhar', hindiName: 'अरहर / तूर', category: 'Pulse & Legume', seasons: ['Kharif'], waterLevel: 'Low', icon: '🌿' },
  { id: 'crop-mustard', slug: 'mustard', name: 'Mustard / Rapeseed', hindiName: 'सरसों', category: 'Oilseed', seasons: ['Rabi'], waterLevel: 'Low', icon: '🌼' },
  { id: 'crop-groundnut', slug: 'groundnut', name: 'Groundnut / Peanut', hindiName: 'मूंगफली', category: 'Oilseed', seasons: ['Kharif'], waterLevel: 'Moderate', icon: '🥜' },
  { id: 'crop-soybean', slug: 'soybean', name: 'Soybean', hindiName: 'सोयाबीन', category: 'Oilseed', seasons: ['Kharif'], waterLevel: 'Moderate', icon: '🌱' },
  { id: 'crop-cotton', slug: 'cotton', name: 'Cotton', hindiName: 'कपास', category: 'Fiber', seasons: ['Kharif'], waterLevel: 'Moderate', icon: '⚪' },
  { id: 'crop-sugarcane', slug: 'sugarcane', name: 'Sugarcane', hindiName: 'गन्ना', category: 'Commercial & Cash', seasons: ['Kharif'], waterLevel: 'Very High', icon: '🎋' },
  { id: 'crop-potato', slug: 'potato', name: 'Potato', hindiName: 'आलू', category: 'Tuber & Root', seasons: ['Rabi'], waterLevel: 'Moderate', icon: '🥔' },
  { id: 'crop-tomato', slug: 'tomato', name: 'Tomato', hindiName: 'टमाटर', category: 'Commercial & Cash', seasons: ['Kharif', 'Rabi', 'Zaid'], waterLevel: 'Moderate', icon: '🍅' },
];

const STATIC_SOILS: AdvisorSoilSummary[] = [
  { id: 'soil-loam', slug: 'loamy-soil', name: 'Loamy Soil', drainage: 'Good / Well-Drained', waterRetention: 'Moderate', icon: '🌾' },
  { id: 'soil-clay', slug: 'clay-soil', name: 'Clay Soil', drainage: 'Slow / Poorly Drained', waterRetention: 'Very High', icon: '🧱' },
  { id: 'soil-sandy', slug: 'sandy-soil', name: 'Sandy Soil', drainage: 'Rapid / Excessive', waterRetention: 'Low', icon: '🏖️' },
  { id: 'soil-alluvial', slug: 'alluvial-soil', name: 'Alluvial Soil', drainage: 'Well-Drained to Moderate', waterRetention: 'Moderate to High', icon: '🏞️' },
  { id: 'soil-black', slug: 'black-cotton-soil', name: 'Black Cotton Soil (Regur)', drainage: 'Slow when wet', waterRetention: 'Very High', icon: '🌑' },
  { id: 'soil-red', slug: 'red-soil', name: 'Red & Yellow Soil', drainage: 'Rapid to Good', waterRetention: 'Low to Moderate', icon: '🧱' },
];

export const AdvisorPage: React.FC = () => {
  // Input configuration states
  const [crops, setCrops] = useState<AdvisorCropSummary[]>(STATIC_CROPS);
  const [soils, setSoils] = useState<AdvisorSoilSummary[]>(STATIC_SOILS);
  const [selectedCropId, setSelectedCropId] = useState<string>('crop-wheat');
  const [selectedSoilId, setSelectedSoilId] = useState<string>('soil-loam');
  const [includeWeather, setIncludeWeather] = useState<boolean>(true);

  // Weather location selection
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(() => {
    return getStoredLocation();
  });
  const [locationSearchInput, setLocationSearchInput] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [locationSearchResults, setLocationSearchResults] = useState<LocationResult[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);

  // Advisory execution & results states
  const [advisorData, setAdvisorData] = useState<AdvisorData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Load server-side dynamic lists
  useEffect(() => {
    let isCancelled = false;
    api
      .getAdvisorCrops()
      .then((res) => {
        if (!isCancelled && res.crops && res.crops.length > 0) {
          setCrops(res.crops);
        }
      })
      .catch((err) => {
        if (!isCancelled) console.warn('Could not load dynamic crops:', err);
      });

    api
      .getAdvisorSoils()
      .then((res) => {
        if (!isCancelled && res.soils && res.soils.length > 0) {
          setSoils(res.soils);
        }
      })
      .catch((err) => {
        if (!isCancelled) console.warn('Could not load dynamic soils:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch guidance handler
  const fetchGuidance = useCallback(
    async (cropId: string, soilId: string, loc: LocationResult | null, withWeather: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        const payload = {
          cropId,
          soilId: soilId ? soilId : null,
          location:
            withWeather && loc
              ? {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  locationName: loc.name,
                }
              : null,
        };

        const response = await api.getAdvisorRecommendations(payload);
        if (response.status === 'success' && response.data) {
          setAdvisorData(response.data);
        } else {
          throw new Error('Received unexpected advisor payload format.');
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to generate sustainable farming guidance. Please check connection and try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchGuidance(selectedCropId, selectedSoilId, selectedLocation, includeWeather);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuidance(selectedCropId, selectedSoilId, selectedLocation, includeWeather);
  };

  // Location search handler
  const handleLocationSearch = async () => {
    if (!locationSearchInput.trim() || locationSearchInput.trim().length < 2) return;
    setIsSearchingLocation(true);
    try {
      const res = await api.searchLocations(locationSearchInput.trim());
      setLocationSearchResults(res.locations || []);
    } catch {
      setLocationSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Filter recommendations based on active tab
  const getFilteredRecommendations = (): AdvisorRecommendation[] => {
    if (!advisorData) return [];
    const { cropCare, soilHealth, waterManagement, sustainablePractices, weatherConsiderations } =
      advisorData.recommendations;

    switch (activeCategoryFilter) {
      case 'crop_care':
        return cropCare;
      case 'soil_health':
        return soilHealth;
      case 'water_management':
        return waterManagement;
      case 'sustainable_practices':
        return sustainablePractices;
      case 'weather_considerations':
        return weatherConsiderations;
      case 'all':
      default:
        return [
          ...cropCare,
          ...soilHealth,
          ...waterManagement,
          ...sustainablePractices,
          ...weatherConsiderations,
        ];
    }
  };

  const filteredRecs = getFilteredRecommendations();
  const selectedCropRecord = crops.find((c) => c.id === selectedCropId);

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-500 space-x-2">
        <Link to="/tools" className="hover:text-emerald-600 transition-colors">
          Tools Hub
        </Link>
        <span>&rsaquo;</span>
        <span className="font-semibold text-slate-800">Sustainable Farming Advisor</span>
      </div>

      {/* Header Banner */}
      <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Live Advisory Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ICAR & FAO Agronomic Standard
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sustainable Farming Advisor</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              Synthesizes crop agronomy, soil physical dynamics, and live agrometeorological forecasts
              into deterministic, explainable recommendations. Optimizes resources without synthetic chemical brand prescriptions.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <span className="text-3xl">🌱</span>
          </div>
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>Configure Your Field Parameters</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1: Crop Selection */}
            <div>
              <label htmlFor="crop-select" className="block text-sm font-semibold text-slate-700 mb-1">
                Select Crop <span className="text-rose-500">*</span>
              </label>
              <select
                id="crop-select"
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.icon} {crop.name} {crop.hindiName ? `(${crop.hindiName})` : ''} — {crop.category}
                  </option>
                ))}
              </select>
              {selectedCropRecord && (
                <p className="mt-1 text-xs text-slate-500">
                  Seasons: {selectedCropRecord.seasons.join(', ')} | Water Tier: {selectedCropRecord.waterLevel}
                </p>
              )}
            </div>

            {/* Step 2: Soil Profile Selection (Optional) */}
            <div>
              <label htmlFor="soil-select" className="block text-sm font-semibold text-slate-700 mb-1">
                Select Soil Profile <span className="text-xs text-slate-500 font-normal">(Optional)</span>
              </label>
              <select
                id="soil-select"
                value={selectedSoilId}
                onChange={(e) => setSelectedSoilId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">None / Skip Soil Profile</option>
                {soils.map((soil) => (
                  <option key={soil.id} value={soil.id}>
                    {soil.icon} {soil.name} ({soil.drainage})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Enables texture-based drainage and soil enrichment guidelines.
              </p>
            </div>

            {/* Step 3: Weather Integration Toggle & Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Agrometeorological Weather
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="include-weather"
                  checked={includeWeather}
                  onChange={(e) => setIncludeWeather(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="include-weather" className="text-sm text-slate-700 font-medium">
                  Integrate Live 7-Day Forecast
                </label>
              </div>

              {includeWeather && (
                <div className="mt-2 text-xs">
                  {selectedLocation ? (
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="font-medium text-slate-800">
                        📍 {selectedLocation.name}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(!showLocationPicker)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold underline text-xs ml-2"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 flex items-center justify-between">
                      <span>No saved location found</span>
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(!showLocationPicker)}
                        className="text-amber-900 font-semibold underline ml-2"
                      >
                        Set Location
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Picker Popover (if user clicks Change/Set Location) */}
          {includeWeather && showLocationPicker && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Search Indian Village / Mandi / City</h3>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Ludhiana, Guntur, Karnal, Nagpur"
                  value={locationSearchInput}
                  onChange={(e) => setLocationSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLocationSearch();
                    }
                  }}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={isSearchingLocation}
                  className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md hover:bg-slate-700 disabled:opacity-50"
                >
                  {isSearchingLocation ? 'Searching...' : 'Search'}
                </button>
              </div>

              {locationSearchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 bg-white border border-slate-200 rounded-md">
                  {locationSearchResults.map((loc) => (
                    <button
                      key={`${loc.id}-${loc.latitude}-${loc.longitude}`}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setShowLocationPicker(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-800">
                        {loc.name}, {loc.district ? `${loc.district}, ` : ''}{loc.state || loc.country}
                      </span>
                      <span className="text-slate-400">Select &rarr;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Deterministic calculations based on published ICAR agronomic rulesets.
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Synthesizing Guidance...' : 'Generate Sustainable Guidance'}
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start justify-between">
          <div>
            <h4 className="font-bold mb-1">Advisory Engine Error</h4>
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchGuidance(selectedCropId, selectedSoilId, selectedLocation, includeWeather)}
            className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="border border-slate-200 bg-white rounded-xl p-8 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="h-32 bg-slate-100 rounded-lg"></div>
            <div className="h-32 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Guidance Results Dashboard */}
      {!isLoading && advisorData && (
        <div className="space-y-6">
          {/* Active Configuration Summary Chips */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Evaluation Context:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                <span>{advisorData.crop.icon}</span>
                <span>{advisorData.crop.name}</span>
                <span className="text-slate-400">({advisorData.crop.scientificName})</span>
              </span>
              {advisorData.soil ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                  <span>{advisorData.soil.icon}</span>
                  <span>{advisorData.soil.name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700">
                  Soil: Not Specified
                </span>
              )}
              {advisorData.weatherSummary ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                  <span>{advisorData.weatherSummary.icon}</span>
                  <span>{advisorData.weatherSummary.locationName}</span>
                  <span>• {advisorData.weatherSummary.temperatureC}°C</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700">
                  Weather: Omitted
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Total Recommendations: <span className="font-bold text-white">{advisorData.summary.totalRecommendations}</span>
            </div>
          </div>

          {/* Soil Compatibility Banner (if soil included) */}
          {advisorData.compatibility && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                advisorData.compatibility.status === 'recommended'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : advisorData.compatibility.status === 'acceptable'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="text-xl">
                {advisorData.compatibility.status === 'recommended'
                  ? '✅'
                  : advisorData.compatibility.status === 'acceptable'
                  ? 'ℹ️'
                  : '⚠️'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">
                  {advisorData.compatibility.headline}
                </h3>
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  {advisorData.compatibility.reason}
                </p>
              </div>
            </div>
          )}

          {/* Weather Summary Card (if weather included) */}
          {advisorData.weatherSummary && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-950">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{advisorData.weatherSummary.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm">
                      Live 7-Day Meteorological Outlook for {advisorData.weatherSummary.locationName}
                    </h3>
                    <p className="text-xs text-blue-700">
                      Condition: {advisorData.weatherSummary.condition} • Observed Temp: {advisorData.weatherSummary.temperatureC}°C (Feels like {advisorData.weatherSummary.apparentTemperatureC}°C)
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-semibold self-start sm:self-auto">
                  Forecast Rain: {advisorData.weatherSummary.sevenDayTotalRainMm} mm (7 days)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-100 text-xs">
                <div>
                  <span className="text-blue-600 block">Today&apos;s Rain:</span>
                  <span className="font-bold">{advisorData.weatherSummary.todayRainMm} mm</span>
                </div>
                <div>
                  <span className="text-blue-600 block">Peak Rain Probability:</span>
                  <span className="font-bold">{advisorData.weatherSummary.maxDailyPrecipProb}%</span>
                </div>
                <div>
                  <span className="text-blue-600 block">Peak Wind Velocity:</span>
                  <span className="font-bold">{advisorData.weatherSummary.maxWindSpeedKmH} km/h</span>
                </div>
                <div>
                  <span className="text-blue-600 block">Status:</span>
                  <span className="font-bold">
                    {advisorData.weatherSummary.heavyRainAlert
                      ? '⚠️ Rain Alert Active'
                      : advisorData.weatherSummary.drySpellAlert
                      ? '☀️ Dry Spell Outlook'
                      : '✅ Moderate Outlook'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Guidance ({advisorData.summary.totalRecommendations})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('crop_care')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategoryFilter === 'crop_care'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Crop Care ({advisorData.recommendations.cropCare.length})
            </button>
            {advisorData.soil && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('soil_health')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategoryFilter === 'soil_health'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Soil Health ({advisorData.recommendations.soilHealth.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('water_management')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategoryFilter === 'water_management'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Water Management ({advisorData.recommendations.waterManagement.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('sustainable_practices')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategoryFilter === 'sustainable_practices'
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Sustainable Practices ({advisorData.recommendations.sustainablePractices.length})
            </button>
            {advisorData.weatherSummary && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('weather_considerations')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategoryFilter === 'weather_considerations'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Weather Alerts ({advisorData.recommendations.weatherConsiderations.length})
              </button>
            )}
          </div>

          {/* Recommendations Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecs.map((rec) => (
              <div
                key={rec.id}
                className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        rec.category === 'crop_care'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.category === 'soil_health'
                          ? 'bg-amber-100 text-amber-800'
                          : rec.category === 'water_management'
                          ? 'bg-sky-100 text-sky-800'
                          : rec.category === 'sustainable_practices'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rec.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        rec.priority === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.priority === 'high' ? 'High Priority' : rec.priority === 'medium' ? 'Important' : 'Informational'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {rec.title}
                  </h3>

                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                    {rec.explanation}
                  </p>

                  {/* Why this applies box */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 block mb-0.5">
                      💡 Why this applies:
                    </span>
                    <p>{rec.whyThisApplies}</p>
                  </div>

                  {/* Evidence badging */}
                  {rec.evidence && rec.evidence.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">
                        Agronomic Evidence:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.evidence.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Limitations note */}
                  <div className="text-xs text-slate-500 italic mb-2">
                    <span className="font-medium not-italic text-slate-600">Note: </span>
                    {rec.limitations}
                  </div>
                </div>

                {/* Source attribution footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    Source: <strong className="font-medium text-slate-700">{rec.source.name}</strong>
                    {rec.source.organization ? ` (${rec.source.organization})` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Educational Disclaimer Banner */}
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs leading-relaxed">
            <h4 className="font-bold text-sm text-emerald-900 mb-1 flex items-center gap-1.5">
              <span>🌾</span>
              <span>Educational Decision-Support Standard & Non-Commercial Guarantee</span>
            </h4>
            <p className="text-emerald-800">
              {advisorData.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
