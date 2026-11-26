import { tr, useLocale, formatAreaUnit, formatNumber } from '../i18n';
import { cropImage, photoFocus, sceneImage, soilImage } from '../data/media';
import { SOILS_DATA } from '../data/soils';
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/api';
import { FarmRecord, FarmPagination } from '../types/farm';

const FARM_PAGE_SIZE = 20;

/** Show the farm's own soil when it is known; otherwise a field photo. */
function farmPhoto(soilType: string | null | undefined, index: number): string {
  const soil = SOILS_DATA.find((item) => item.name === soilType);
  const photo = soil ? soilImage(soil.slug) : undefined;
  return photo ? photo.src : IMAGES.fields[index % IMAGES.fields.length];
}

const IMAGES = {
  hero: sceneImage('tractor-punjab'),
  fields: [
    cropImage('wheat')!.src,
    cropImage('rice')!.src,
    cropImage('sugarcane')!.src,
  ],
};

const SOILS = [
  { value: 'soil-loam', label: 'Loamy Soil' },
  { value: 'soil-clay', label: 'Clay Soil' },
  { value: 'soil-sandy', label: 'Sandy Soil' },
  { value: 'soil-alluvial', label: 'Alluvial Soil' },
  { value: 'soil-black', label: 'Black Cotton Soil (Regur)' },
  { value: 'soil-red', label: 'Red & Yellow Soil' },
];

const ArrowIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M7 3v4m10-4v4M3 10h18" />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const FieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 19c4-5 8-7 18-7M3 13c5-4 11-5 18-4M3 7c6-2 12-2 18-1" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const fieldClass =
  'w-full rounded-xl border border-[#CFE1D7] bg-white px-4 py-3 text-sm text-[#234444] outline-none transition placeholder:text-[#90A19C] focus:border-[#3D7B7B] focus:ring-2 focus:ring-[#3D7B7B]/15';

const labelClass =
  'mb-2 block text-xs font-bold text-[#375959]';

const actionClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D7B7B]';

type FormFieldProps = {
  id: string;
  label: string;
  children: React.ReactNode;
  optional?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  children,
  optional = false,
}) => (
  <div>
    <label htmlFor={id} className={labelClass}>
      {tr(label)}
      {optional && (
        <span className="ms-1 font-normal text-[#869B96]">{tr("(optional)")}</span>
      )}
    </label>
    {children}
  </div>
);

function farmLocation(farm: FarmRecord): string {
  const parts = [farm.village, farm.district, farm.state]
    .filter((part): part is string => Boolean(part?.trim()));

  return parts.length > 0
    ? parts.join(', ')
    : tr('Location not specified');
}

function soilLabel(value: string | null | undefined): string {
  if (!value) return tr('Not specified');

  const known = SOILS.find((soil) => soil.value === value)?.label;
  return known ? tr(known) : value.replace(/^soil-/, '').replace(/-/g, ' ');
}

function count(value: number | null | undefined): number {
  return value ?? 0;
}

