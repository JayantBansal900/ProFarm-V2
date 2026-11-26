import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateInTimeZone, isValidTimeZone } from '../src/lib/timezone';
import { getTodayDateString } from '../src/services/farm.service';
import { farmFixture } from './farmFixtures';

const x = farmFixture();

afterEach(() => { vi.useRealTimers(); });

/** Runs `action` while the process believes it is in `zone`, like a server hosted there. */
async function withServerTimezone<T>(zone: string, action: () => Promise<T> | T): Promise<T> {
  const before = process.env.TZ;
  process.env.TZ = zone;
  try {
    return await action();
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
}

describe('dateInTimeZone', () => {
  it.each([
    ['2026-11-25T18:29:59Z', 'Asia/Kolkata', '2026-11-25'],
    ['2026-11-25T18:30:00Z', 'Asia/Kolkata', '2026-11-26'], // IST midnight
    ['2026-11-25T18:30:00Z', 'UTC', '2026-11-25'],
    ['2026-12-31T19:00:00Z', 'Asia/Kolkata', '2027-01-01'], // new year arrives in India first
    ['2028-02-28T20:00:00Z', 'Asia/Kolkata', '2028-02-29'], // leap day
    ['2026-11-25T20:00:00Z', 'America/Los_Angeles', '2026-11-25'],
    ['2026-11-25T03:00:00Z', 'America/Los_Angeles', '2026-11-24'],
  ])('%s in %s is %s', (instant, zone, expected) => {
    expect(dateInTimeZone(new Date(instant), zone)).toBe(expected);
  });

  it('recognises valid and invalid timezone names', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Mars/Phobos')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('getTodayDateString', () => {
  it('uses the app timezone (India) no matter where the server runs', async () => {
    const lateEveningUtc = new Date('2026-11-25T20:00:00Z'); // already the 26th in India
    for (const zone of ['UTC', 'Pacific/Auckland', 'America/Los_Angeles', 'Asia/Kolkata']) {
      await withServerTimezone(zone, () => {
        expect(getTodayDateString(lateEveningUtc)).toBe('2026-11-26');
      });
    }
  });

  it('can be pointed at another timezone', () => {
    expect(getTodayDateString(new Date('2026-11-25T20:00:00Z'), 'UTC')).toBe('2026-11-25');
  });
});

describe('overdue tasks follow the Indian calendar day, even on a UTC server', () => {
  it('flips to overdue at Indian midnight, not at UTC midnight', async () => {
    const task = await x.task({ dueDate: '2026-11-25', status: 'pending' });
    const url = `/api/farms/${x.f.farmId}/tasks`;
    const overdueNow = async () => {
      const list = await x.get(url);
      return list.body.tasks.find((t: { id: string }) => t.id === task.id).isOverdue as boolean;
    };

    await withServerTimezone('UTC', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });

      vi.setSystemTime(new Date('2026-11-25T18:00:00Z')); // 23:30 on the 25th in India
      expect(await overdueNow()).toBe(false);

      vi.setSystemTime(new Date('2026-11-25T19:00:00Z')); // 00:30 on the 26th in India, still the 25th in UTC
      expect(await overdueNow()).toBe(true);
      const overview = await x.get('/api/farms/overview');
      expect(overview.body.data.overdueTasksCount).toBe(1);
    });
  });
});
