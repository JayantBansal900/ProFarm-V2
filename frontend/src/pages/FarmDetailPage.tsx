import { tr, useLocale, locale, formatAreaUnit } from '../i18n';
import { cropImage, sceneImage } from '../data/media';
import { CROPS_DATA } from '../data/crops';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/api';
import type {
  FarmRecord,
  CropCycleRecord,
  FarmActivityRecord,
  FarmTaskRecord,
  FarmPagination,
  CreateCropCycleRequest,
  UpdateCropCycleRequest,
  ActivityCategory,
} from '../types/farm';

const PAGE_SIZE = 20;

const HERO =
  sceneImage('tractor-punjab');

const inputClass =
  'w-full rounded-xl border border-[#D1E4DA] bg-white px-4 py-3 text-sm text-[#234444] outline-none focus:border-[#407F7E] focus:ring-2 focus:ring-[#407F7E]/15';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#265A5F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17454A] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#D1E4D9] bg-white px-4 py-2.5 text-sm font-semibold text-[#416462] transition hover:bg-[#EDF6F0] disabled:opacity-50';

const textButton =
  'rounded-lg px-3 py-2 text-xs font-bold text-[#457572] transition hover:bg-[#EAF5EE] disabled:opacity-50';

const cardClass =
  'rounded-2xl border border-[#D7E7DE] bg-white p-5 sm:p-6';

type CropOption = {
  id: string;
  name: string;
};

type FieldErrors = Record<string, string>;

const ACTIVITY_CATEGORIES: {
  value: ActivityCategory;
  label: string;
}[] = [
  { value: 'general', label: 'General' },
  { value: 'sowing', label: 'Sowing' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'pest_disease', label: 'Pest / Disease' },
  { value: 'soil_preparation', label: 'Soil Preparation' },
  { value: 'harvesting', label: 'Harvesting' },
];

function readCropOptions(payload: unknown): CropOption[] {
  if (!payload || typeof payload !== 'object') return [];

  const root = payload as Record<string, unknown>;
  const data = root.data;

  const nested =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  const items = Array.isArray(root.crops)
    ? root.crops
    : Array.isArray(data)
      ? data
      : nested && Array.isArray(nested.crops)
        ? nested.crops
        : [];

  const result: CropOption[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    const id =
      typeof record.id === 'string'
        ? record.id
        : typeof record.cropId === 'string'
          ? record.cropId
          : '';

    const name =
      typeof record.name === 'string'
        ? record.name
        : typeof record.cropName === 'string'
          ? record.cropName
          : '';

    if (id && name && !result.some((crop) => crop.id === id)) {
      result.push({ id, name });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function getFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};

  const details = error.details as
    | { errors?: unknown }
    | undefined;

  if (!Array.isArray(details?.errors)) return {};

  const fields: FieldErrors = {};

  for (const entry of details.errors) {
    if (!entry || typeof entry !== 'object') continue;

    const item = entry as {
      field?: unknown;
      message?: unknown;
    };

    if (typeof item.message !== 'string') continue;

    const key =
      typeof item.field === 'string' && item.field
        ? item.field
        : '_form';

    fields[key] = item.message;
  }

  return fields;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function dateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function readableDate(value: string | null | undefined): string {
  if (!value) return 'Not set';

  const part = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part);

  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return value;
  }

  return date.toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function categoryLabel(category: string): string {
  return tr(
    ACTIVITY_CATEGORIES.find(
      (item) => item.value === category
    )?.label ?? category.replace(/_/g, ' ')
  );
}

function farmLocation(farm: FarmRecord): string {
  return (
    [farm.village, farm.district, farm.state]
      .filter(Boolean)
      .join(', ') || tr('Location not specified')
  );
}

function makePagination(
  totalRecords: number,
  currentPage: number
): FarmPagination {
  return {
    totalRecords,
    totalPages: Math.max(1, Math.ceil(totalRecords / PAGE_SIZE)),
    currentPage,
    limit: PAGE_SIZE,
  };
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  count: number;
  action: string;
  expanded: boolean;
  onAction: () => void;
  disabled?: boolean;
};

const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  count,
  action,
  expanded,
  onAction,
  disabled = false,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[13px] font-bold tracking-normal text-[#578580]">
        {tr(eyebrow)}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <h2 className="font-serif text-[27px] font-semibold text-[#183B3F]">
          {tr(title)}
        </h2>

        <span className="rounded-full bg-[#E5F4EB] px-2.5 py-1 text-xs font-bold text-[#417570]">
          {count}
        </span>
      </div>
    </div>

    <button
      type="button"
      onClick={onAction}
      disabled={disabled}
      className={primaryButton}
    >
      {expanded ? tr("Close Form") : `+ ${action}`}
    </button>
  </div>
);

const EmptySection: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="rounded-2xl border border-dashed border-[#C4DBD0] bg-[#F5FAF6] px-6 py-10 text-center">
    <div className="text-3xl">🌱</div>

    <h3 className="mt-4 font-serif text-xl font-semibold text-[#234B4D]">
      {tr(title)}
    </h3>

    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6F8681]">
      {tr(description)}
    </p>
  </div>
);

