import { CROPS_DATA } from '../data/crops';
import { SOILS_DATA } from '../data/soils';
import { SUSTAINABLE_PRACTICES, SustainablePractice } from '../data/sustainablePractices';
import { CropRecord, SoilRecord } from '../types/agriculture';
import { getForecast, NormalizedForecastResponse } from './weather.service';
import { MemoryCache } from '../lib/memoryCache';

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

export interface AdvisorResponse {
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
  weatherSummary?: {
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
  } | null;
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

export interface AdvisorInput {
  cropId: string;
  soilId?: string | null;
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const ADVISOR_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const advisorCache = new MemoryCache<AdvisorResponse>(150);

export const advisorCacheManager = {
  cache: advisorCache,
  clear: () => advisorCache.clear(),
};

// ---------------------------------------------------------------------------
// Helpers to lookup Crop and Soil
// ---------------------------------------------------------------------------

export function findCropByIdOrSlug(idOrSlug: string): CropRecord | undefined {
  const normalized = idOrSlug.trim().toLowerCase();
  return CROPS_DATA.find(
    (c) => c.id.toLowerCase() === normalized || c.slug.toLowerCase() === normalized
  );
}

export function findSoilByIdOrSlug(idOrSlug: string): SoilRecord | undefined {
  const normalized = idOrSlug.trim().toLowerCase();
  return SOILS_DATA.find(
    (s) => s.id.toLowerCase() === normalized || s.slug.toLowerCase() === normalized
  );
}

export function getAllCropsSummary() {
  return CROPS_DATA.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    hindiName: c.hindiName,
    category: c.category,
    seasons: c.seasons,
    waterLevel: c.waterRequirement.level,
    icon: c.icon,
  }));
}

export function getAllSoilsSummary() {
  return SOILS_DATA.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    drainage: s.drainage,
    waterRetention: s.waterRetention,
    icon: s.icon,
  }));
}

// ---------------------------------------------------------------------------
// Core Advisory Engine
// ---------------------------------------------------------------------------

