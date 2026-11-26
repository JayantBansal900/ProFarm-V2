export type GrowingSeason = 'Kharif' | 'Rabi' | 'Zaid';

export type CropCategory =
  | 'Cereal & Grain'
  | 'Pulse & Legume'
  | 'Oilseed'
  | 'Fiber'
  | 'Commercial & Cash'
  | 'Tuber & Root';

export interface SourceReference {
  name: string;
  url?: string;
  organization?: string;
}

export interface CropRecord {
  id: string;
  slug: string;
  name: string;
  hindiName?: string;
  scientificName: string;
  category: CropCategory;
  shortDescription: string;
  seasons: GrowingSeason[];
  suitableSoilIds: string[]; // references SoilRecord.id
  temperatureRange: {
    minC: number;
    maxC: number;
    description: string;
  };
  waterRequirement: {
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    annualMm?: string;
    description: string;
  };
  sowingAndHarvest: {
    sowingPeriod: string;
    harvestPeriod: string;
    germinationDays?: string;
  };
  soilPreparation: string;
  irrigationGuidance: string;
  sustainablePractices: string[];
  commonChallenges: string[];
  icon: string; // Emoji / lightweight icon representation
  colorTheme: string;
  sources: SourceReference[];
}

export interface SoilRecord {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  textureCharacteristics: string;
  drainage: 'Rapid / Excessive' | 'Good / Well-Drained' | 'Moderate' | 'Slow / Poor';
  waterRetention: 'Low' | 'Moderate' | 'High' | 'Very High';
  nutrientRetention: string;
  advantages: string[];
  challenges: string[];
  improvementPractices: string[];
  suitableCropIds: string[]; // references CropRecord.id
  colorTheme: string;
  icon: string;
  sources: SourceReference[];
}

export interface CropFilterState {
  searchQuery: string;
  selectedSeason: string;
  selectedSoilId: string;
  selectedCategory: string;
}
