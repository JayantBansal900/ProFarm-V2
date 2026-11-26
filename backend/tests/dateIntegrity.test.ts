import { describe, expect, it } from 'vitest';
import { dateOnlySchema } from '../src/validators/date.validator';
import {
  createCropCycleBodySchema, updateCropCycleBodySchema,
  createFarmActivityBodySchema, updateFarmActivityBodySchema,
  createFarmTaskBodySchema, updateFarmTaskBodySchema,
} from '../src/validators/farm.validator';

describe('Gregorian date-only contract', () => {
  it.each(['2026-02-28', '2024-02-29', '2026-12-31', '2000-02-29', '2400-02-29', '0001-01-01', '9999-12-31'])
    ('accepts %s and preserves its date-only representation', (value) => {
      expect(dateOnlySchema.parse(value)).toBe(value);
    });

  it.each([
    '2026-02-29', '2026-02-31', '2026-04-31', '2026-06-31', '1900-02-29', '2100-02-29',
    '2026-13-01', '2026-00-10', '2026-01-00', '2026-01-32', '2026-1-5', '0000-01-01',
    '2026/01/05', '2026-01-05T00:00:00Z', ' 2026-01-05 ', '2026-01-05\n', '2026-01-05\r', '2026-01-05\r\n',
    '', 'invalid', null, 20260105,
  ])('rejects impossible dates and invalid representations: %s', (value) => {
    expect(dateOnlySchema.safeParse(value).success).toBe(false);
  });

  it.each(['sowingDate', 'expectedHarvestDate', 'actualHarvestDate'])('validates crop %s semantically', (field) => {
    expect(createCropCycleBodySchema.safeParse({ cropId: 'crop-wheat', sowingDate: '2026-01-01', [field]: '2026-02-31' }).success).toBe(false);
    expect(updateCropCycleBodySchema.safeParse({ [field]: '2026-02-31' }).success).toBe(false);
  });

  it.each([null, ''])('supports explicit optional-date clearing with %s', (value) => {
    const parsed = updateCropCycleBodySchema.parse({ expectedHarvestDate: value, actualHarvestDate: value });
    expect(parsed).toEqual({ expectedHarvestDate: null, actualHarvestDate: null });
  });

  it('does not inject creation defaults into a partial update', () => {
    expect(updateCropCycleBodySchema.parse({ notes: ' Updated ' })).toEqual({ notes: 'Updated' });
  });

  it('retains creation defaults and rejects absent required dates', () => {
    expect(createCropCycleBodySchema.parse({ cropId: 'crop-wheat', sowingDate: '2024-02-29' }).status).toBe('active');
    expect(createCropCycleBodySchema.safeParse({ cropId: 'crop-wheat' }).success).toBe(false);
    expect(createCropCycleBodySchema.safeParse({ cropId: 'crop-wheat', sowingDate: null }).success).toBe(false);
  });

  it('applies the same date rules to activity and task creation and editing', () => {
    const activity = { category: 'general', title: 'Field inspection', activityDate: '2026-02-31' };
    const task = { category: 'general', title: 'Field inspection', dueDate: '2026-04-31' };
    expect(createFarmActivityBodySchema.safeParse(activity).success).toBe(false);
    expect(updateFarmActivityBodySchema.safeParse({ activityDate: activity.activityDate }).success).toBe(false);
    expect(createFarmTaskBodySchema.safeParse(task).success).toBe(false);
    expect(updateFarmTaskBodySchema.safeParse({ dueDate: task.dueDate }).success).toBe(false);
    expect(createFarmActivityBodySchema.parse({ ...activity, activityDate: '2024-02-29' }).activityDate).toBe('2024-02-29');
    expect(createFarmTaskBodySchema.parse({ ...task, dueDate: '2024-02-29' }).dueDate).toBe('2024-02-29');
  });
});
