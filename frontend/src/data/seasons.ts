import type { GrowingSeason } from '../types/agriculture';

/**
 * Indian cropping season whose sowing window is open in the given month.
 * Kharif: June–September (monsoon), Rabi: October–February (winter), Zaid: March–May (summer).
 */
export function sowingSeason(date: Date = new Date()): GrowingSeason {
  const month = date.getMonth() + 1;
  if (month >= 6 && month <= 9) return 'Kharif';
  if (month >= 3 && month <= 5) return 'Zaid';
  return 'Rabi';
}

export const seasonMonths: Record<GrowingSeason, string> = {
  Kharif: 'June to September',
  Rabi: 'October to February',
  Zaid: 'March to May',
};