export async function generateAdvisorGuidance(input: AdvisorInput): Promise<AdvisorResponse> {
  const crop = findCropByIdOrSlug(input.cropId);
  if (!crop) {
    throw new Error(`Crop with identifier "${input.cropId}" not found in curated knowledge base.`);
  }

  const soil = input.soilId ? findSoilByIdOrSlug(input.soilId) : undefined;
  if (input.soilId && !soil) {
    throw new Error(`Soil with identifier "${input.soilId}" not found in curated knowledge base.`);
  }

  // Cache key
  const latKey = input.location ? input.location.latitude.toFixed(2) : 'none';
  const lonKey = input.location ? input.location.longitude.toFixed(2) : 'none';
  const cacheKey = `${crop.id}:${soil?.id || 'none'}:${latKey}:${lonKey}`;

  const cached = advisorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Try fetching weather if location is provided
  let weatherData: NormalizedForecastResponse | null = null;
  if (input.location) {
    try {
      weatherData = await getForecast(
        input.location.latitude,
        input.location.longitude,
        input.location.locationName
      );
    } catch (weatherErr) {
      // Graceful degradation: log and proceed with weatherData = null
      console.warn('Advisor: Weather fetch skipped or unavailable:', (weatherErr as Error).message);
      weatherData = null;
    }
  }

  // Generate recommendations by category
  const cropCareRecs = buildCropCareRecommendations(crop);
  const soilHealthRecs = soil ? buildSoilHealthRecommendations(crop, soil) : [];
  const waterManagementRecs = buildWaterManagementRecommendations(crop, soil, weatherData);
  const sustainablePracticeRecs = buildSustainablePracticesRecommendations(crop, soil);
  const weatherRecs = weatherData ? buildWeatherRecommendations(crop, weatherData) : [];

  // Compatibility assessment
  let compatibility: AdvisorCompatibility | null = null;
  if (soil) {
    compatibility = assessCompatibility(crop, soil);
  }

  // Weather summary
  let weatherSummary: AdvisorResponse['weatherSummary'] = null;
  if (weatherData) {
    const isHeavyRain =
      weatherData.rainfallSummary.heavyRainDays.length > 0 ||
      weatherData.rainfallSummary.sevenDayTotalMm >= 20;
    const isDrySpell = weatherData.rainfallSummary.sevenDayTotalMm <= 2.0;
    const isHeatStress = weatherData.current.temperatureC >= crop.temperatureRange.maxC;

    weatherSummary = {
      locationName: weatherData.location.locationName || `${weatherData.location.latitude.toFixed(2)}°, ${weatherData.location.longitude.toFixed(2)}°`,
      temperatureC: weatherData.current.temperatureC,
      apparentTemperatureC: weatherData.current.apparentTemperatureC,
      condition: weatherData.current.condition,
      icon: weatherData.current.icon,
      sevenDayTotalRainMm: weatherData.rainfallSummary.sevenDayTotalMm,
      todayRainMm: weatherData.rainfallSummary.todayExpectedMm,
      maxDailyPrecipProb: weatherData.rainfallSummary.maxDailyProbabilityPercent,
      maxWindSpeedKmH: Math.max(...weatherData.daily.map((d) => d.windSpeedMaxKmH), weatherData.current.windSpeedKmH),
      heavyRainAlert: isHeavyRain,
      drySpellAlert: isDrySpell,
      heatStressAlert: isHeatStress,
      fetchedAt: weatherData.dataFreshness.fetchedAt,
    };
  }

  const allRecs = [
    ...cropCareRecs,
    ...soilHealthRecs,
    ...waterManagementRecs,
    ...sustainablePracticeRecs,
    ...weatherRecs,
  ];

  const highPriorityCount = allRecs.filter((r) => r.priority === 'high').length;

  const response: AdvisorResponse = {
    crop: {
      id: crop.id,
      slug: crop.slug,
      name: crop.name,
      hindiName: crop.hindiName,
      scientificName: crop.scientificName,
      category: crop.category,
      seasons: crop.seasons,
      waterRequirement: {
        level: crop.waterRequirement.level,
        annualMm: crop.waterRequirement.annualMm,
      },
      temperatureRange: {
        minC: crop.temperatureRange.minC,
        maxC: crop.temperatureRange.maxC,
      },
      icon: crop.icon,
      colorTheme: crop.colorTheme,
    },
    soil: soil
      ? {
          id: soil.id,
          slug: soil.slug,
          name: soil.name,
          textureCharacteristics: soil.textureCharacteristics,
          drainage: soil.drainage,
          waterRetention: soil.waterRetention,
          nutrientRetention: soil.nutrientRetention,
          icon: soil.icon,
          colorTheme: soil.colorTheme,
        }
      : null,
    compatibility,
    weatherSummary,
    recommendations: {
      cropCare: cropCareRecs,
      soilHealth: soilHealthRecs,
      waterManagement: waterManagementRecs,
      sustainablePractices: sustainablePracticeRecs,
      weatherConsiderations: weatherRecs,
    },
    summary: {
      totalRecommendations: allRecs.length,
      highPriorityCount,
      soilIncluded: Boolean(soil),
      weatherIncluded: Boolean(weatherData),
    },
    disclaimer:
      'ProFarm Sustainable Advisor is an educational decision-support tool synthesized from published Indian agronomic research (ICAR, State Agricultural Universities, FAO). It does not provide chemical brand prescriptions or commercial warranties. Field decisions should account for local soil lab tests, local microclimates, and certified Krishi Vigyan Kendra (KVK) extension recommendations.',
    generatedAt: new Date().toISOString(),
  };

  advisorCache.set(cacheKey, response, ADVISOR_CACHE_TTL_MS);
  return response;
}

