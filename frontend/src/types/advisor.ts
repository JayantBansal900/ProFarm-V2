export interface AdvisorRecommendation {
  id: string;
  category: 'crop_care' | 'soil_health' | 'water_management' | 'sustainable_practices' | 'weather_considerations';
  priority: 'high' | 'medium' | 'info';
  title: string;
  explanation: string;
  whyThisApplies: string;
  evidence: string[];
  limitations: string;
  source: {
    name: string;
    organization?: string;
    url?: string;
  };
}

export interface AdvisorCompatibility {
  isCompatible: boolean;
  status: 'recommended' | 'acceptable' | 'challenging';
  headline: string;
  reason: string;
}

export interface AdvisorWeatherSummary {
  locationName: string;
  temperatureC: number;
  apparentTemperatureC: number;
  condition: string;
  icon: string;
  sevenDayTotalRainMm: number;
  todayRainMm: number;
  maxDailyPrecipProb: number;
  maxWindSpeedKmH: number;
  heavyRainAlert: boolean;
  drySpellAlert: boolean;
  heatStressAlert: boolean;
  fetchedAt: string;
}

export interface AdvisorData {
  crop: {
    id: string;
    slug: string;
    name: string;
    hindiName?: string;
    scientificName: string;
    category: string;
    seasons: string[];
    waterRequirement: {
      level: string;
      annualMm?: string;
    };
    temperatureRange: {
      minC: number;
      maxC: number;
    };
    icon: string;
    colorTheme: string;
  };
  soil?: {
    id: string;
    slug: string;
    name: string;
    textureCharacteristics: string;
    drainage: string;
    waterRetention: string;
    nutrientRetention: string;
    icon: string;
    colorTheme: string;
  } | null;
  compatibility?: AdvisorCompatibility | null;
  weatherSummary?: AdvisorWeatherSummary | null;
  recommendations: {
    cropCare: AdvisorRecommendation[];
    soilHealth: AdvisorRecommendation[];
    waterManagement: AdvisorRecommendation[];
    sustainablePractices: AdvisorRecommendation[];
    weatherConsiderations: AdvisorRecommendation[];
  };
  summary: {
    totalRecommendations: number;
    highPriorityCount: number;
    soilIncluded: boolean;
    weatherIncluded: boolean;
  };
  disclaimer: string;
  generatedAt: string;
}

export interface AdvisorRecommendationsResponse {
  status: 'success' | 'error';
  data: AdvisorData;
}

export interface AdvisorCropSummary {
  id: string;
  slug: string;
  name: string;
  hindiName?: string;
  category: string;
  seasons: string[];
  waterLevel: string;
  icon: string;
}

export interface AdvisorSoilSummary {
  id: string;
  slug: string;
  name: string;
  drainage: string;
  waterRetention: string;
  icon: string;
}

export interface AdvisorCropsResponse {
  status: 'success';
  count: number;
  crops: AdvisorCropSummary[];
}

export interface AdvisorSoilsResponse {
  status: 'success';
  count: number;
  soils: AdvisorSoilSummary[];
}

export interface AdvisorRequestInput {
  cropId: string;
  soilId?: string | null;
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  } | null;
}
