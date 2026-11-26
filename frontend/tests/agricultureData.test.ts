import { describe, it, expect } from 'vitest';
import { CROPS_DATA, getCropById, getCropBySlug, getCropsBySoilId } from '../src/data/crops';
import { SOILS_DATA, getSoilById, getSoilBySlug } from '../src/data/soils';

describe('Agriculture Knowledge Data Integrity', () => {
  it('contains at least 12 crops and 6 soils', () => {
    expect(CROPS_DATA.length).toBeGreaterThanOrEqual(12);
    expect(SOILS_DATA.length).toBeGreaterThanOrEqual(6);
  });

  it('ensures all crops have unique IDs and unique slugs', () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const crop of CROPS_DATA) {
      expect(ids.has(crop.id)).toBe(false);
      expect(slugs.has(crop.slug)).toBe(false);
      ids.add(crop.id);
      slugs.add(crop.slug);

      expect(crop.name.length).toBeGreaterThan(1);
      expect(crop.scientificName.length).toBeGreaterThan(1);
      expect(crop.shortDescription.length).toBeGreaterThan(10);
      expect(crop.seasons.length).toBeGreaterThan(0);
      expect(crop.suitableSoilIds.length).toBeGreaterThan(0);
      expect(crop.sustainablePractices.length).toBeGreaterThanOrEqual(2);
      expect(crop.sources.length).toBeGreaterThan(0);
    }
  });

  it('ensures all soils have unique IDs and unique slugs', () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const soil of SOILS_DATA) {
      expect(ids.has(soil.id)).toBe(false);
      expect(slugs.has(soil.slug)).toBe(false);
      ids.add(soil.id);
      slugs.add(soil.slug);

      expect(soil.name.length).toBeGreaterThan(1);
      expect(soil.shortDescription.length).toBeGreaterThan(10);
      expect(soil.advantages.length).toBeGreaterThanOrEqual(2);
      expect(soil.challenges.length).toBeGreaterThanOrEqual(1);
      expect(soil.improvementPractices.length).toBeGreaterThanOrEqual(2);
      expect(soil.sources.length).toBeGreaterThan(0);
    }
  });

  it('verifies all crop-to-soil references point to existing soil IDs', () => {
    const validSoilIds = new Set(SOILS_DATA.map((s) => s.id));
    for (const crop of CROPS_DATA) {
      for (const soilId of crop.suitableSoilIds) {
        expect(
          validSoilIds.has(soilId),
          `Crop ${crop.name} references invalid soilId: ${soilId}`
        ).toBe(true);
      }
    }
  });

  it('verifies all soil-to-crop references point to existing crop IDs', () => {
    const validCropIds = new Set(CROPS_DATA.map((c) => c.id));
    for (const soil of SOILS_DATA) {
      for (const cropId of soil.suitableCropIds) {
        expect(
          validCropIds.has(cropId),
          `Soil ${soil.name} references invalid cropId: ${cropId}`
        ).toBe(true);
      }
    }
  });

  it('correctly retrieves crops and soils by ID and slug', () => {
    const wheat = getCropBySlug('wheat');
    expect(wheat).toBeDefined();
    expect(wheat?.id).toBe('crop-wheat');
    expect(getCropById('crop-wheat')).toEqual(wheat);

    const loam = getSoilBySlug('loamy-soil');
    expect(loam).toBeDefined();
    expect(loam?.id).toBe('soil-loam');
    expect(getSoilById('soil-loam')).toEqual(loam);
  });

  it('getCropsBySoilId returns compatible crops for given soil ID', () => {
    const sandyCrops = getCropsBySoilId('soil-sandy');
    expect(sandyCrops.length).toBeGreaterThanOrEqual(2);
    const cropNames = sandyCrops.map((c) => c.name);
    expect(cropNames).toContain('Pearl Millet (Bajra)');
  });
});
