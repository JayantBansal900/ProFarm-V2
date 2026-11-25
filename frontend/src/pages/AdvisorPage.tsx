import { tr, useLocale, locale } from '../i18n';
import { LocalizedContent } from '../i18n/LocalizedContent';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/api';
import type {
  AdvisorData,
  AdvisorRecommendation,
} from '../types/advisor';
import type { LocationResult } from '../types/weather';
import { getStoredLocation } from './WeatherPage';
import { advisorCrops as STATIC_CROPS, advisorSoils as STATIC_SOILS } from '../data/advisorCatalog';
import type { AdvisorCropSummary, AdvisorSoilSummary } from '../types/advisor';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85';

const FIELD_IMAGE =
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=85';

type CategoryKey =
  | 'all'
  | 'crop_care'
  | 'soil_health'
  | 'water_management'
  | 'sustainable_practices'
  | 'weather_considerations';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All guidance' },
  { key: 'crop_care', label: 'Crop care' },
  { key: 'soil_health', label: 'Soil health' },
  { key: 'water_management', label: 'Water' },
  { key: 'sustainable_practices', label: 'Sustainability' },
  { key: 'weather_considerations', label: 'Weather' },
];

const CATEGORY_LABELS: Record<string, string> = {
  crop_care: 'Crop care',
  soil_health: 'Soil health',
  water_management: 'Water management',
  sustainable_practices: 'Sustainable practices',
  weather_considerations: 'Weather',
};

const fieldClass =
  'w-full rounded-xl border border-[#CFE2D8] bg-[#F9FCF9] px-4 py-3 text-sm font-semibold text-[#183B3F] outline-none transition focus:border-[#659D99] focus:ring-2 focus:ring-[#659D99]/15';

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

const Arrow = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const Leaf = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 4c-9 0-16 4-16 12a4 4 0 0 0 4 4c8 0 12-7 12-16Z" />
    <path d="M4 20c3-5 7-8 12-11" />
  </svg>
);