export const MyFarmsPage: React.FC = () => {
  useLocale();
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<FarmPagination | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<FarmRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [actionFarmId, setActionFarmId] = useState<string | number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [soilType, setSoilType] = useState('');
  const [notes, setNotes] = useState('');

  const formId = useId();
  const modalTitleId = useId();

  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  // ============================================================
  // FARM FETCHING WITH PAGINATION
  // ============================================================

  const fetchFarms = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);
    setFarms([]);
    setPagination(null);

    try {
      const response = await api.getFarms(
        includeArchived,
        page,
        FARM_PAGE_SIZE
      );

      if (requestId !== requestIdRef.current) return;

      if (page > response.pagination.totalPages) {
        setPage(response.pagination.totalPages);
        return;
      }

      setFarms(response.farms || []);
      setPagination(response.pagination);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load your farms. Please try again.'
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [includeArchived, page]);

  useEffect(() => {
    void fetchFarms();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchFarms]);

  // ============================================================
  // MODAL ACCESSIBILITY
  // ============================================================

  useEffect(() => {
    if (!isModalOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    nameInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        setIsModalOpen(false);
        setEditingFarm(null);
        setFormError(null);
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
        )
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isModalOpen, isSaving]);

  // ============================================================
  // FORM MANAGEMENT
  // ============================================================

  const resetForm = () => {
    setName('');
    setState('');
    setDistrict('');
    setVillage('');
    setPincode('');
    setArea('');
    setAreaUnit('acres');
    setSoilType('');
    setNotes('');
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingFarm(null);
    setIsModalOpen(true);
  };

  const openEditModal = (farm: FarmRecord) => {
    setEditingFarm(farm);
    setName(farm.name || '');
    setState(farm.state || '');
    setDistrict(farm.district || '');
    setVillage(farm.village || '');
    setPincode(farm.pincode || '');

    setArea(
      farm.area !== null && farm.area !== undefined
        ? String(farm.area)
        : ''
    );

    setAreaUnit(farm.areaUnit || 'acres');
    setSoilType(farm.soilType || '');
    setNotes(farm.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingFarm(null);
    setFormError(null);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSaving) return;

    if (name.trim().length < 2) {
      setFormError('Farm name must contain at least 2 characters.');
      return;
    }

    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      setFormError('Enter a valid 6-digit PIN code.');
      return;
    }

    const parsedArea = area.trim() ? Number(area) : null;

    if (
      parsedArea !== null &&
      (!Number.isFinite(parsedArea) || parsedArea < 0)
    ) {
      setFormError('Enter a valid farm area.');
      return;
    }

    const payload = {
      name: name.trim(),
      state: state.trim() || null,
      district: district.trim() || null,
      village: village.trim() || null,
      pincode: pincode.trim() || null,
      area: parsedArea,
      areaUnit,
      soilType: soilType || null,
      notes: notes.trim() || null,
    };

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingFarm) {
        await api.updateFarm(editingFarm.id, payload);
      } else {
        await api.createFarm(payload);
      }

      setIsModalOpen(false);
      setEditingFarm(null);

      if (!editingFarm && page !== 1) {
        setPage(1);
      } else {
        await fetchFarms();
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to save farm. Please check your information.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleArchive = async (farm: FarmRecord) => {
    if (actionFarmId !== null) return;

    setActionFarmId(farm.id);
    setActionError(null);

    try {
      if (farm.isArchived) {
        await api.restoreFarm(farm.id);
      } else {
        await api.archiveFarm(farm.id);
      }

      await fetchFarms();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to update farm status.'
      );
    } finally {
      setActionFarmId(null);
    }
  };

  // ============================================================
  // PAGE-LEVEL SUMMARY
  // ============================================================

  const activeFarms = farms.filter((farm) => !farm.isArchived);
  const archivedFarms = farms.filter((farm) => farm.isArchived);

  const totalCycles = activeFarms.reduce(
    (sum, farm) => sum + count(farm.activeCropCyclesCount),
    0
  );

  const pendingTasks = activeFarms.reduce(
    (sum, farm) => sum + count(farm.pendingTasksCount),
    0
  );

  const totalActivities = activeFarms.reduce(
    (sum, farm) => sum + count(farm.totalActivitiesCount),
    0
  );

  const summary = [
    {
      label: 'Active Farms',
      value: activeFarms.length,
      unit: 'on this page',
    },
    {
      label: 'Crop Cycles',
      value: totalCycles,
      unit: 'active on page',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      unit: 'on this page',
    },
    {
      label: 'Activities',
      value: totalActivities,
      unit: 'on this page',
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-16 text-[#234444]">
      {/* Page heading */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <nav
            aria-label={tr("Breadcrumb")}
            className="mb-3 flex items-center gap-2 text-xs font-medium text-[#67827E]"
          >
            <Link to="/" className="hover:text-[#265A5F]">{tr("Home")}</Link>
            <span>/</span>
            <span className="font-semibold text-[#265A5F]">{tr("My Farms")}</span>
          </nav>

          <p className="text-[13px] font-bold tracking-normal text-[#52837E]">{tr("Your agricultural workspace")}</p>

          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#153A3F] sm:text-4xl">{tr("My Farms")}</h1>

          <p className="mt-2 text-sm text-[#526E6C]">{tr("Manage your land, crops and field activities in one place.")}</p>
        </div>

        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <Link
            to="/my-farms/calendar"
            className={`${actionClass} border border-[#CCE1D6] bg-white text-[#265358] hover:bg-[#EDF7F0]`}
          >
            <CalendarIcon />{tr("Farm Calendar")}</Link>

          <button
            type="button"
            onClick={openCreateModal}
            className={`${actionClass} bg-[#265A5F] text-white hover:bg-[#17454A]`}
          >
            <PlusIcon />{tr("Add New Farm")}</button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#13393E]">
        <img
          src={IMAGES.hero}
          alt={tr("Green farmland stretching across the countryside")}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0E3338]/95 via-[#154348]/85 to-[#154348]/20" />

        <div className="relative flex min-h-[270px] flex-col justify-center p-7 text-white sm:p-10 lg:min-h-[310px] lg:p-12">
          <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-normal backdrop-blur-sm">{tr("Farm Management")}</span>

          <h2 className="mt-5 max-w-lg font-serif text-4xl font-semibold leading-tight sm:text-5xl">{tr("Every field.")}<br />{tr("One clear view.")}</h2>

          <p className="mt-4 max-w-md text-sm leading-6 text-[#DFF0EA]">{tr("Keep your farm records organized and your next steps in sight.")}</p>
        </div>
      </section>

      {/* Summary */}
      <section aria-label={tr("Farm overview")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold text-[#183B3F]">{tr("Farm Overview")}</h2>

          <span className="text-xs font-semibold text-[#67827E]">
            {isLoading ? tr("Loading records") : tr("Page-level overview of loaded active farms")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#D7E7DE] bg-white p-5 sm:p-6"
            >
              <p className="text-xs font-semibold text-[#607B77]">
                {tr(item.label)}
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="font-serif text-4xl font-semibold leading-none text-[#1C484D]">
                  {isLoading || error ? '—' : item.value}
                </span>
              </div>

              <p className="mt-2 text-[13px] font-medium text-[#839691]">
                {tr(item.unit)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Farm collection */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold tracking-normal text-[#57847F]">{tr("Your collection")}</p>

            <h2 className="mt-2 font-serif text-[28px] font-semibold text-[#183B3F]">{tr("Registered Farms")}</h2>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#D7E7DE] bg-white px-4 py-3 text-xs font-semibold text-[#466664]">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => {
                setPage(1);
                setIncludeArchived(event.target.checked);
              }}
              className="h-4 w-4 accent-[#265A5F]"
            />{tr("Include archived farms")}</label>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{tr(error)}</span>

            <button
              type="button"
              onClick={() => void fetchFarms()}
              className="font-bold underline underline-offset-2"
            >{tr("Retry")}</button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{tr(actionError)}</span>

            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label={tr("Dismiss error")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {isLoading && (
          <div
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label={tr("Loading farms")}
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#D7E7DE] bg-white"
              >
                <div className="h-48 animate-pulse bg-[#E0ECE4]" />

                <div className="space-y-4 p-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-[#E0ECE4]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#E7F0EA]" />
                  <div className="h-20 animate-pulse rounded bg-[#EDF4EF]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && pagination?.totalRecords === 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#D7E7DE] bg-white">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="relative min-h-[240px] bg-[#D5E9DC]">
                <img
                  src={IMAGES.fields[0]}
                  style={{ objectPosition: photoFocus(IMAGES.fields[0]) }}
                  alt={tr("Cultivated agricultural fields")}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-col items-start justify-center p-7 sm:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E5F5EC] text-[#2D696B]">
                  <FieldIcon />
                </div>

                <h3 className="mt-5 font-serif text-3xl font-semibold text-[#1B4045]">
                  {includeArchived ? tr("No farms found") : tr("Your farming journey starts here")}
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#57716E]">
                  {includeArchived ? tr("There are no farm records to display.") : tr("Add your first farm to start organizing crop cycles, field tasks and activity records.")}
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className={`${actionClass} mt-6 bg-[#265A5F] text-white hover:bg-[#17454A]`}
                >
                  <PlusIcon />{tr("Register Your First Farm")}</button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && farms.length > 0 && (
          <>
            <p className="mb-4 text-xs font-medium text-[#6B827D]">{tr("Showing")}{(page - 1) * FARM_PAGE_SIZE + 1}–
              {(page - 1) * FARM_PAGE_SIZE + farms.length} {tr("of")}{' '}
              {pagination?.totalRecords ?? farms.length}{tr("farms")}{includeArchived && archivedFarms.length > 0 ? tr(" · {{v0}} archived on this page", { v0: archivedFarms.length }) : ''}
            </p>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {farms.map((farm, index) => {
                const archived = Boolean(farm.isArchived);
                const busy = actionFarmId === farm.id;

                return (
                  <article
                    key={farm.id}
                    className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                      archived
                        ? 'border-[#D9E2DC] opacity-80'
                        : 'border-[#D7E7DE] hover:-translate-y-1 hover:border-[#B3CFC6] hover:shadow-[0_16px_40px_rgba(24,65,39,0.10)]'
                    }`}
                  >
                    <div className="relative h-[200px] overflow-hidden bg-[#D6E9DE]">
                      <img
                        src={farmPhoto(farm.soilType, index)}
                        style={{ objectPosition: photoFocus(farmPhoto(farm.soilType, index)) }}
                        alt={farm.soilType ? tr("{{v0}} sample", { v0: tr(farm.soilType) }) : tr("Illustrative agricultural landscape")}
                        loading="lazy"
                        className={`h-full w-full object-cover transition-transform duration-700 ${
                          archived
                            ? 'grayscale'
                            : 'group-hover:scale-105'
                        }`}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#10373C]/60 via-transparent to-transparent" />

                      <span
                        className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold tracking-normal backdrop-blur-sm ${
                          archived
                            ? 'bg-white/90 text-[#657876]'
                            : 'bg-[#E3F5EB]/95 text-[#235F64]'
                        }`}
                      >
                        {archived ? tr("Archived") : tr("Active")}
                      </span>

                      {farm.area !== null &&
                        farm.area !== undefined && (
                          <span className="absolute bottom-4 left-4 rounded-lg border border-white/20 bg-[#123B40]/75 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm">
                            {formatNumber(farm.area)} {formatAreaUnit(farm.areaUnit || 'acres')}
                          </span>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="font-serif text-[25px] font-semibold leading-tight text-[#193E43]">
                        {farm.name}
                      </h3>

                      <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#5D7673]">
                        <span className="mt-0.5 shrink-0 text-[#4C827E]">
                          <LocationIcon />
                        </span>

                        <span>
                          {farmLocation(farm)}
                          {farm.pincode
                            ? ` · ${farm.pincode}`
                            : ''}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {[
                          {
                            label: 'Cycles',
                            value: count(farm.activeCropCyclesCount),
                          },
                          {
                            label: 'Tasks',
                            value: count(farm.pendingTasksCount),
                          },
                          {
                            label: 'Activities',
                            value: count(farm.totalActivitiesCount),
                          },
                        ].map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-xl bg-[#EFF7F1] px-2 py-3 text-center"
                          >
                            <p className="font-serif text-xl font-semibold text-[#265A5F]">
                              {metric.value}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#6F8582]">
                              {tr(metric.label)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-b border-[#E2EDE6] pb-4">
                        <span className="text-xs font-medium text-[#778B88]">{tr("Primary soil")}</span>

                        <span className="text-end text-xs font-bold text-[#396564]">
                          {soilLabel(farm.soilType)}
                        </span>
                      </div>

                      {farm.notes && (
                        <p className="mt-4 line-clamp-2 text-xs italic leading-5 text-[#718581]">
                          “{farm.notes}”
                        </p>
                      )}

                      <div className="mt-auto pt-6">
                        <Link
                          to={`/my-farms/${farm.id}`}
                          className={`${actionClass} w-full justify-between bg-[#265A5F] text-white hover:bg-[#17454A]`}
                        >{tr("View Farm Details")}<ArrowIcon />
                        </Link>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(farm)}
                            disabled={actionFarmId !== null}
                            className="rounded-lg px-3 py-2 text-xs font-bold text-[#456C69] hover:bg-[#ECF6EF] disabled:opacity-50"
                          >{tr("Edit Farm")}</button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleArchive(farm)
                            }
                            disabled={actionFarmId !== null}
                            className="rounded-lg px-3 py-2 text-xs font-bold text-[#748582] hover:bg-[#EFF4F0] disabled:opacity-50"
                          >
                            {busy ? tr("Updating...") : archived ? tr("Restore Farm") : tr("Archive Farm")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <nav
                aria-label={tr("Farm pages")}
                className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D7E7DE] bg-white px-4 py-3 sm:px-5"
              >
                <span className="text-xs font-semibold text-[#5D7673]">{tr("Page")}{pagination.currentPage} {tr("of")}{' '}
                  {pagination.totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                    disabled={page <= 1}
                    className={`${actionClass} border border-[#CCE1D6] bg-white text-[#265358] hover:bg-[#EDF7F0] disabled:opacity-40`}
                  >{tr("Previous")}</button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          pagination.totalPages,
                          current + 1
                        )
                      )
                    }
                    disabled={page >= pagination.totalPages}
                    className={`${actionClass} bg-[#265A5F] text-white hover:bg-[#17454A] disabled:opacity-40`}
                  >{tr("Next")}</button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Secondary navigation */}
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#D7E7DE] bg-[#EEF7F1] p-6 sm:p-8">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#1B4045]">{tr("Plan what comes next")}</h2>

          <p className="mt-2 text-sm text-[#5C7673]">{tr("Review upcoming farm tasks and activities in your calendar.")}</p>
        </div>

        <Link
          to="/my-farms/calendar"
          className={`${actionClass} bg-white text-[#265A5F] shadow-sm hover:bg-[#E1F1E8]`}
        >{tr("Open Farm Calendar")}<ArrowIcon />
        </Link>
      </section>

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2628]/70 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="flex max-h-[94vh] w-full max-w-[660px] flex-col overflow-hidden rounded-2xl bg-[#F8FCF9] shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#DAEAE0] bg-white px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-bold tracking-normal text-[#5E8D87]">{tr("Farm Management")}</p>

                <h2
                  id={modalTitleId}
                  className="mt-2 font-serif text-[27px] font-semibold text-[#193E43]"
                >
                  {editingFarm ? tr("Edit Farm") : tr("Register New Farm")}
                </h2>

                <p className="mt-1 text-xs text-[#6B837F]">{tr("Keep your land information accurate and organized.")}</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label={tr("Close farm form")}
                className="rounded-xl border border-[#DAE9E0] p-2.5 text-[#516D6B] hover:bg-[#ECF6EF] disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800"
                  >
                    {tr(formError)}
                  </div>
                )}

                <section className="space-y-4">
                  <h3 className="text-xs font-bold tracking-normal text-[#548280]">{tr("Farm Identity")}</h3>

                  <FormField
                    id={`${formId}-name`}
                    label={tr("Farm Name")}
                  >
                    <input
                      ref={nameInputRef}
                      id={`${formId}-name`}
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder={tr("e.g. Green Valley Farm")}
                      className={fieldClass}
                    />
                  </FormField>
                </section>

                <section className="space-y-4 border-t border-[#DCEBE1] pt-5">
                  <h3 className="text-xs font-bold tracking-normal text-[#548280]">{tr("Location")}</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id={`${formId}-state`}
                      label={tr("State")}
                      optional
                    >
                      <input
                        id={`${formId}-state`}
                        type="text"
                        value={state}
                        onChange={(event) =>
                          setState(event.target.value)
                        }
                        placeholder={tr("e.g. Andhra Pradesh")}
                        className={fieldClass}
                      />
                    </FormField>

                    <FormField
                      id={`${formId}-district`}
                      label={tr("District")}
                      optional
                    >
                      <input
                        id={`${formId}-district`}
                        type="text"
                        value={district}
                        onChange={(event) =>
                          setDistrict(event.target.value)
                        }
                        placeholder={tr("e.g. Guntur")}
                        className={fieldClass}
                      />
                    </FormField>

                    <FormField
                      id={`${formId}-village`}
                      label={tr("Village / Locality")}
                      optional
                    >
                      <input
                        id={`${formId}-village`}
                        type="text"
                        value={village}
                        onChange={(event) =>
                          setVillage(event.target.value)
                        }
                        placeholder={tr("Village or locality")}
                        className={fieldClass}
                      />
                    </FormField>

                    <FormField
                      id={`${formId}-pincode`}
                      label={tr("PIN Code")}
                      optional
                    >
                      <input
                        id={`${formId}-pincode`}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(event) =>
                          setPincode(event.target.value)
                        }
                        placeholder={tr("6-digit PIN code")}
                        className={fieldClass}
                      />
                    </FormField>
                  </div>
                </section>

                <section className="space-y-4 border-t border-[#DCEBE1] pt-5">
                  <h3 className="text-xs font-bold tracking-normal text-[#548280]">{tr("Land Details")}</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id={`${formId}-area`}
                      label={tr("Farm Area")}
                      optional
                    >
                      <input
                        id={`${formId}-area`}
                        type="number"
                        min="0"
                        step="any"
                        value={area}
                        onChange={(event) =>
                          setArea(event.target.value)
                        }
                        placeholder="e.g. 5.5"
                        className={fieldClass}
                      />
                    </FormField>

                    <FormField
                      id={`${formId}-unit`}
                      label={tr("Area Unit")}
                    >
                      <select
                        id={`${formId}-unit`}
                        value={areaUnit}
                        onChange={(event) =>
                          setAreaUnit(event.target.value)
                        }
                        className={fieldClass}
                      >
                        <option value="acres">{tr("Acres")}</option>
                        <option value="hectares">{tr("Hectares")}</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    id={`${formId}-soil`}
                    label={tr("Primary Soil Type")}
                    optional
                  >
                    <select
                      id={`${formId}-soil`}
                      value={soilType}
                      onChange={(event) =>
                        setSoilType(event.target.value)
                      }
                      className={fieldClass}
                    >
                      <option value="">{tr("Select soil type")}</option>

                      {SOILS.map((soil) => (
                        <option
                          key={soil.value}
                          value={soil.value}
                        >
                          {tr(soil.label)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </section>

                <section className="space-y-4 border-t border-[#DCEBE1] pt-5">
                  <h3 className="text-xs font-bold tracking-normal text-[#548280]">{tr("Additional Information")}</h3>

                  <FormField
                    id={`${formId}-notes`}
                    label={tr("Farm Notes")}
                    optional
                  >
                    <textarea
                      id={`${formId}-notes`}
                      rows={4}
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      placeholder={tr("Irrigation facilities, water sources, field observations...")}
                      className={`${fieldClass} resize-y`}
                    />
                  </FormField>
                </section>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#DAEAE0] bg-white px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className={`${actionClass} border border-[#D7E7DE] bg-white text-[#526E6C] hover:bg-[#F0F7F2] disabled:opacity-50`}
                >{tr("Cancel")}</button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${actionClass} bg-[#265A5F] text-white hover:bg-[#17454A] disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSaving ? tr("Saving...") : editingFarm ? tr("Save Changes") : tr("Register Farm")}

                  {!isSaving && <ArrowIcon size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