// ---------------------------------------------------------------------------
// Rule Builders
// ---------------------------------------------------------------------------

function buildCropCareRecommendations(crop: CropRecord): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];
  const primarySource = crop.sources[0] || {
    name: 'Indian Council of Agricultural Research (ICAR)',
    organization: 'ICAR, New Delhi',
  };

  // 1. Critical growth stages & irrigation scheduling
  recs.push({
    id: `crop-care-stages-${crop.id}`,
    category: 'crop_care',
    priority: 'high',
    title: `Key Growth Stages & Care for ${crop.name}`,
    explanation: crop.irrigationGuidance,
    whyThisApplies: `Selected crop is ${crop.name} (${crop.scientificName}), which has specific physiological stages sensitive to moisture and nutrient stress.`,
    evidence: [
      `Crop: ${crop.name}`,
      `Sowing period: ${crop.sowingAndHarvest.sowingPeriod}`,
      `Harvest period: ${crop.sowingAndHarvest.harvestPeriod}`,
      `Water level: ${crop.waterRequirement.level} (${crop.waterRequirement.annualMm})`,
    ],
    limitations:
      'Stage timings vary based on cultivar variety (short vs. medium duration) and actual sowing date.',
    source: primarySource,
  });

  // 2. Temperature tolerance & climatic adaptation
  recs.push({
    id: `crop-care-temp-${crop.id}`,
    category: 'crop_care',
    priority: 'medium',
    title: `Thermal Requirements & Seasonal Fit`,
    explanation: crop.temperatureRange.description,
    whyThisApplies: `Ensuring the field thermal regime matches ${crop.name}'s physiological threshold of ${crop.temperatureRange.minC}°C to ${crop.temperatureRange.maxC}°C.`,
    evidence: [
      `Optimum range: ${crop.temperatureRange.minC}°C – ${crop.temperatureRange.maxC}°C`,
      `Approved seasons: ${crop.seasons.join(', ')}`,
      `Germination time: ${crop.sowingAndHarvest.germinationDays}`,
    ],
    limitations:
      'Extreme spikes beyond thermal thresholds cause flower drop or poor grain filling regardless of soil nutrients.',
    source: primarySource,
  });

  // 3. Common crop challenges & prophylactic care
  if (crop.commonChallenges && crop.commonChallenges.length > 0) {
    recs.push({
      id: `crop-care-challenges-${crop.id}`,
      category: 'crop_care',
      priority: 'medium',
      title: `Vigilance Against Prevalent ${crop.name} Stress Factors`,
      explanation: `Monitor field regularly for: ${crop.commonChallenges.join('; ')}. Use resistant seed varieties and balanced nutrition to avoid host susceptibility.`,
      whyThisApplies: `Historical agronomical data records these recurring biological and physical vulnerabilities for ${crop.name} in Indian farming belts.`,
      evidence: crop.commonChallenges.slice(0, 3),
      limitations:
        'Pest and disease outbreaks depend heavily on local microclimate, previous crop rotation, and seed dressing hygiene.',
      source: primarySource,
    });
  }

  return recs;
}

