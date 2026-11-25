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

function lookup(kind: 'crops' | 'soils', slug: string): MediaImage | undefined {
  const credit = table[`${kind}/${slug}`];
  if (!credit) return undefined;
  return { src: `/images/${kind}/${slug}.jpg`, ...credit };
}

export const cropImage = (slug: string) => lookup('crops', slug);
export const soilImage = (slug: string) => lookup('soils', slug);

/** All credited photos, for the image credits page. */
export const allImageCredits = Object.entries(table).map(([key, credit]) => ({
  key, src: `/images/${key}.jpg`, ...credit,
}));