const FormActions: React.FC<{
  onCancel: () => void;
  saving: boolean;
  label: string;
}> = ({ onCancel, saving, label }) => (
  <div className="flex flex-wrap justify-end gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      disabled={saving}
      className={secondaryButton}
    >{tr("Cancel")}</button>

    <button
      type="submit"
      disabled={saving}
      className={primaryButton}
    >
      {saving ? tr("Saving...") : tr(label)}
    </button>
  </div>
);

const PaginationControls: React.FC<{
  pagination: FarmPagination | null;
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  label: string;
}> = ({
  pagination,
  page,
  onPageChange,
  disabled = false,
  label,
}) => {
  if (!pagination || pagination.totalRecords === 0) return null;

  const start = (page - 1) * pagination.limit + 1;
  const end = Math.min(
    page * pagination.limit,
    pagination.totalRecords
  );

  return (
    <nav
      aria-label={tr("{{v0}} pagination", { v0: label })}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D7E7DE] bg-white px-4 py-3"
    >
      <div>
        <p className="text-xs font-semibold text-[#466664]">{tr("Showing")}{start}–{end} {tr("of")} {pagination.totalRecords}
        </p>

        <p className="mt-1 text-xs text-[#80938F]">{tr("Page")}{page} {tr("of")} {pagination.totalPages}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={secondaryButton}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >{tr("Previous")}</button>

        <button
          type="button"
          className={primaryButton}
          disabled={
            disabled || page >= pagination.totalPages
          }
          onClick={() => onPageChange(page + 1)}
        >{tr("Next")}</button>
      </div>
    </nav>
  );
};