function assessCompatibility(crop: CropRecord, soil: SoilRecord): AdvisorCompatibility {
  const isDirectlySuitable =
    crop.suitableSoilIds.includes(soil.id) ||
    soil.suitableCropIds.includes(crop.id);

  if (isDirectlySuitable) {
    return {
      isCompatible: true,
      status: 'recommended',
      headline: `Highly Suitable: ${crop.name} thrives in ${soil.name}`,
      reason: `${soil.name}'s drainage (${soil.drainage}) and moisture dynamics (${soil.waterRetention}) naturally align with ${crop.name}'s root structure and water requirement (${crop.waterRequirement.level}).`,
    };
  }

  // Check moderate vs challenging
  const isClayCropInSand = crop.id === 'crop-rice' && soil.id === 'soil-sandy';
  const isSensitiveCropInHeavyClay =
    (crop.id === 'crop-chickpea' || crop.id === 'crop-potato') && soil.id === 'soil-clay';

  if (isClayCropInSand || isSensitiveCropInHeavyClay) {
    return {
      isCompatible: false,
      status: 'challenging',
      headline: `Challenging Combination: Soil modifications required`,
      reason: `${crop.name} requires specific soil physical properties that diverge significantly from ${soil.name}'s natural drainage (${soil.drainage}) and water retention (${soil.waterRetention}). Heavy organic matter amendments and careful irrigation management are essential.`,
    };
  }

  return {
    isCompatible: true,
    status: 'acceptable',
    headline: `Moderately Suitable: Manageable with targeted field practices`,
    reason: `${crop.name} can be successfully cultivated in ${soil.name} provided proper tillage, organic mulching, and monitored irrigation are implemented.`,
  };
}

function buildSoilHealthRecommendations(
  crop: CropRecord,
  soil: SoilRecord
): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];
  const primarySource = soil.sources[0] || {
    name: 'ICAR - Indian Institute of Soil Science',
    organization: 'ICAR, Bhopal',
  };

  // 1. Soil physical structure & root-zone aeration
  recs.push({
    id: `soil-health-texture-${soil.id}`,
    category: 'soil_health',
    priority: 'high',
    title: `Soil Tilth & Moisture Dynamics (${soil.name})`,
    explanation: `${soil.shortDescription} Drainage profile is categorized as "${soil.drainage}" with "${soil.waterRetention}" water retention capacity. ${soil.textureCharacteristics}`,
    whyThisApplies: `Selected soil "${soil.name}" directly controls root penetration depth, capillary water availability, and oxygenation for ${crop.name}.`,
    evidence: [
      `Soil: ${soil.name}`,
      `Drainage: ${soil.drainage}`,
      `Water retention: ${soil.waterRetention}`,
      `Nutrient retention: ${soil.nutrientRetention}`,
    ],
    limitations:
      'Soil texture is an inherent property; manage structure and organic content through regular carbon additions.',
    source: primarySource,
  });

  // 2. Soil improvement and fertility practices
  if (soil.improvementPractices && soil.improvementPractices.length > 0) {
    recs.push({
      id: `soil-health-improvement-${soil.id}`,
      category: 'soil_health',
      priority: 'medium',
      title: `Recommended Soil Enrichment for ${soil.name}`,
      explanation: `Prioritize: ${soil.improvementPractices.join('. ')}.`,
      whyThisApplies: `Maintains cation exchange capacity, feeds beneficial soil mycorrhizae, and prevents structural compaction in ${soil.name}.`,
      evidence: soil.improvementPractices.slice(0, 3),
      limitations:
        'Dosage and timing should be refined with an authorized Soil Health Card (SHC) test report.',
      source: primarySource,
    });
  }

  return recs;
}

