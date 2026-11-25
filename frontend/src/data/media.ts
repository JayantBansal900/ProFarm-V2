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
export const soilImage = (slug: string) => lookup('soils', slug);

/** Wide photos of Indian farm scenes used as page banners. */
export type SceneName = 'monsoon-paddy' | 'onion-market' | 'tractor-punjab' | 'farmer-fertilizer'
  | 'sprinkler-irrigation' | 'wheat-punjab' | 'mustard-field' | 'sunrise-paddy';
export const sceneImage = (name: SceneName): string => `/images/scenes/${name}.webp`;

/** All credited photos, for the image credits page. */
export const allImageCredits = Object.entries(table).map(([key, credit]) => ({
  key, src: `/images/${key}.webp`, author: credit.author, license: credit.license, licenseUrl: credit.licenseUrl, source: credit.source,
}));
