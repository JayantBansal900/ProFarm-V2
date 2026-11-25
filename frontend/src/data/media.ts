import credits from './imageCredits.json';

/** Photo and attribution for a crop or soil, sourced from Wikimedia Commons (see imageCredits.json). */
export interface MediaImage {
  src: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
}

type CreditRecord = { author: string; license: string; licenseUrl: string | null; source: string };
const table = credits as Record<string, CreditRecord>;

function lookup(kind: 'crops' | 'soils' | 'scenes', slug: string): MediaImage | undefined {
  const credit = table[`${kind}/${slug}`];
  if (!credit) return undefined;
  return { src: `/images/${kind}/${slug}.webp`, author: credit.author, license: credit.license, licenseUrl: credit.licenseUrl, source: credit.source };
}

export const cropImage = (slug: string) => lookup('crops', slug);

/**
 * Where to centre a photo when a card crops it. Most pictures work centred; a few tall ones
 * keep their subject near the bottom, so a centred crop would show mostly sky.
 */
const FOCUS: Record<string, string> = {
  'crops/rice': '50% 100%',
  'crops/chickpea': '50% 62%',
  'crops/groundnut': '50% 78%',
};

export function photoFocus(src: string): string | undefined {
  const match = /\/images\/(crops\/[a-z-]+)\.webp$/.exec(src);
  return match ? FOCUS[match[1]] : undefined;
}
export const soilImage = (slug: string) => lookup('soils', slug);

/** Wide photos of Indian farm scenes used as page banners. */
export type SceneName = 'monsoon-paddy' | 'onion-market' | 'tractor-punjab' | 'farmer-fertilizer'
  | 'sprinkler-irrigation' | 'wheat-punjab' | 'mustard-field' | 'sunrise-paddy';
export const sceneImage = (name: SceneName): string => `/images/scenes/${name}.webp`;

/** All credited photos, for the image credits page. */
export const allImageCredits = Object.entries(table).map(([key, credit]) => ({
  key, src: `/images/${key}.webp`, author: credit.author, license: credit.license, licenseUrl: credit.licenseUrl, source: credit.source,
}));