export const FarmDetailPage: React.FC = () => {
  useLocale();
  const { farmId } = useParams<{ farmId: string }>();

  const [farm, setFarm] = useState<FarmRecord | null>(null);
  const [cropCycles, setCropCycles] = useState<CropCycleRecord[]>([]);
  const [activities, setActivities] = useState<FarmActivityRecord[]>([]);
  const [tasks, setTasks] = useState<FarmTaskRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [activityPage, setActivityPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);

  const [activityPagination, setActivityPagination] =
    useState<FarmPagination | null>(null);

  const [taskPagination, setTaskPagination] =
    useState<FarmPagination | null>(null);

  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [activitiesError, setActivitiesError] =
    useState<string | null>(null);

  const [tasksError, setTasksError] =
    useState<string | null>(null);

  const farmRequestId = useRef(0);
  const activityRequestId = useRef(0);
  const taskRequestId = useRef(0);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState<number | ''>('');
  const [editAreaUnit, setEditAreaUnit] = useState('acres');

  const [showCycleForm, setShowCycleForm] = useState(false);

  const [newCycle, setNewCycle] = useState({
    cropId: '',
    sowingDate: '',
  });

  const [editCycleId, setEditCycleId] = useState<string | null>(null);

  const [editCycleData, setEditCycleData] = useState({
    cropId: '',
    sowingDate: '',
  });

  const [cropOptions, setCropOptions] = useState<CropOption[]>([]);
  const [cropCatalogError, setCropCatalogError] =
    useState<string | null>(null);

  const [cycleFieldErrors, setCycleFieldErrors] =
    useState<FieldErrors>({});

  const [showActivityForm, setShowActivityForm] = useState(false);

  const [newActivity, setNewActivity] = useState({
    title: '',
    category: 'general' as ActivityCategory,
    activityDate: '',
  });

  const [editActivityId, setEditActivityId] =
    useState<string | null>(null);

  const [editActivityData, setEditActivityData] = useState({
    title: '',
    category: 'general' as ActivityCategory,
    activityDate: '',
  });

  const [showTaskForm, setShowTaskForm] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
  });

  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const [editTaskData, setEditTaskData] = useState({
    title: '',
    dueDate: '',
  });

  // Load the complete crop catalog, not a paginated
  // subset of the farm's crop cycles.
  useEffect(() => {
    let cancelled = false;

    void api
      .getAdvisorCrops()
      .then((response) => {
        if (cancelled) return;

        const options = readCropOptions(response);
        setCropOptions(options);

        setCropCatalogError(
          options.length
            ? null
            : 'The crop catalog could not be read.'
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCropCatalogError(
            'Unable to load the crop catalog. Please reload.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cycleOptionsFor = (
    currentId: string,
    currentName: string
  ): CropOption[] => {
    if (
      !currentId ||
      cropOptions.some((crop) => crop.id === currentId)
    ) {
      return cropOptions;
    }

    return [
      {
        id: currentId,
        name: `${currentName || currentId} (historical crop)`,
      },
      ...cropOptions,
    ];
  };

  const showCycleError = (field: string) =>
    cycleFieldErrors[field] ? (
      <span role="alert" className="block text-xs text-red-700">
        {tr(cycleFieldErrors[field])}
      </span>
    ) : null;

  // Fetch farm and ALL crop cycles.
  // The legacy unpaginated crop-cycle contract is retained.
  const fetchFarm = useCallback(async () => {
    const request = ++farmRequestId.current;

    if (!farmId) {
      setLoading(false);
      setError('Farm identifier is missing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [farmResponse, cyclesResponse] = await Promise.all([
        api.getFarmById(farmId),
        api.getCropCycles(farmId),
      ]);

      if (request !== farmRequestId.current) return;

      const data = farmResponse.data;

      setFarm(data);
      setCropCycles(cyclesResponse.data || []);

      setEditName(data.name);
      setEditArea(data.area ?? '');
      setEditAreaUnit(data.areaUnit || 'acres');
    } catch (err) {
      if (request !== farmRequestId.current) return;

      setError(
        errorMessage(err, 'Failed to load farm details.')
      );
    } finally {
      if (request === farmRequestId.current) {
        setLoading(false);
      }
    }
  }, [farmId]);

  // Activities have their own page and request lifecycle.
  const fetchActivities = useCallback(async () => {
    const request = ++activityRequestId.current;

    if (!farmId) return;

    setActivitiesLoading(true);
    setActivitiesError(null);

    try {
      const response = await api.getFarmActivities(farmId, {
        page: activityPage,
        limit: PAGE_SIZE,
      });

      if (request !== activityRequestId.current) return;

      const pagination =
        response.pagination ??
        makePagination(
          response.activities?.length ?? 0,
          activityPage
        );

      if (activityPage > pagination.totalPages) {
        setActivityPage(pagination.totalPages);
        return;
      }

      setActivities(response.activities || []);
      setActivityPagination(pagination);
    } catch (err) {
      if (request !== activityRequestId.current) return;

      setActivitiesError(
        errorMessage(err, 'Failed to load activities.')
      );
    } finally {
      if (request === activityRequestId.current) {
        setActivitiesLoading(false);
      }
    }
  }, [farmId, activityPage]);

  // Tasks have a completely independent page.
  const fetchTasks = useCallback(async () => {
    const request = ++taskRequestId.current;

    if (!farmId) return;

    setTasksLoading(true);
    setTasksError(null);

    try {
      const response = await api.getFarmTasks(farmId, {
        page: taskPage,
        limit: PAGE_SIZE,
      });

      if (request !== taskRequestId.current) return;

      const pagination =
        response.pagination ??
        makePagination(
          response.tasks?.length ?? 0,
          taskPage
        );

      if (taskPage > pagination.totalPages) {
        setTaskPage(pagination.totalPages);
        return;
      }

      setTasks(response.tasks || []);
      setTaskPagination(pagination);
    } catch (err) {
      if (request !== taskRequestId.current) return;

      setTasksError(
        errorMessage(err, 'Failed to load tasks.')
      );
    } finally {
      if (request === taskRequestId.current) {
        setTasksLoading(false);
      }
    }
  }, [farmId, taskPage]);

  useEffect(() => {
    void fetchFarm();

    return () => {
      farmRequestId.current += 1;
    };
  }, [fetchFarm]);

  useEffect(() => {
    void fetchActivities();

    return () => {
      activityRequestId.current += 1;
    };
  }, [fetchActivities]);

  useEffect(() => {
    void fetchTasks();

    return () => {
      taskRequestId.current += 1;
    };
  }, [fetchTasks]);

  useEffect(() => {
    setActivityPage(1);
    setTaskPage(1);
    setEditActivityId(null);
    setEditTaskId(null);
  }, [farmId]);

  const refreshFarmSummary = async () => {
    if (!farmId) return;

    const response = await api.getFarmById(farmId);
    setFarm(response.data);
  };

  const refreshActivitiesAfterMutation = async () => {
    if (!farmId) return;

    await fetchActivities();
    await refreshFarmSummary();
  };

  const refreshTasksAfterMutation = async () => {
    if (!farmId) return;

    await fetchTasks();
    await refreshFarmSummary();
  };

  const runAction = async (
    action: () => Promise<void>,
    fallback: string,
    cropMutation = false
  ) => {
    if (busy) return;

    setBusy(true);
    setActionError(null);

    if (cropMutation) {
      setCycleFieldErrors({});
    }

    try {
      await action();
    } catch (err) {
      setActionError(errorMessage(err, fallback));

      if (cropMutation) {
        setCycleFieldErrors(getFieldErrors(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFarmUpdate = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    if (!farm) return;

    await runAction(async () => {
      const response = await api.updateFarm(farm.id, {
        name: editName.trim(),
        area: editArea === '' ? undefined : editArea,
        areaUnit: editAreaUnit || undefined,
      });

      setFarm(response.data);
      setEditMode(false);
    }, 'Failed to update farm.');
  };

  const toggleArchive = async () => {
    if (!farm) return;

    await runAction(async () => {
      const response = farm.isArchived
        ? await api.restoreFarm(farm.id)
        : await api.archiveFarm(farm.id);

      setFarm(response.data);
    }, 'Failed to change archive status.');
  };

  const handleCreateCycle = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!farm || !newCycle.cropId || !newCycle.sowingDate) {
      return;
    }

    const body: CreateCropCycleRequest = {
      cropId: newCycle.cropId,
      sowingDate: newCycle.sowingDate,
      status: 'planned',
    };

    await runAction(
      async () => {
        await api.createCropCycle(farm.id, body);

        const response = await api.getCropCycles(farm.id);
        setCropCycles(response.data || []);

        await refreshFarmSummary();

        setNewCycle({
          cropId: '',
          sowingDate: '',
        });

        setShowCycleForm(false);
      },
      'Failed to create crop cycle.',
      true
    );
  };

  const handleUpdateCycle = async (
    event: React.FormEvent,
    cycleId: string
  ) => {
    event.preventDefault();
    if (!farm) return;

    const original = cropCycles.find(
      (cycle) => cycle.id === cycleId
    );

    if (!original) return;

    const body: UpdateCropCycleRequest = {};

    if (editCycleData.cropId !== original.cropId) {
      body.cropId = editCycleData.cropId;
    }

    if (
      editCycleData.sowingDate !==
      dateInputValue(original.sowingDate)
    ) {
      body.sowingDate = editCycleData.sowingDate;
    }

    if (Object.keys(body).length === 0) {
      setCycleFieldErrors({
        _form: 'No changes to save.',
      });
      return;
    }

    await runAction(
      async () => {
        await api.updateCropCycle(farm.id, cycleId, body);

        const response = await api.getCropCycles(farm.id);
        setCropCycles(response.data || []);

        await refreshFarmSummary();
        setEditCycleId(null);
      },
      'Failed to update crop cycle.',
      true
    );
  };

  const handleCreateActivity = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    if (!farm) return;

    await runAction(async () => {
      await api.createFarmActivity(farm.id, {
        title: newActivity.title.trim(),
        category: newActivity.category,
        activityDate: newActivity.activityDate,
      });

      setNewActivity({
        title: '',
        category: 'general',
        activityDate: '',
      });

      setShowActivityForm(false);

      if (activityPage !== 1) {
        setActivityPage(1);
      } else {
        await refreshActivitiesAfterMutation();
      }
    }, 'Failed to create activity.');
  };

  const handleUpdateActivity = async (
    event: React.FormEvent,
    activityId: string
  ) => {
    event.preventDefault();
    if (!farm) return;

    await runAction(async () => {
      await api.updateFarmActivity(farm.id, activityId, {
        title: editActivityData.title.trim(),
        category: editActivityData.category,
        activityDate: editActivityData.activityDate,
      });

      setEditActivityId(null);
      await refreshActivitiesAfterMutation();
    }, 'Failed to update activity.');
  };

  const handleDeleteActivity = async (
    activityId: string
  ) => {
    if (!farm) return;

    if (
      !window.confirm(
        tr('Delete this activity? This cannot be undone.')
      )
    ) {
      return;
    }

    await runAction(async () => {
      await api.deleteFarmActivity(farm.id, activityId);

      setEditActivityId(null);
      await refreshActivitiesAfterMutation();
    }, 'Failed to delete activity.');
  };

  const handleCreateTask = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    if (!farm) return;

    await runAction(async () => {
      await api.createFarmTask(farm.id, {
        title: newTask.title.trim(),
        dueDate: newTask.dueDate,
        status: 'pending',
        category: 'general',
      });

      setNewTask({
        title: '',
        dueDate: '',
      });

      setShowTaskForm(false);

      if (taskPage !== 1) {
        setTaskPage(1);
      } else {
        await refreshTasksAfterMutation();
      }
    }, 'Failed to create task.');
  };

  const handleUpdateTask = async (
    event: React.FormEvent,
    taskId: string
  ) => {
    event.preventDefault();
    if (!farm) return;

    await runAction(async () => {
      await api.updateFarmTask(farm.id, taskId, {
        title: editTaskData.title.trim(),
        dueDate: editTaskData.dueDate,
      });

      setEditTaskId(null);
      await refreshTasksAfterMutation();
    }, 'Failed to update task.');
  };

  const toggleTaskStatus = async (
    task: FarmTaskRecord
  ) => {
    if (!farm) return;

    await runAction(async () => {
      await api.updateFarmTask(farm.id, task.id, {
        status:
          task.status === 'pending'
            ? 'completed'
            : 'pending',
      });

      await refreshTasksAfterMutation();
    }, 'Failed to update task status.');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-5 pb-16">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-[#DFEEE6]" />
        <div className="h-[290px] animate-pulse rounded-2xl bg-[#D6E9DE]" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-[#E9F3EC]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="mx-auto max-w-[900px] py-12">
        <div className={`${cardClass} text-center`}>
          <h1 className="font-serif text-3xl font-semibold text-[#183B3F]">{tr("Farm unavailable")}</h1>

          <p className="mt-3 text-sm text-[#657D79]">
            {tr(error) || tr("The requested farm could not be found.")}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link to="/my-farms" className={secondaryButton}>{tr("Back to Farms")}</Link>

            <button
              type="button"
              onClick={() => void fetchFarm()}
              className={primaryButton}
            >{tr("Retry")}</button>
          </div>
        </div>
      </div>
    );
  }

  const activeCycles = cropCycles.filter(
    (cycle) => cycle.status === 'active'
  ).length;

  // The farm detail response supplies aggregate counts.
  // Do not derive farm-wide totals from a single page.
  const pendingTasks = farm.pendingTasksCount ?? 0;
  const totalActivities = farm.totalActivitiesCount ?? 0;

  // Show the crop being grown (latest active cycle) in the banner; fall back to a field scene.
  const growing = cropCycles.find((cycle) => cycle.status === 'active');
  const growingCrop = growing ? CROPS_DATA.find((crop) => crop.id === growing.cropId) : undefined;
  const heroPhoto = (growingCrop && cropImage(growingCrop.slug)?.src) || HERO;

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 pb-16 text-[#234444]">
      {/* Breadcrumb */}
      <nav
        aria-label={tr("Breadcrumb")}
        className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#65817D]"
      >
        <Link to="/" className="hover:text-[#265A5F]">{tr("Home")}</Link>
        <span>/</span>
        <Link
          to="/my-farms"
          className="hover:text-[#265A5F]"
        >{tr("My Farms")}</Link>
        <span>/</span>
        <span className="font-semibold text-[#265A5F]">
          {farm.name}
        </span>
      </nav>

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#13393E]">
        <img
          src={heroPhoto}
          alt={tr("Illustrative green agricultural landscape")}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0E3338]/95 via-[#154348]/85 to-[#154348]/20" />

        <div className="relative flex min-h-[280px] flex-col justify-center p-7 text-white sm:p-10 lg:p-12">
          <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-normal">
            {farm.isArchived ? tr("Archived Farm") : tr("Farm Workspace")}
          </span>

          <h1 className="mt-5 max-w-2xl break-words font-serif text-4xl font-semibold sm:text-5xl">
            {farm.name}
          </h1>

          <p className="mt-4 text-sm text-[#DFF0EA]">
            {farmLocation(farm)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={farm.isArchived}
              onClick={() => {
                setEditMode((value) => !value);
                setActionError(null);
              }}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#225458] hover:bg-[#E9F5ED] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editMode ? tr("Close Edit") : tr("Edit Farm")}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleArchive()}
              className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50"
            >
              {farm.isArchived ? tr("Restore Farm") : tr("Archive Farm")}
            </button>
          </div>
        </div>
      </section>

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span>{tr(actionError)}</span>

          <button
            type="button"
            onClick={() => setActionError(null)}
            className="font-bold underline"
          >{tr("Dismiss")}</button>
        </div>
      )}

      {/* Farm edit */}
      {editMode && !farm.isArchived && (
        <form
          onSubmit={handleFarmUpdate}
          className="space-y-5 rounded-2xl border border-[#D7E7DE] bg-[#F5FAF6] p-6 sm:p-8"
        >
          <h2 className="font-serif text-2xl font-semibold text-[#183B3F]">{tr("Edit Farm Details")}</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 sm:col-span-3">
              <span className="text-xs font-bold">{tr("Farm Name")}</span>

              <input
                required
                minLength={2}
                value={editName}
                onChange={(event) =>
                  setEditName(event.target.value)
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold">{tr("Farm Area")}</span>

              <input
                type="number"
                min="0"
                step="any"
                value={editArea}
                onChange={(event) =>
                  setEditArea(
                    event.target.value === ''
                      ? ''
                      : Number(event.target.value)
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold">{tr("Unit")}</span>

              <select
                value={editAreaUnit}
                onChange={(event) =>
                  setEditAreaUnit(event.target.value)
                }
                className={inputClass}
              >
                <option value="acres">{tr("Acres")}</option>
                <option value="hectares">{tr("Hectares")}</option>
              </select>
            </label>
          </div>

          <FormActions
            saving={busy}
            label={tr("Save Farm")}
            onCancel={() => setEditMode(false)}
          />
        </form>
      )}

      {/* Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Land Area',
            value: farm.area ?? '—',
            detail: formatAreaUnit(farm.areaUnit),
          },
          {
            label: 'Active Crop Cycles',
            value: activeCycles,
            detail: tr('{{count}} total cycles', { count: cropCycles.length }),
          },
          {
            label: 'Pending Tasks',
            value: pendingTasks,
            detail: tr('{{count}} total tasks', { count: taskPagination?.totalRecords ?? 0 }),
          },
          {
            label: 'Farm Activities',
            value: totalActivities,
            detail: 'Recorded activities',
          },
        ].map((metric) => (
          <div key={metric.label} className={cardClass}>
            <p className="text-xs font-semibold text-[#67827E]">
              {tr(metric.label)}
            </p>

            <p className="mt-3 font-serif text-4xl font-semibold text-[#1E4D52]">
              {metric.value}
            </p>

            <p className="mt-2 text-xs text-[#829591]">
              {tr(metric.detail)}
            </p>
          </div>
        ))}
      </section>

      {/* Crop cycles */}
      <section id="crop-cycles" className="space-y-5">
        {cropCatalogError && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {tr(cropCatalogError)}
          </p>
        )}

        {showCycleError('_form')}

        <SectionHeading
          eyebrow={tr("Cultivation planning")}
          title={tr("Crop Cycles")}
          count={cropCycles.length}
          action={tr("Add Crop Cycle")}
          disabled={farm.isArchived}
          expanded={showCycleForm}
          onAction={() => {
            setShowCycleForm((value) => !value);
            setCycleFieldErrors({});
          }}
        />

        {showCycleForm && !farm.isArchived && (
          <form
            onSubmit={handleCreateCycle}
            className="space-y-4 rounded-2xl border border-[#D7E7DE] bg-[#F5FAF6] p-5 sm:p-6"
          >
            <h3 className="font-serif text-xl font-semibold">{tr("New Crop Cycle")}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold">{tr("Crop")}</span>

                <select
                  required
                  value={newCycle.cropId}
                  disabled={cropOptions.length === 0}
                  onChange={(event) =>
                    setNewCycle((value) => ({
                      ...value,
                      cropId: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">{tr("Select a crop")}</option>

                  {cropOptions.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {tr(crop.name)}
                    </option>
                  ))}
                </select>

                {showCycleError('cropId')}
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold">{tr("Sowing Date")}</span>

                <input
                  required
                  type="date"
                  value={newCycle.sowingDate}
                  onChange={(event) =>
                    setNewCycle((value) => ({
                      ...value,
                      sowingDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />

                {showCycleError('sowingDate')}
              </label>
            </div>

            <FormActions
              saving={busy}
              label={tr("Create Cycle")}
              onCancel={() => setShowCycleForm(false)}
            />
          </form>
        )}

        {cropCycles.length === 0 ? (
          <EmptySection
            title={tr("No crop cycles yet")}
            description={tr("Add a crop cycle to start tracking cultivation and sowing dates.")}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {cropCycles.map((cycle) => (
              <article key={cycle.id} className={cardClass}>
                {editCycleId === cycle.id ? (
                  <form
                    onSubmit={(event) =>
                      void handleUpdateCycle(event, cycle.id)
                    }
                    className="space-y-4"
                  >
                    <h3 className="font-serif text-xl font-semibold">{tr("Edit Crop Cycle")}</h3>

                    <label className="block space-y-2">
                      <span className="text-xs font-bold">{tr("Crop")}</span>

                      <select
                        required
                        value={editCycleData.cropId}
                        onChange={(event) =>
                          setEditCycleData((value) => ({
                            ...value,
                            cropId: event.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        {cycleOptionsFor(
                          cycle.cropId,
                          cycle.cropName
                        ).map((crop) => (
                          <option
                            key={crop.id}
                            value={crop.id}
                          >
                            {tr(crop.name)}
                          </option>
                        ))}
                      </select>

                      {showCycleError('cropId')}
                    </label>

                    <label className="block space-y-2">
                      <span className="text-xs font-bold">{tr("Sowing Date")}</span>

                      <input
                        required
                        type="date"
                        value={editCycleData.sowingDate}
                        onChange={(event) =>
                          setEditCycleData((value) => ({
                            ...value,
                            sowingDate: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />

                      {showCycleError('sowingDate')}
                    </label>

                    <p className="text-xs text-[#6F8681]">{tr("Only changed fields will be saved. The cycle status remains unchanged.")}</p>

                    <FormActions
                      saving={busy}
                      label={tr("Save Cycle")}
                      onCancel={() => {
                        setEditCycleId(null);
                        setCycleFieldErrors({});
                      }}
                    />
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold tracking-normal text-[#72918A]">{tr("Cultivation Record")}</p>

                        <h3 className="mt-2 font-serif text-2xl font-semibold text-[#1B4045]">
                          {cycle.cropName}
                        </h3>
                      </div>

                      <span className="rounded-full bg-[#E5F4EB] px-3 py-1.5 text-[13px] font-bold capitalize text-[#37726F]">
                        {tr(cycle.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-xl bg-[#F1F8F3] p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[13px] text-[#80938F]">{tr("Sowing")}</p>

                        <p className="mt-1 text-sm font-bold text-[#335D59]">
                          {readableDate(cycle.sowingDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[13px] text-[#80938F]">{tr("Expected Harvest")}</p>

                        <p className="mt-1 text-sm font-bold text-[#335D59]">
                          {readableDate(
                            cycle.expectedHarvestDate
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busy || farm.isArchived}
                      className={`${textButton} mt-4`}
                      onClick={() => {
                        setCycleFieldErrors({});
                        setEditCycleId(cycle.id);
                        setEditCycleData({
                          cropId: cycle.cropId,
                          sowingDate: dateInputValue(
                            cycle.sowingDate
                          ),
                        });
                      }}
                    >{tr("Edit Cycle")}</button>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Activities */}
      <section id="activities" className="space-y-5">
        <SectionHeading
          eyebrow={tr("Field history")}
          title={tr("Farm Activities")}
          count={
            activityPagination?.totalRecords ??
            activities.length
          }
          action={tr("Log Activity")}
          disabled={farm.isArchived}
          expanded={showActivityForm}
          onAction={() =>
            setShowActivityForm((value) => !value)
          }
        />

        {showActivityForm && !farm.isArchived && (
          <form
            onSubmit={handleCreateActivity}
            className="space-y-4 rounded-2xl border border-[#D7E7DE] bg-[#F5FAF6] p-5 sm:p-6"
          >
            <h3 className="font-serif text-xl font-semibold">{tr("Record an Activity")}</h3>

            <label className="block space-y-2">
              <span className="text-xs font-bold">{tr("Activity Title")}</span>

              <input
                required
                value={newActivity.title}
                onChange={(event) =>
                  setNewActivity((value) => ({
                    ...value,
                    title: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder={tr("e.g. Irrigated north field")}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold">{tr("Category")}</span>

                <select
                  value={newActivity.category}
                  onChange={(event) =>
                    setNewActivity((value) => ({
                      ...value,
                      category:
                        event.target.value as ActivityCategory,
                    }))
                  }
                  className={inputClass}
                >
                  {ACTIVITY_CATEGORIES.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {tr(category.label)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold">{tr("Activity Date")}</span>

                <input
                  required
                  type="date"
                  value={newActivity.activityDate}
                  onChange={(event) =>
                    setNewActivity((value) => ({
                      ...value,
                      activityDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <FormActions
              saving={busy}
              label={tr("Save Activity")}
              onCancel={() => setShowActivityForm(false)}
            />
          </form>
        )}

        {activitiesError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{tr(activitiesError)}</span>

            <button
              type="button"
              onClick={() => void fetchActivities()}
              className="font-bold underline"
            >{tr("Retry")}</button>
          </div>
        )}

        {activitiesLoading ? (
          <div className={`${cardClass} text-sm text-[#6B837F]`}>{tr("Loading activities...")}</div>
        ) : !activitiesError && activities.length === 0 ? (
          <EmptySection
            title={tr("No activities recorded")}
            description={tr("Log irrigation, sowing, harvesting and other work to build your farm history.")}
          />
        ) : !activitiesError ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <article key={activity.id} className={cardClass}>
                {editActivityId === activity.id ? (
                  <form
                    onSubmit={(event) =>
                      void handleUpdateActivity(
                        event,
                        activity.id
                      )
                    }
                    className="space-y-4"
                  >
                    <label className="block space-y-2">
                      <span className="text-xs font-bold">{tr("Title")}</span>

                      <input
                        required
                        value={editActivityData.title}
                        onChange={(event) =>
                          setEditActivityData((value) => ({
                            ...value,
                            title: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-bold">{tr("Category")}</span>

                        <select
                          value={editActivityData.category}
                          onChange={(event) =>
                            setEditActivityData((value) => ({
                              ...value,
                              category:
                                event.target
                                  .value as ActivityCategory,
                            }))
                          }
                          className={inputClass}
                        >
                          {ACTIVITY_CATEGORIES.map(
                            (category) => (
                              <option
                                key={category.value}
                                value={category.value}
                              >
                                {tr(category.label)}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-bold">{tr("Date")}</span>

                        <input
                          required
                          type="date"
                          value={editActivityData.activityDate}
                          onChange={(event) =>
                            setEditActivityData((value) => ({
                              ...value,
                              activityDate:
                                event.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <FormActions
                      saving={busy}
                      label={tr("Save Activity")}
                      onCancel={() =>
                        setEditActivityId(null)
                      }
                    />
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="rounded-full bg-[#E5F4EB] px-3 py-1 text-xs font-bold text-[#447570]">
                        {categoryLabel(activity.category)}
                      </span>

                      <h3 className="mt-3 break-words font-serif text-xl font-semibold text-[#1F474A]">
                        {activity.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#77918C]">
                        {readableDate(
                          activity.activityDate
                        )}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busy || farm.isArchived}
                        className={textButton}
                        onClick={() => {
                          setEditActivityId(activity.id);
                          setEditActivityData({
                            title: activity.title,
                            category: activity.category,
                            activityDate: dateInputValue(
                              activity.activityDate
                            ),
                          });
                        }}
                      >{tr("Edit")}</button>

                      <button
                        type="button"
                        disabled={busy || farm.isArchived}
                        className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        onClick={() =>
                          void handleDeleteActivity(
                            activity.id
                          )
                        }
                      >{tr("Delete")}</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : null}

        {!activitiesLoading && !activitiesError && (
          <PaginationControls
            pagination={activityPagination}
            page={activityPage}
            disabled={busy}
            label={tr("Activities")}
            onPageChange={(nextPage) => {
              setEditActivityId(null);
              setActivityPage(nextPage);
            }}
          />
        )}
      </section>

      {/* Tasks */}
      <section id="tasks" className="space-y-5">
        <SectionHeading
          eyebrow={tr("Upcoming work")}
          title={tr("Farm Tasks")}
          count={
            taskPagination?.totalRecords ?? tasks.length
          }
          action={tr("Add Task")}
          disabled={farm.isArchived}
          expanded={showTaskForm}
          onAction={() =>
            setShowTaskForm((value) => !value)
          }
        />

        {showTaskForm && !farm.isArchived && (
          <form
            onSubmit={handleCreateTask}
            className="space-y-4 rounded-2xl border border-[#D7E7DE] bg-[#F5FAF6] p-5 sm:p-6"
          >
            <h3 className="font-serif text-xl font-semibold">{tr("Create a Task")}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold">{tr("Task Title")}</span>

                <input
                  required
                  value={newTask.title}
                  onChange={(event) =>
                    setNewTask((value) => ({
                      ...value,
                      title: event.target.value,
                    }))
                  }
                  placeholder={tr("e.g. Check irrigation")}
                  className={inputClass}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold">{tr("Due Date")}</span>

                <input
                  required
                  type="date"
                  value={newTask.dueDate}
                  onChange={(event) =>
                    setNewTask((value) => ({
                      ...value,
                      dueDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <FormActions
              saving={busy}
              label={tr("Create Task")}
              onCancel={() => setShowTaskForm(false)}
            />
          </form>
        )}

        {tasksError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{tr(tasksError)}</span>

            <button
              type="button"
              onClick={() => void fetchTasks()}
              className="font-bold underline"
            >{tr("Retry")}</button>
          </div>
        )}

        {tasksLoading ? (
          <div className={`${cardClass} text-sm text-[#6B837F]`}>{tr("Loading tasks...")}</div>
        ) : !tasksError && tasks.length === 0 ? (
          <EmptySection
            title={tr("No tasks scheduled")}
            description={tr("Create tasks to keep track of upcoming farm work and important dates.")}
          />
        ) : !tasksError ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <article key={task.id} className={cardClass}>
                {editTaskId === task.id ? (
                  <form
                    onSubmit={(event) =>
                      void handleUpdateTask(event, task.id)
                    }
                    className="space-y-4"
                  >
                    <label className="block space-y-2">
                      <span className="text-xs font-bold">{tr("Task Title")}</span>

                      <input
                        required
                        value={editTaskData.title}
                        onChange={(event) =>
                          setEditTaskData((value) => ({
                            ...value,
                            title: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-xs font-bold">{tr("Due Date")}</span>

                      <input
                        required
                        type="date"
                        value={editTaskData.dueDate}
                        onChange={(event) =>
                          setEditTaskData((value) => ({
                            ...value,
                            dueDate: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <FormActions
                      saving={busy}
                      label={tr("Save Task")}
                      onCancel={() => setEditTaskId(null)}
                    />
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words font-serif text-xl font-semibold text-[#1F474A]">
                        {task.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#77918C]">{tr("Due")}{readableDate(task.dueDate)}
                      </p>

                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          task.status === 'pending'
                            ? 'bg-[#FFF4DE] text-[#946D28]'
                            : 'bg-[#E4F4EC] text-[#377575]'
                        }`}
                      >
                        {tr(task.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={busy || farm.isArchived}
                        className={textButton}
                        onClick={() => {
                          setEditTaskId(task.id);
                          setEditTaskData({
                            title: task.title,
                            dueDate: dateInputValue(
                              task.dueDate
                            ),
                          });
                        }}
                      >{tr("Edit")}</button>

                      <button
                        type="button"
                        disabled={busy || farm.isArchived}
                        className={textButton}
                        onClick={() =>
                          void toggleTaskStatus(task)
                        }
                      >
                        {task.status === 'pending' ? tr("Complete") : tr("Reopen")}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : null}

        {!tasksLoading && !tasksError && (
          <PaginationControls
            pagination={taskPagination}
            page={taskPage}
            disabled={busy}
            label={tr("Tasks")}
            onPageChange={(nextPage) => {
              setEditTaskId(null);
              setTaskPage(nextPage);
            }}
          />
        )}
      </section>

      {/* Calendar shortcut */}
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#D7E7DE] bg-[#EEF7F1] p-6 sm:p-8">
        <div>
          <p className="text-[13px] font-bold tracking-normal text-[#578580]">{tr("Farm Planning")}</p>

          <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1B4045]">{tr("Keep your schedule on track")}</h2>

          <p className="mt-2 text-sm text-[#617B78]">{tr("Review upcoming tasks and farming activities in your calendar.")}</p>
        </div>

        <Link
          to={`/my-farms/calendar?farmId=${encodeURIComponent(farm.id)}`}
          className={primaryButton}
        >{tr("Open Farm Calendar →")}</Link>
      </section>
    </div>
  );
};
