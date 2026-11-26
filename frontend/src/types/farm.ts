
/**
 * ProFarm V2
 * Farm Management API Types
 *
 * Phase 3:
 * - Shared pagination metadata
 * - Optional crop-cycle pagination
 * - Calendar harvest milestone distinctions
 * - Calendar invalid-date diagnostics
 *
 * Existing Phase 2 contracts are preserved.
 */

// ============================================================
// SHARED PAGINATION TYPES
// ============================================================

export interface FarmPagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// ============================================================
// FARM
// ============================================================

export interface FarmRecord {
  id: string;
  userId: string;
  name: string;

  state?: string | null;
  district?: string | null;
  village?: string | null;
  pincode?: string | null;

  area?: number | null;
  areaUnit?: string | null;
  soilType?: string | null;
  notes?: string | null;

  isArchived: boolean;
  archivedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  activeCropCyclesCount?: number;
  pendingTasksCount?: number;
  totalActivitiesCount?: number;
  overdueTasksCount?: number;

  cropCycles?: CropCycleRecord[];
  tasks?: FarmTaskRecord[];
  activities?: FarmActivityRecord[];
}

// ============================================================
// CROP CYCLES
// ============================================================

export type CropCycleStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled';

export type CropCycleAreaUnit =
  | 'acres'
  | 'hectares';

export interface CropCycleRecord {
  id: string;
  farmId: string;

  cropId: string;
  cropName: string;

  variety?: string | null;

  /** YYYY-MM-DD */
  sowingDate: string;

  /** YYYY-MM-DD */
  expectedHarvestDate?: string | null;

  /** YYYY-MM-DD */
  actualHarvestDate?: string | null;

  status: CropCycleStatus;

  cultivatedArea?: number | null;
  areaUnit?: string | null;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * POST /api/farms/:farmId/cycles
 *
 * Use the canonical cropId.
 * The backend derives cropName from its crop catalog.
 */
export interface CreateCropCycleRequest {
  cropId: string;

  /** YYYY-MM-DD */
  sowingDate: string;

  expectedHarvestDate?: string | null;
  actualHarvestDate?: string | null;

  status?: CropCycleStatus;

  variety?: string | null;
  cultivatedArea?: number | null;
  areaUnit?: CropCycleAreaUnit;
  notes?: string | null;
}

/**
 * PATCH /api/farms/:farmId/cycles/:cycleId
 *
 * Only explicitly changed fields should be included.
 *
 * Omitted fields retain their stored values.
 *
 * cropName is response-only and must not be sent.
 */
export type UpdateCropCycleRequest =
  Partial<CreateCropCycleRequest>;

// ============================================================
// FARM ACTIVITIES
// ============================================================

export type ActivityCategory =
  | 'sowing'
  | 'irrigation'
  | 'fertilizer'
  | 'weeding'
  | 'pest_disease'
  | 'soil_preparation'
  | 'harvesting'
  | 'general';

export interface FarmActivityRecord {
  id: string;
  farmId: string;

  cropCycleId?: string | null;

  category: ActivityCategory;

  /** YYYY-MM-DD */
  activityDate: string;

  title: string;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;

  cropCycle?: {
    id: string;
    cropName: string;
    variety?: string | null;
  } | null;

  farm?: {
    id: string;
    name: string;
  };
}

// ============================================================
// FARM TASKS
// ============================================================

export type TaskStatus =
  | 'pending'
  | 'completed';

export interface FarmTaskRecord {
  id: string;
  farmId: string;

  cropCycleId?: string | null;

  category: ActivityCategory;

  title: string;
  description?: string | null;

  /** YYYY-MM-DD */
  dueDate: string;

  status: TaskStatus;

  completedAt?: string | null;
  isOverdue?: boolean;

  createdAt: string;
  updatedAt: string;

  cropCycle?: {
    id: string;
    cropName: string;
    variety?: string | null;
  } | null;

  farm?: {
    id: string;
    name: string;
  };
}

// ============================================================
// FARM OVERVIEW
// ============================================================

export interface FarmOverview {
  activeFarmsCount: number;
  activeCropCyclesCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;

  recentActivities: FarmActivityRecord[];
  upcomingTasks: FarmTaskRecord[];
}

// ============================================================
// CALENDAR MILESTONES
// ============================================================

export type CalendarMilestoneType =
  | 'sowing'
  | 'harvest';

/**
 * Phase 3:
 *
 * Harvest milestones may represent either:
 * - Expected harvest
 * - Actual harvest
 *
 * The backend keeps type="harvest" for both.
 *
 * harvestKind distinguishes them without breaking
 * existing consumers.
 *
 * Sowing milestones do not require harvestKind.
 */
export type CalendarHarvestKind =
  | 'expected'
  | 'actual';

export interface CalendarMilestone {
  id: string;

  /** YYYY-MM-DD */
  date: string;

  title: string;

  type: CalendarMilestoneType;

  /**
   * Optional for backward compatibility.
   * Present on harvest milestones in Phase 3.
   */
  harvestKind?: CalendarHarvestKind;

  cropName: string;
  farmName: string;
  farmId: string;
  cycleId: string;
}

/**
 * Phase 3 calendar diagnostics.
 *
 * Counts of legacy records containing invalid dates
 * that were excluded from calendar placement.
 *
 * This is diagnostic metadata, not a replacement
 * for the normal calendar collections.
 */
export interface CalendarInvalidDateCounts {
  tasks: number;
  activities: number;
  milestones: number;
}

// ============================================================
// FARM CALENDAR
// ============================================================

export interface FarmCalendarData {
  year: number;
  month: number;

  tasks: FarmTaskRecord[];
  activities: FarmActivityRecord[];

  cropCycleMilestones: CalendarMilestone[];

  /**
   * Optional Phase 3 diagnostic information.
   *
   * The backend may omit this field when no
   * diagnostic counts need to be reported.
   */
  invalidDateCounts?: CalendarInvalidDateCounts;
}

// ============================================================
// FARM API RESPONSES
// ============================================================

/**
 * GET /api/farms
 *
 * Pagination is always included.
 */
export interface FarmListResponse {
  status: 'success';

  farms: FarmRecord[];

  pagination: FarmPagination;
}

/**
 * GET /api/farms/:farmId
 */
export interface FarmDetailResponse {
  status: 'success';

  data: FarmRecord;
}

/**
 * GET /api/farms/:farmId/cycles
 *
 * Phase 3 backward compatibility:
 *
 * Without page/limit:
 * - Returns the complete collection.
 * - pagination may be omitted.
 *
 * With page or limit:
 * - Returns the requested page.
 * - pagination is included.
 *
 * count is the number of returned records,
 * not necessarily the total number of records.
 *
 * Use pagination.totalRecords for the full total
 * when pagination is enabled.
 */
export interface CropCyclesResponse {
  status: 'success';

  count: number;

  data: CropCycleRecord[];

  pagination?: FarmPagination;
}

/**
 * GET /api/farms/:farmId/activities
 */
export interface ActivitiesResponse {
  status: 'success';

  activities: FarmActivityRecord[];

  pagination: FarmPagination;
}

/**
 * GET /api/farms/:farmId/tasks
 */
export interface TasksResponse {
  status: 'success';

  tasks: FarmTaskRecord[];

  pagination: FarmPagination;
}

/**
 * GET /api/farms/overview
 */
export interface FarmOverviewResponse {
  status: 'success';

  data: FarmOverview;
}

/**
 * GET /api/farms/calendar
 */
export interface CalendarResponse {
  status: 'success';

  data: FarmCalendarData;
}