const LocationIcon = () => (
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
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const PriorityDot = ({ priority }: { priority: string }) => (
  <span
    className={`inline-block h-2 w-2 shrink-0 rounded-full ${
      priority === 'high'
        ? 'bg-[#C36A42]'
        : priority === 'medium'
        ? 'bg-[#C4A45C]'
        : 'bg-[#76A6A1]'
    }`}
  />
);

const RecommendationItem: React.FC<{
  rec: AdvisorRecommendation;
  index: number;
}> = ({ rec, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="group border-b border-[#DFEAE4] py-5 last:border-b-0 sm:py-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <span className="hidden w-9 shrink-0 pt-1 text-xs font-bold tabular-nums text-[#809590] sm:block">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[10px] font-extrabold tracking-normal text-[#4A7873]">
              {tr(CATEGORY_LABELS[rec.category]) || rec.category.replace(/_/g, ' ')}
            </span>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#556B68]">
              <PriorityDot priority={rec.priority} />
              {rec.priority === 'high' ? tr("High priority") : rec.priority === 'medium' ? tr("Important") : tr("General")}
            </span>
          </div>

          <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-[#183B3E]">
            {<LocalizedContent text={rec.title} />}
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#355355]">
            {<LocalizedContent text={rec.explanation} />}
          </p>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#266066] hover:text-[#153B40]"
          >
            {expanded ? tr("Hide details") : tr("Why this matters")}
            <span
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            >
              <Arrow />
            </span>
          </button>

          {expanded && (
            <div className="mt-4 space-y-3 rounded-xl border border-[#D7EADF] bg-[#F2F9F4] p-4 text-xs leading-5 text-[#395A5A]">
              {rec.whyThisApplies && (
                <div>
                  <p className="font-bold text-[#224A4D]">{tr("Why it applies")}</p>
                  <p className="mt-1"><LocalizedContent text={rec.whyThisApplies} /></p>
                </div>
              )}

              {rec.evidence?.length > 0 && (
                <div>
                  <p className="font-bold text-[#224A4D]">{tr("Supporting evidence")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rec.evidence.map((item, itemIndex) => (
                      <span
                        key={`${item}-${itemIndex}`}
                        className="rounded-md border border-[#D0E5DA] bg-white px-2.5 py-1 font-medium"
                      >
                        <LocalizedContent text={item} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rec.limitations && (
                <div>
                  <p className="font-bold text-[#224A4D]">{tr("Considerations")}</p>
                  <p className="mt-1"><LocalizedContent text={rec.limitations} /></p>
                </div>
              )}

              {rec.source && (
                <p className="border-t border-[#D7E8DE] pt-3 text-[#4D6766]">{tr("Source:")}<strong>{tr(rec.source.name)}</strong>
                  {rec.source.organization
                    ? ` · ${rec.source.organization}`
                    : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const RainGauge: React.FC<{ rain: number }> = ({ rain }) => {
  // A decorative gauge, not a rainfall-risk threshold.
  const displayRain = Number.isFinite(rain) ? Math.max(0, rain) : 0;
  const fill = Math.min(100, (displayRain / 100) * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#D7E8E2"
            strokeWidth="9"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#5C9BA1"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(fill / 100) * 251.33} 251.33`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#22484D]">{tr("7 days")}</div>
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight text-[#1A3F44]">
          {displayRain.toLocaleString(locale(), {
            maximumFractionDigits: 1,
          })}
          <span className="ms-1 text-sm font-semibold text-[#56716F]">{tr("mm")}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-[#4B6968]">{tr("Forecast rainfall")}</p>
      </div>
    </div>
  );
};

export const AdvisorPage: React.FC = () => {
  useLocale();
  const [crops, setCrops] = useState<AdvisorCropSummary[]>(STATIC_CROPS);
  const [soils, setSoils] = useState<AdvisorSoilSummary[]>(STATIC_SOILS);
  const [selectedCropId, setSelectedCropId] = useState('crop-wheat');
  const [selectedSoilId, setSelectedSoilId] = useState('soil-loam');
  const [includeWeather, setIncludeWeather] = useState(true);

  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(() => getStoredLocation());

  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] =
    useState<LocationResult[]>([]);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [advisorData, setAdvisorData] = useState<AdvisorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<CategoryKey>('all');

  const requestId = useRef(0);
  const mounted = useRef(true);
  const locationRequestId = useRef(0);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      requestId.current += 1;
      locationRequestId.current += 1;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    api.getAdvisorCrops()
      .then((response) => {
        if (!cancelled && response.crops?.length) {
          setCrops(response.crops);
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('Unable to load advisor crops:', err);
      });

    api.getAdvisorSoils()
      .then((response) => {
        if (!cancelled && response.soils?.length) {
          setSoils(response.soils);
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('Unable to load advisor soils:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchGuidance = useCallback(
    async (
      cropId: string,
      soilId: string,
      location: LocationResult | null,
      withWeather: boolean
    ) => {
      const currentRequest = ++requestId.current;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getAdvisorRecommendations({
          cropId,
          soilId: soilId || null,
          location:
            withWeather && location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  locationName: location.name,
                }
              : null,
        });

        if (!mounted.current || currentRequest !== requestId.current) return;

        if (response.status !== 'success' || !response.data) {
          throw new Error('Unexpected advisor response.');
        }

        setAdvisorData(response.data);
        setActiveCategoryFilter('all');
      } catch (err) {
        if (!mounted.current || currentRequest !== requestId.current) return;

        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Unable to generate farming guidance.'
        );
      } finally {
        if (mounted.current && currentRequest === requestId.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchGuidance(
      selectedCropId,
      selectedSoilId,
      selectedLocation,
      includeWeather
    );
    // Initial guidance is generated once; later changes require submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchGuidance(
      selectedCropId,
      selectedSoilId,
      selectedLocation,
      includeWeather
    );
  };

  const handleLocationSearch = async () => {
    const query = locationSearchInput.trim();
    if (query.length < 2) return;

    const currentRequest = ++locationRequestId.current;
    setIsSearchingLocation(true);
    setLocationSearchError('');
    setLocationSearchResults([]);

    try {
      const response = await api.searchLocations(query);

      if (!mounted.current || currentRequest !== locationRequestId.current)
        return;

      setLocationSearchResults(response.locations || []);
    } catch (err) {
      if (!mounted.current || currentRequest !== locationRequestId.current)
        return;

      if (!isAbortError(err)) {
        setLocationSearchError('Location search failed. Please try again.');
      }
    } finally {
      if (mounted.current && currentRequest === locationRequestId.current) {
        setIsSearchingLocation(false);
      }
    }
  };

  const selectedCrop = crops.find((crop) => crop.id === selectedCropId);
  const selectedSoil = soils.find((soil) => soil.id === selectedSoilId);

  const categoryGroups = useMemo(() => {
    if (!advisorData) return null;
    return {
      crop_care: advisorData.recommendations.cropCare,
      soil_health: advisorData.recommendations.soilHealth,
      water_management: advisorData.recommendations.waterManagement,
      sustainable_practices: advisorData.recommendations.sustainablePractices,
      weather_considerations: advisorData.recommendations.weatherConsiderations,
    };
  }, [advisorData]);

  const allRecommendations = useMemo(
    () =>
      categoryGroups
        ? [
            ...categoryGroups.crop_care,
            ...categoryGroups.soil_health,
            ...categoryGroups.water_management,
            ...categoryGroups.sustainable_practices,
            ...categoryGroups.weather_considerations,
          ]
        : [],
    [categoryGroups]
  );

  const filteredRecommendations = useMemo(() => {
    const source =
      activeCategoryFilter === 'all'
        ? allRecommendations
        : categoryGroups?.[activeCategoryFilter] || [];

    return [...source].sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      const aRank = rank[a.priority as keyof typeof rank] ?? 3;
      const bRank = rank[b.priority as keyof typeof rank] ?? 3;
      return aRank - bRank;
    });
  }, [activeCategoryFilter, allRecommendations, categoryGroups]);

  const highPriorityCount = allRecommendations.filter(
    (item) => item.priority === 'high'
  ).length;

  const compatibility = advisorData?.compatibility;
  const weather = advisorData?.weatherSummary;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-16 text-[#1C3D40]">
      <header>
        <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#59716E]">
          <Link to="/" className="hover:text-[#265B5F]">{tr("Home")}</Link>
          <span>/</span>
          <span className="text-[#2B5F65]">{tr("Farming Advisor")}</span>
        </nav>

        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#153A3F] sm:text-4xl">{tr("Sustainable Farming Advisor")}</h1>
        <p className="mt-2 text-sm font-medium text-[#446262]">{tr("Practical crop, soil and weather guidance for your field.")}</p>
      </header>

      {/* Editorial hero */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#153A3F]">
        <img
          src={HERO_IMAGE}
          alt={tr("Green agricultural fields")}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E353A]/95 via-[#154247]/85 to-[#154247]/20" />

        <div className="relative grid min-h-[265px] gap-6 p-6 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-xl text-white">
            <p className="text-[11px] font-bold tracking-normal text-[#CBE8DC]">{tr("ProFarm · Field Intelligence")}</p>
            <h2 className="mt-4 max-w-lg font-serif text-3xl font-semibold leading-tight sm:text-4xl">{tr("Smarter decisions,")}<br />{tr("healthier harvests.")}</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#DEF1E7]">{tr("Select your crop and field conditions to build a focused farming plan.")}</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-[#12373C]/75 p-5 text-white backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-3">
                <Leaf />
              </div>
              <div>
                <p className="text-xs text-[#D2EAE1]">{tr("Advisory engine")}</p>
                <p className="mt-1 text-lg font-bold">{tr("Field guidance")}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-5 border-t border-white/20 pt-5">
              <div>
                <p className="text-xs text-[#D2EAE1]">{tr("Crop library")}</p>
                <p className="mt-1 text-2xl font-bold">{crops.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#D2EAE1]">{tr("Soil profiles")}</p>
                <p className="mt-1 text-2xl font-bold">{soils.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration */}
      <section className="overflow-hidden rounded-xl border border-[#D4E6DC] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0ECE5] px-5 py-5 sm:px-7">
          <div>
            <p className="text-[11px] font-bold tracking-normal text-[#54827B]">{tr("Field configuration")}</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#193F44]">{tr("Tell us about your field")}</h2>
          </div>
          <span className="rounded-full bg-[#ECF6F0] px-3 py-1.5 text-xs font-bold text-[#3C7270]">{tr("3 simple inputs")}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <label
                htmlFor="advisor-crop"
                className="mb-2 block text-xs font-bold text-[#345958]"
              >{tr("01 · Crop")}</label>
              <select
                id="advisor-crop"
                value={selectedCropId}
                onChange={(event) => setSelectedCropId(event.target.value)}
                required
                className={fieldClass}
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {tr(crop.name)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs font-medium text-[#5C746F]">
                {selectedCrop ? tr("{{v0}} · {{v1}} water requirement", { v0: selectedCrop.seasons.map(season => tr(season)).join(' · '), v1: tr(selectedCrop.waterLevel) }) : tr("Choose a crop")}
              </p>
            </div>

            <div>
              <label
                htmlFor="advisor-soil"
                className="mb-2 block text-xs font-bold text-[#345958]"
              >{tr("02 · Soil profile")}</label>
              <select
                id="advisor-soil"
                value={selectedSoilId}
                onChange={(event) => setSelectedSoilId(event.target.value)}
                className={fieldClass}
              >
                <option value="">{tr("Not specified")}</option>
                {soils.map((soil) => (
                  <option key={soil.id} value={soil.id}>
                    {tr(soil.name)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs font-medium text-[#5C746F]">
                {selectedSoil ? tr("Drainage: {{v0}}", { v0: tr(selectedSoil.drainage) }) : tr("Optional")}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#345958]">{tr("03 · Weather context")}</label>

              <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl border border-[#CFE2D8] bg-[#F9FCF9] px-4">
                <span className="text-sm font-semibold text-[#234A4D]">{tr("Include 7-day forecast")}</span>
                <input
                  type="checkbox"
                  checked={includeWeather}
                  onChange={(event) => setIncludeWeather(event.target.checked)}
                  className="h-4 w-4 accent-[#29656B]"
                />
              </label>

              {includeWeather && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#486865]">
                    <LocationIcon />
                    <span className="truncate">
                      {selectedLocation ? `${selectedLocation.name}${
                            selectedLocation.state
                              ? `, ${selectedLocation.state}`
                              : ''
                          }` : tr("No location selected")}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker((value) => !value)}
                    className="shrink-0 text-xs font-bold text-[#25666D] underline underline-offset-2"
                  >
                    {selectedLocation ? tr("Change") : tr("Set location")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {includeWeather && showLocationPicker && (
            <div className="mt-6 rounded-xl border border-[#CFE4D8] bg-[#F1F8F3] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#21494D]">{tr("Find your location")}</h3>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(false)}
                  className="text-xs font-bold text-[#557270]"
                >{tr("Close")}</button>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={locationSearchInput}
                  onChange={(event) => {
                    setLocationSearchInput(event.target.value);
                    setLocationSearchResults([]);
                    setLocationSearchError('');
                    locationRequestId.current += 1;
                    setIsSearchingLocation(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleLocationSearch();
                    }
                  }}
                  placeholder={tr("Search city or village in India")}
                  aria-label={tr("Search location")}
                  className={`${fieldClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={
                    isSearchingLocation || locationSearchInput.trim().length < 2
                  }
                  className="rounded-xl bg-[#265A5F] px-6 py-3 text-sm font-bold text-white hover:bg-[#1A484D] disabled:opacity-50"
                >
                  {isSearchingLocation ? tr("Searching...") : tr("Search")}
                </button>
              </div>

              {locationSearchError && (
                <p role="alert" className="mt-3 text-xs text-red-700">
                  {tr(locationSearchError)}
                </p>
              )}

              {locationSearchResults.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-[#D7E9DF] bg-white">
                  {locationSearchResults.map((location) => (
                    <button
                      key={`${location.id}-${location.latitude}-${location.longitude}`}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(location);
                        setShowLocationPicker(false);
                        setLocationSearchResults([]);
                      }}
                      className="flex w-full items-center justify-between gap-3 border-b border-[#E5EFE9] px-4 py-3 text-start text-sm font-semibold text-[#23494D] last:border-0 hover:bg-[#F1F8F3]"
                    >
                      <span>
                        {location.name}
                        {location.district ? `, ${location.district}` : ''}
                        {location.state ? `, ${location.state}` : ''}
                      </span>
                      <Arrow />
                    </button>
                  ))}
                </div>
              )}

              {!isSearchingLocation &&
                !locationSearchError &&
                locationSearchInput.trim().length >= 2 &&
                locationSearchResults.length === 0 && (
                  <p className="mt-3 text-xs text-[#58716E]">{tr("Search to view matching locations.")}</p>
                )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E2EDE7] pt-5">
            <p className="text-xs font-medium text-[#5B726E]">{tr("Rule-based recommendations tailored to your selection.")}</p>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#265A5F] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#19454A] disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? tr("Generating guidance...") : tr("Generate field guidance")}
              {!isLoading && <Arrow />}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <section
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E8C5B8] bg-[#FFF7F3] p-5"
        >
          <div>
            <h2 className="text-sm font-bold text-[#873C28]">{tr("Unable to generate guidance")}</h2>
            <p className="mt-1 text-xs text-[#873C28]">{tr(error)}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              fetchGuidance(
                selectedCropId,
                selectedSoilId,
                selectedLocation,
                includeWeather
              )
            }
            className="rounded-lg bg-[#265A5F] px-4 py-2.5 text-xs font-bold text-white"
          >{tr("Retry")}</button>
        </section>
      )}

      {isLoading && (
        <section
          role="status"
          className="rounded-xl border border-[#D7E8DE] bg-white p-8"
        >
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCECE3] border-t-[#317279]" />
            <div>
              <p className="text-sm font-bold text-[#1F484C]">{tr("Preparing your field plan")}</p>
              <p className="mt-1 text-xs text-[#57726F]">{tr("Reviewing crop, soil and forecast inputs.")}</p>
            </div>
          </div>
        </section>
      )}

      {!isLoading && advisorData && (
        <>
          {/* Results introduction */}
          <section className="overflow-hidden rounded-xl border border-[#D4E6DC] bg-[#ECF6EF]">
            <div className="grid lg:grid-cols-[1fr_300px]">
              <div className="p-6 sm:p-8">
                <p className="text-[11px] font-bold tracking-normal text-[#4B827A]">{tr("Your field assessment")}</p>

                <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[#184045]">
                  {tr(advisorData.crop.name)}
                  <span className="font-normal text-[#668680]"> / </span>
                  {tr(advisorData.soil?.name) || tr("General soil guidance")}
                </h2>

                {advisorData.crop.scientificName && (
                  <p className="mt-1 text-sm italic text-[#577471]">
                    {advisorData.crop.scientificName}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#CCE2D7] bg-white px-3 py-2 text-xs font-bold text-[#2B5D5E]">
                    {advisorData.summary.totalRecommendations}{tr("recommendations")}</span>

                  <span className="rounded-full border border-[#CCE2D7] bg-white px-3 py-2 text-xs font-bold text-[#2B5D5E]">
                    {highPriorityCount}{tr("high priority")}</span>

                  {weather && (
                    <span className="rounded-full border border-[#CCE2D7] bg-white px-3 py-2 text-xs font-bold text-[#2B5D5E]">
                      {weather.locationName} · {weather.temperatureC}°C
                    </span>
                  )}
                </div>
              </div>

              <div className="relative hidden min-h-[220px] lg:block">
                <img
                  src={FIELD_IMAGE}
                  alt={tr("Cultivated farmland")}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#ECF6EF] to-transparent" />
              </div>
            </div>
          </section>

          {/* Field compatibility and forecast */}
          {(compatibility || weather) && (
            <div
              className={`grid gap-4 ${
                compatibility && weather ? 'lg:grid-cols-2' : ''
              }`}
            >
              {compatibility && (
                <section className="rounded-xl border border-[#D4E6DC] bg-white p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold tracking-normal text-[#517D76]">{tr("Crop–soil compatibility")}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        compatibility.status === 'recommended'
                          ? 'bg-[#E3F4EC] text-[#276C6D]'
                          : compatibility.status === 'acceptable'
                          ? 'bg-[#FBF0D9] text-[#94692C]'
                          : 'bg-[#FBE7E0] text-[#9B4C33]'
                      }`}
                    >
                      {compatibility.status === 'recommended' ? tr("Recommended") : compatibility.status === 'acceptable' ? tr("Acceptable") : tr("Review needed")}
                    </span>
                  </div>

                  <h3 className="mt-5 font-serif text-2xl font-semibold text-[#1B4146]">
                    {<LocalizedContent text={compatibility.headline} />}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#446361]">
                    {<LocalizedContent text={compatibility.reason} />}
                  </p>
                </section>
              )}

              {weather && (
                <section className="rounded-xl border border-[#D4E6DC] bg-white p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold tracking-normal text-[#517D76]">{tr("Weather outlook")}</p>
                    <span className="text-xs font-bold text-[#486B6A]">
                      {weather.locationName}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
                    <RainGauge rain={weather.sevenDayTotalRainMm} />

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-end">
                      <div>
                        <p className="text-[11px] font-semibold text-[#637C78]">{tr("Temperature")}</p>
                        <p className="mt-1 text-lg font-bold text-[#1F474C]">
                          {weather.temperatureC}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#637C78]">{tr("Rain chance")}</p>
                        <p className="mt-1 text-lg font-bold text-[#1F474C]">
                          {weather.maxDailyPrecipProb}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#637C78]">{tr("Today's rain")}</p>
                        <p className="mt-1 text-sm font-bold text-[#1F474C]">
                          {weather.todayRainMm}{tr("mm")}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#637C78]">{tr("Max wind")}</p>
                        <p className="mt-1 text-sm font-bold text-[#1F474C]">
                          {weather.maxWindSpeedKmH}{tr("km/h")}</p>
                      </div>
                    </div>
                  </div>

                  {(weather.heavyRainAlert || weather.drySpellAlert) && (
                    <p className="mt-5 rounded-lg bg-[#F6F1E3] px-4 py-3 text-xs font-bold text-[#765C2C]">
                      {weather.heavyRainAlert ? tr("Heavy rainfall consideration identified") : tr("Dry-spell consideration identified")}
                    </p>
                  )}
                </section>
              )}
            </div>
          )}

          {/* Recommendations */}
          <section className="overflow-hidden rounded-xl border border-[#D4E6DC] bg-white">
            <div className="border-b border-[#DFEAE4] px-5 py-6 sm:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-normal text-[#4D7D77]">{tr("Your action plan")}</p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-[#173C41] sm:text-3xl">{tr("Farming Recommendations")}</h2>
                </div>

                <p className="text-xs font-bold text-[#5B7470]">
                  {filteredRecommendations.length}{tr("recommendations")}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {CATEGORIES.filter((category) => {
                  if (category.key === 'all') return true;
                  return (categoryGroups?.[category.key]?.length || 0) > 0;
                }).map((category) => {
                  const active = activeCategoryFilter === category.key;
                  const count =
                    category.key === 'all'
                      ? allRecommendations.length
                      : categoryGroups?.[category.key]?.length || 0;

                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setActiveCategoryFilter(category.key)}
                      aria-pressed={active}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                        active
                          ? 'border-[#265A5F] bg-[#265A5F] text-white'
                          : 'border-[#D3E5DB] bg-[#F4F9F5] text-[#385D5C] hover:border-[#A7C7BF]'
                      }`}
                    >
                      {tr(category.label)} <span className="opacity-75">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 sm:px-8">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((rec, index) => (
                  <RecommendationItem
                    key={rec.id}
                    rec={rec}
                    index={index}
                  />
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-[#526E6C]">{tr("No recommendations in this category.")}</p>
                </div>
              )}
            </div>
          </section>

          {/* Disclaimer */}
          <footer className="rounded-xl border border-[#D7E8DE] bg-[#F3F9F4] px-5 py-5 sm:px-7">
            <p className="text-xs font-bold text-[#295657]">{tr("About this guidance")}</p>
            <p className="mt-2 text-xs leading-5 text-[#526D6B]">
              <LocalizedContent text={advisorData.disclaimer} />
            </p>
          </footer>
        </>
      )}
    </div>
  );
};