function buildWaterManagementRecommendations(
  crop: CropRecord,
  soil?: SoilRecord,
  weather?: NormalizedForecastResponse | null
): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];

  // 1. Water requirements & baseline irrigation strategy
  const soilDrainageNote = soil
    ? ` In ${soil.name} (${soil.drainage}), adjust irrigation frequency to avoid ${soil.drainage.toLowerCase().includes('poor') || soil.id === 'soil-clay' ? 'root-zone waterlogging' : 'excessive percolation leaching'}.`
    : '';

  recs.push({
    id: `water-baseline-${crop.id}`,
    category: 'water_management',
    priority: 'high',
    title: `Irrigation Strategy: ${crop.waterRequirement.level} Demand`,
    explanation: `${crop.waterRequirement.description}${soilDrainageNote}`,
    whyThisApplies: `${crop.name} requires ${crop.waterRequirement.annualMm} across its vegetative and reproductive cycles.`,
    evidence: [
      `Crop water tier: ${crop.waterRequirement.level}`,
      `Estimated seasonal need: ${crop.waterRequirement.annualMm}`,
      ...(soil ? [`Soil drainage: ${soil.drainage}`, `Soil water retention: ${soil.waterRetention}`] : []),
    ],
    limitations:
      'Actual water volume needed varies with seasonal rainfall, evapotranspiration rates, and irrigation method efficiency.',
    source: {
      name: 'Irrigation & Drainage Water Management Manual',
      organization: 'Central Research Institute for Dryland Agriculture (CRIDA), Hyderabad',
      url: 'https://crida.icar.gov.in',
    },
  });

  // 2. Weather-informed water management
  if (weather) {
    const heavyRain = weather.rainfallSummary.sevenDayTotalMm >= 20;
    const drySpell = weather.rainfallSummary.sevenDayTotalMm <= 2.0;

    if (heavyRain) {
      recs.push({
        id: `water-forecast-rain-${crop.id}`,
        category: 'water_management',
        priority: 'high',
        title: `Rainfall Precaution: Postpone Scheduled Irrigations`,
        explanation: `Forecast anticipates significant precipitation (${weather.rainfallSummary.sevenDayTotalMm} mm over next 7 days, with ${weather.rainfallSummary.todayExpectedMm} mm expected today). Suspend surface irrigations immediately to prevent anaerobic conditions and nutrient leaching. Clear field drainage channels.`,
        whyThisApplies: `Current 7-day rainfall forecast indicates potential waterlogging, particularly sensitive during critical flowering or early establishment stages.`,
        evidence: [
          `Forecast 7-day rainfall: ${weather.rainfallSummary.sevenDayTotalMm} mm`,
          `Today's expected rain: ${weather.rainfallSummary.todayExpectedMm} mm`,
          `Days with heavy rain: ${weather.rainfallSummary.heavyRainDays.length > 0 ? weather.rainfallSummary.heavyRainDays.join(', ') : 'None marked extreme'}`,
        ],
        limitations:
          'Local shower intensity may vary across micro-regions. Inspect field soil moisture before restarting irrigation.',
        source: {
          name: 'Agrometeorological Advisory Services (AAS)',
          organization: 'India Meteorological Department (IMD) / ICAR',
          url: 'https://mausam.imd.gov.in',
        },
      });
    } else if (drySpell) {
      recs.push({
        id: `water-forecast-dry-${crop.id}`,
        category: 'water_management',
        priority: 'medium',
        title: `Dry Spell Conservation: Prioritize Root-Zone Moisture`,
        explanation: `Dry conditions expected over the next 7 days (forecast total ${weather.rainfallSummary.sevenDayTotalMm} mm). Apply light, frequent irrigations at critical growth stages or utilize mulching to mitigate evapotranspiration losses.`,
        whyThisApplies: `Extended dry periods accelerate soil moisture depletion, especially when temperatures rise above ${crop.temperatureRange.minC}°C.`,
        evidence: [
          `Forecast 7-day rainfall: ${weather.rainfallSummary.sevenDayTotalMm} mm`,
          `Current temperature: ${weather.current.temperatureC}°C`,
          `Relative humidity: ${weather.current.relativeHumidity}%`,
        ],
        limitations:
          'Deep-rooted perennial crops tolerate dry spells better than shallow-rooted vegetables or seedlings.',
        source: {
          name: 'Dryland Farming Water Conservation Manual',
          organization: 'ICAR-CRIDA, Hyderabad',
        },
      });
    }
  }

  return recs;
}

