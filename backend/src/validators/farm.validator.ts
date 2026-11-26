import { z } from 'zod';
import { dateOnlySchema } from './date.validator';
import { integerQuery, paginationQuerySchema } from './pagination.validator';

export { dateStringRegex } from './date.validator';

export const ACTIVITY_CATEGORIES = [
  'sowing',
  'irrigation',
  'fertilizer',
  'weeding',
  'pest_disease',
  'soil_preparation',
  'harvesting',
  'general',
] as const;

export const CROP_CYCLE_STATUSES = [
  'planned',
  'active',
  'completed',
  'cancelled',
] as const;

export const TASK_STATUSES = ['pending', 'completed'] as const;

export const AREA_UNITS = ['acres', 'hectares'] as const;

// ---------------------------------------------------------------------------
// Farm Schemas
// ---------------------------------------------------------------------------

export const createFarmBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name must not exceed 100 characters'),
  state: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
  village: z.string().trim().max(100).optional().nullable(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'PIN code must be a 6-digit number')
    .optional()
    .nullable()
    .or(z.literal('')),
  area: z
    .coerce
    .number()
    .positive('Farm area must be greater than 0')
    .max(1000000, 'Farm area is too large')
    .optional()
    .nullable(),
  areaUnit: z.enum(AREA_UNITS).default('acres').optional(),
  soilType: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000, 'Notes must not exceed 2000 characters').optional().nullable(),
});

export const updateFarmBodySchema = createFarmBodySchema.omit({ areaUnit: true }).partial()
  .extend({ areaUnit: z.enum(AREA_UNITS).optional() });

export const farmListQuerySchema = paginationQuerySchema.extend({
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

// Pagination is opt-in here: no query keeps the existing complete collection.
export const cropCycleListQuerySchema = z.object({
  page: integerQuery(1, 100000).optional(),
  limit: integerQuery(1, 100).optional(),
});

// ---------------------------------------------------------------------------
// Crop Cycle Schemas
// ---------------------------------------------------------------------------

// Empty optional harvest dates remain an explicit legacy alias for clearing to null.
const optionalHarvestDateSchema = z.union([dateOnlySchema, z.literal(''), z.null()])
  .transform((value) => value === '' ? null : value)
  .optional();

interface CropCycleTimeline {
  sowingDate: string;
  expectedHarvestDate?: string | null;
  actualHarvestDate?: string | null;
}

function refineCropCycleTimeline(data: CropCycleTimeline, context: z.RefinementCtx): void {
  for (const field of ['expectedHarvestDate', 'actualHarvestDate'] as const) {
    if (data[field] && data[field] < data.sowingDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field === 'expectedHarvestDate' ? 'Expected' : 'Actual'} harvest date cannot be earlier than sowing date`,
      });
    }
  }
}

export const cropCycleTimelineSchema = z.object({
  sowingDate: dateOnlySchema,
  expectedHarvestDate: optionalHarvestDateSchema,
  actualHarvestDate: optionalHarvestDateSchema,
}).superRefine(refineCropCycleTimeline);

const cropCycleFieldsSchema = z.object({
    cropId: z
      .string()
      .trim()
      .min(1, 'Crop identifier is required')
      .max(100, 'Crop identifier must not exceed 100 characters'),
    variety: z.string().trim().max(100).optional().nullable(),
    sowingDate: dateOnlySchema,
    expectedHarvestDate: optionalHarvestDateSchema,
    actualHarvestDate: optionalHarvestDateSchema,
    status: z.enum(CROP_CYCLE_STATUSES).default('active'),
    cultivatedArea: z
      .coerce
      .number()
      .positive('Cultivated area must be greater than 0')
      .max(1000000)
      .optional()
      .nullable(),
    areaUnit: z.enum(AREA_UNITS).default('acres').optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
  }).strict();

export const createCropCycleBodySchema = cropCycleFieldsSchema.superRefine(refineCropCycleTimeline);

// Defaults are creation-only, including under Zod 4's partial-object semantics.
export const updateCropCycleBodySchema = cropCycleFieldsSchema.omit({ status: true, areaUnit: true }).partial()
  .extend({ status: z.enum(CROP_CYCLE_STATUSES).optional(), areaUnit: z.enum(AREA_UNITS).optional() })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one supported crop-cycle field is required',
  })
  .superRefine((data, context) => {
    if (data.sowingDate !== undefined) refineCropCycleTimeline({ ...data, sowingDate: data.sowingDate }, context);
  });

// ---------------------------------------------------------------------------
// Activity Schemas
// ---------------------------------------------------------------------------

export const createFarmActivityBodySchema = z.object({
  cropCycleId: z.string().trim().optional().nullable().or(z.literal('')),
  category: z.enum(ACTIVITY_CATEGORIES, {
    error: 'Invalid activity category',
  }),
  activityDate: dateOnlySchema,
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must not exceed 150 characters'),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const hasSupportedChange = (data: Record<string, unknown>) => Object.values(data).some((value) => value !== undefined);
export const updateFarmActivityBodySchema = createFarmActivityBodySchema.partial()
  .refine(hasSupportedChange, 'At least one supported activity field is required');

export const activityListQuerySchema = paginationQuerySchema.extend({
  category: z.enum(ACTIVITY_CATEGORIES).or(z.literal('')).optional(),
  cropCycleId: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Task Schemas
// ---------------------------------------------------------------------------

export const createFarmTaskBodySchema = z.object({
  cropCycleId: z.string().trim().optional().nullable().or(z.literal('')),
  category: z.enum(ACTIVITY_CATEGORIES, {
    error: 'Invalid task category',
  }),
  title: z
    .string()
    .trim()
    .min(2, 'Task title must be at least 2 characters')
    .max(150, 'Task title must not exceed 150 characters'),
  description: z.string().trim().max(2000).optional().nullable(),
  dueDate: dateOnlySchema,
  status: z.enum(TASK_STATUSES).default('pending'),
});

export const updateFarmTaskBodySchema = z.object({
  cropCycleId: z.string().trim().optional().nullable().or(z.literal('')),
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  dueDate: dateOnlySchema.optional(),
  status: z.enum(TASK_STATUSES).optional(),
}).refine(hasSupportedChange, 'At least one supported task field is required');

export const taskListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'completed', 'all']).default('all').optional(),
  category: z.enum(ACTIVITY_CATEGORIES).or(z.literal('')).optional(),
  cropCycleId: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Calendar Query Schema
// ---------------------------------------------------------------------------

export const calendarQuerySchema = z.object({
  year: integerQuery(2000, 2100),
  month: integerQuery(1, 12),
  farmId: z.string().trim().min(1).optional(),
});

// Types
export type CreateFarmInput = z.infer<typeof createFarmBodySchema>;
export type UpdateFarmInput = z.infer<typeof updateFarmBodySchema>;
export type CreateCropCycleInput = z.infer<typeof createCropCycleBodySchema>;
export type UpdateCropCycleInput = z.infer<typeof updateCropCycleBodySchema>;
export type CreateCropCycleRequest = z.input<typeof createCropCycleBodySchema>;
export type UpdateCropCycleRequest = z.input<typeof updateCropCycleBodySchema>;
export type CreateFarmActivityInput = z.infer<typeof createFarmActivityBodySchema>;
export type UpdateFarmActivityInput = z.infer<typeof updateFarmActivityBodySchema>;
export type CreateFarmTaskInput = z.infer<typeof createFarmTaskBodySchema>;
export type UpdateFarmTaskInput = z.infer<typeof updateFarmTaskBodySchema>;
