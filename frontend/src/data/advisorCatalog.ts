import { CROPS_DATA } from './crops';
import { SOILS_DATA } from './soils';
import type { AdvisorCropSummary, AdvisorSoilSummary } from '../types/advisor';

// Fallback selectors must use the same IDs as the knowledge catalog and API.
export const advisorCrops: AdvisorCropSummary[] = CROPS_DATA.map((crop) => ({
  id: crop.id, slug: crop.slug, name: crop.name, hindiName: crop.hindiName,
  category: crop.category, seasons: crop.seasons, waterLevel: crop.waterRequirement.level, icon: crop.icon,
}));
export const advisorSoils: AdvisorSoilSummary[] = SOILS_DATA.map((soil) => ({
  id: soil.id, slug: soil.slug, name: soil.name, drainage: soil.drainage,
  waterRetention: soil.waterRetention, icon: soil.icon,
}));