function buildSustainablePracticesRecommendations(
  crop: CropRecord,
  soil?: SoilRecord
): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];

  // 1. Crop-specific sustainable practices from knowledge base
  if (crop.sustainablePractices && crop.sustainablePractices.length > 0) {
    crop.sustainablePractices.forEach((practiceText, index) => {
      recs.push({
        id: `practice-crop-${crop.id}-${index + 1}`,
        category: 'sustainable_practices',
        priority: index === 0 ? 'high' : 'medium',
        title: `${crop.name} Stewardship Practice #${index + 1}`,
        explanation: practiceText,
        whyThisApplies: `Curated sustainable practice specifically developed for ${crop.name} farming in India to minimize synthetic inputs and enhance soil fertility.`,
        evidence: [`Crop: ${crop.name}`, `Category: ${crop.category}`],
        limitations:
          'Equipment availability (such as Happy Seeder or precision drills) and local labor dynamics can affect implementation.',
        source: crop.sources[0] || {
          name: 'ICAR National Agricultural Innovation Project',
          organization: 'ICAR, New Delhi',
        },
      });
    });
  }

  // 2. Practices from curated SUSTAINABLE_PRACTICES library
  const matchedPractices = SUSTAINABLE_PRACTICES.filter((p: SustainablePractice) => {
    // If soil specified, check if soil is applicable
    if (soil && p.applicableSoilIds) {
      return p.applicableSoilIds.includes(soil.id);
    }
    // If crop category specified, check if applicable
    if (p.applicableCropCategories) {
      return p.applicableCropCategories.includes(crop.category);
    }
    // High-value generic practices
    return ['practice-mulching', 'practice-fym-composting', 'practice-ipm'].includes(p.id);
  });

  // Pick top 2 unique practices not already covered
  matchedPractices.slice(0, 2).forEach((p) => {
    recs.push({
      id: `practice-library-${p.id}`,
      category: 'sustainable_practices',
      priority: 'medium',
      title: p.title,
      explanation: `${p.description} Key ecological benefits: ${p.benefits.slice(0, 2).join('; ')}.`,
      whyThisApplies: `Recommended for ${soil ? `${soil.name} and ` : ''}${crop.category} systems to boost resilience, biological activity, and resource use efficiency.`,
      evidence: [
        `Practice ID: ${p.id}`,
        `Theme: ${p.category.replace('_', ' ')}`,
        ...(soil ? [`Soil: ${soil.name}`] : []),
      ],
      limitations: p.limitations,
      source: p.source,
    });
  });

  return recs;
}

