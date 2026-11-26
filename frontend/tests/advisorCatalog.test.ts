import { expect, it } from 'vitest';
import { advisorCrops, advisorSoils } from '../src/data/advisorCatalog';
import { CROPS_DATA as backendCrops } from '../../backend/src/data/crops';
import { SOILS_DATA as backendSoils } from '../../backend/src/data/soils';

it('keeps every fallback crop and soil selectable by the actual backend', () => {
  expect(advisorCrops.map((crop) => crop.id).sort()).toEqual(backendCrops.map((crop) => crop.id).sort());
  expect(advisorSoils.map((soil) => soil.id).sort()).toEqual(backendSoils.map((soil) => soil.id).sort());
  expect(advisorCrops).toHaveLength(12);
  expect(advisorSoils).toHaveLength(6);
});