function buildWeatherRecommendations(
  crop: CropRecord,
  weather: NormalizedForecastResponse
): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];
  const primarySource = {
    name: 'Agromet Field Unit Guidelines & IMD Weather Forecast',
    organization: 'India Meteorological Department (IMD) / Open-Meteo',
    url: 'https://mausam.imd.gov.in',
  };

  const currentTemp = weather.current.temperatureC;
  const maxWind = Math.max(...weather.daily.map((d) => d.windSpeedMaxKmH), weather.current.windSpeedKmH);
  const maxRainProb = weather.rainfallSummary.maxDailyProbabilityPercent;

  // 1. Thermal status check
  if (currentTemp > crop.temperatureRange.maxC) {
    recs.push({
      id: `weather-heat-stress-${crop.id}`,
      category: 'weather_considerations',
      priority: 'high',
      title: `Elevated Temperature Advisory (${currentTemp}°C)`,
      explanation: `Current ambient temperature (${currentTemp}°C) exceeds the optimal threshold for ${crop.name} (${crop.temperatureRange.maxC}°C). Consider light evening sprinkler irrigation or surface organic mulching to lower root-zone temperature and mitigate pollen sterility.`,
      whyThisApplies: `Exceeds crop maximum thermal comfort threshold of ${crop.temperatureRange.maxC}°C.`,
      evidence: [
        `Current Temperature: ${currentTemp}°C`,
        `Crop Optimum Ceiling: ${crop.temperatureRange.maxC}°C`,
        `Apparent Heat Index: ${weather.current.apparentTemperatureC}°C`,
      ],
      limitations:
        'Thermal impact depends heavily on stage of development (flowering/grain-filling is most vulnerable).',
      source: primarySource,
    });
  } else if (currentTemp < crop.temperatureRange.minC) {
    recs.push({
      id: `weather-cold-stress-${crop.id}`,
      category: 'weather_considerations',
      priority: 'medium',
      title: `Low Temperature Notice (${currentTemp}°C)`,
      explanation: `Ambient temperature (${currentTemp}°C) is below ${crop.name}'s normal vegetative minimum (${crop.temperatureRange.minC}°C). Germination and vegetative growth may slow down. Avoid heavy nitrogen fertilization during cold spells.`,
      whyThisApplies: `Below crop minimum thermal threshold of ${crop.temperatureRange.minC}°C.`,
      evidence: [
        `Current Temperature: ${currentTemp}°C`,
        `Crop Minimum Optimum: ${crop.temperatureRange.minC}°C`,
      ],
      limitations:
        'Established winter crops tolerate short cold dips better than seedlings.',
      source: primarySource,
    });
  }

  // 2. Wind precautions
  if (maxWind >= 28) {
    recs.push({
      id: `weather-wind-alert-${crop.id}`,
      category: 'weather_considerations',
      priority: 'high',
      title: `Gusty Winds Advisory (${maxWind} km/h)`,
      explanation: `Peak wind speeds reaching ${maxWind} km/h are forecasted. Postpone all foliar spraying operations (bio-pesticides or micronutrients) to prevent spray drift and wastage. Stake tall crops or vegetables if exposed.`,
      whyThisApplies: `Winds above 25 km/h result in uneven distribution and excessive drift during foliar applications and increase lodging risk.`,
      evidence: [
        `Max Wind Speed: ${maxWind} km/h`,
        `Current Wind Speed: ${weather.current.windSpeedKmH} km/h`,
      ],
      limitations:
        'Sheltered valley plots and boundary windbreaks significantly buffer local wind velocities.',
      source: primarySource,
    });
  }

  // 3. Spray window & Rain probability check
  if (maxRainProb >= 60 || weather.rainfallSummary.todayExpectedMm >= 5) {
    recs.push({
      id: `weather-rain-prob-${crop.id}`,
      category: 'weather_considerations',
      priority: 'high',
      title: `Rain Predicted: Postpone Chemical & Fertilizer Applications`,
      explanation: `High probability of rainfall (${maxRainProb}%) or expected showers (${weather.rainfallSummary.todayExpectedMm} mm). Do not apply top-dressed nitrogen fertilizer or foliar organic sprays, as surface runoff will cause nutrient loss and economic waste.`,
      whyThisApplies: `Precipitation probability exceeds 60%, creating high risk of fertilizer wash-off.`,
      evidence: [
        `Rain Probability: ${maxRainProb}%`,
        `Today's Expected Rainfall: ${weather.rainfallSummary.todayExpectedMm} mm`,
      ],
      limitations:
        'Scattered convective rainfall may not touch every micro-parcel in the district.',
      source: primarySource,
    });
  } else {
    recs.push({
      id: `weather-field-operations-${crop.id}`,
      category: 'weather_considerations',
      priority: 'info',
      title: `Favorable Field Operations Window`,
      explanation: `Current atmospheric conditions (${weather.current.condition}, ${weather.current.temperatureC}°C, wind ${weather.current.windSpeedKmH} km/h) offer a steady window for intercultural operations, weeding, and compost application.`,
      whyThisApplies: `Low rainfall risk and moderate temperatures permit standard farm stewardship tasks.`,
      evidence: [
        `Condition: ${weather.current.condition}`,
        `Precipitation: ${weather.current.precipitationMm} mm`,
        `Wind Speed: ${weather.current.windSpeedKmH} km/h`,
      ],
      limitations:
        'Keep daily track of sudden convective weather updates during transitional seasonal periods.',
      source: primarySource,
    });
  }

  return recs;
}
