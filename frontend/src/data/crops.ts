import { CropRecord } from '../types/agriculture';

export const CROPS_DATA: CropRecord[] = [
  {
    id: 'crop-wheat',
    slug: 'wheat',
    name: 'Wheat',
    hindiName: 'गेहूं (Gehun)',
    scientificName: 'Triticum aestivum',
    category: 'Cereal & Grain',
    shortDescription:
      'Premier winter staple grain of India, grown extensively in the Indo-Gangetic plains during the Rabi season under cool, dry conditions.',
    seasons: ['Rabi'],
    suitableSoilIds: ['soil-loam', 'soil-clay', 'soil-silty', 'soil-clay-loam'],
    temperatureRange: {
      minC: 10,
      maxC: 25,
      description: 'Cool conditions required during vegetative growth (10–15°C); warm, sunny weather for ripening (20–25°C).',
    },
    waterRequirement: {
      level: 'Moderate',
      annualMm: '450–650 mm',
      description: 'Requires 4–6 timed irrigations, with Crown Root Initiation (CRI) being the most critical stage.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'Late October to Mid November',
      harvestPeriod: 'March to April',
      germinationDays: '5–7 days',
    },
    soilPreparation:
      'Requires a fine, pulverized seedbed free of clods. Deep summer plowing followed by 2–3 harrowings and planking to conserve residual soil moisture.',
    irrigationGuidance:
      'Crucial irrigation stages include CRI (20–25 DAS), tillering (40–45 DAS), jointing, flowering, and grain filling. Avoid excess irrigation during harvest.',
    sustainablePractices: [
      'Adoption of Zero-Till (Happy Seeder) in paddy straw stubble fields to conserve moisture and eliminate stubble burning',
      'Balanced NPK fertilization supplemented with zinc sulphate (25 kg/ha) in deficient alluvial soils',
      'Timely sowing to avoid terminal heat stress during grain filling stage in late March',
    ],
    commonChallenges: [
      'Yellow rust and brown rust leaf diseases during humid winter spells',
      'Terminal heat waves causing premature ripening and shrivelled grain',
      'Lodging caused by untimely rain or storms close to maturity',
    ],
    icon: '🌾',
    colorTheme: 'amber',
    sources: [
      {
        name: 'ICAR - Indian Institute of Wheat and Barley Research (IIWBR)',
        url: 'https://iiwbr.icar.gov.in',
        organization: 'ICAR-IIWBR, Karnal',
      },
      {
        name: 'Package of Practices for Rabi Crops',
        organization: 'Punjab Agricultural University (PAU), Ludhiana',
      },
    ],
  },
  {
    id: 'crop-rice',
    slug: 'rice',
    name: 'Rice',
    hindiName: 'चावल / धान (Dhan)',
    scientificName: 'Oryza sativa',
    category: 'Cereal & Grain',
    shortDescription:
      'The foundational staple crop of India, primarily cultivated during the monsoon Kharif season in flooded or moisture-abundant soils.',
    seasons: ['Kharif', 'Zaid'],
    suitableSoilIds: ['soil-clay', 'soil-silty', 'soil-clay-loam'],
    temperatureRange: {
      minC: 20,
      maxC: 37,
      description: 'Warm, humid climate; thrives best between 22°C and 32°C during growing phases with plenty of sunshine.',
    },
    waterRequirement: {
      level: 'Very High',
      annualMm: '1100–1500 mm',
      description: 'Submerged or saturated water regime during vegetative and reproductive stages; high water footprint in traditional puddling.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'May to July (Nursery / Direct Seeding)',
      harvestPeriod: 'October to December',
      germinationDays: '4–6 days',
    },
    soilPreparation:
      'Puddling (repeated plowing in standing water) is traditional to break macro-pores, reduce percolation, and destroy weeds. Alternate wetting and drying or DSR requires level pulverized tilth.',
    irrigationGuidance:
      'Maintain 2–5 cm water depth during early transplanting, transitioning to alternate wetting and drying (AWD) to save 20–30% irrigation water without yield penalty.',
    sustainablePractices: [
      'Direct Seeded Rice (DSR) with pre-emergence herbicides to reduce groundwater extraction and diesel cost',
      'System of Rice Intensification (SRI) using young single seedlings and mechanical weeders',
      'Laser land leveling to achieve uniform moisture distribution and minimize runoff wastage',
    ],
    commonChallenges: [
      'Bacterial Leaf Blight (BLB), Blast, and Brown Plant Hopper (BPH) infestations',
      'Severe groundwater depletion in intensive tubewell-irrigated regions',
      'High labor dependency during manual transplanting and harvest peaks',
    ],
    icon: '🍚',
    colorTheme: 'emerald',
    sources: [
      {
        name: 'ICAR - National Rice Research Institute (NRRI)',
        url: 'https://icar-nrri.in',
        organization: 'ICAR-NRRI, Cuttack',
      },
      {
        name: 'International Rice Research Institute (IRRI) South Asia Hub',
        url: 'https://www.irri.org',
        organization: 'IRRI',
      },
    ],
  },
  {
    id: 'crop-maize',
    slug: 'maize',
    name: 'Maize',
    hindiName: 'मक्का (Makka)',
    scientificName: 'Zea mays',
    category: 'Cereal & Grain',
    shortDescription:
      'A versatile multi-purpose cereal widely cultivated for food, poultry feed, and industrial starch with high photosynthetic efficiency.',
    seasons: ['Kharif', 'Rabi'],
    suitableSoilIds: ['soil-loam', 'soil-silty', 'soil-sandy-loam'],
    temperatureRange: {
      minC: 18,
      maxC: 35,
      description: 'Warm, sunny weather; daytime temperatures around 21–27°C are ideal. Sensitive to frost.',
    },
    waterRequirement: {
      level: 'Moderate',
      annualMm: '500–750 mm',
      description: 'Requires well-timed moisture during tasseling and silking; highly intolerant to standing water/waterlogging.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'June–July (Kharif) or October–November (Rabi)',
      harvestPeriod: 'September–October (Kharif) or March–April (Rabi)',
      germinationDays: '4–7 days',
    },
    soilPreparation:
      'Deep plowing to break subsoil compaction, followed by disc harrowing to achieve medium-granular tilth. Ridge-and-furrow system strongly recommended.',
    irrigationGuidance:
      'Critical stages: knee-high stage (25–30 DAS), tasseling, silking, and early grain filling. Ensure field drains rapidly after heavy monsoon downpours.',
    sustainablePractices: [
      'Ridge planting to safeguard root crowns against monsoon waterlogging',
      'Intercropping with pulses like cowpea, green gram, or soybean for atmospheric nitrogen fixation',
      'Balanced sulfur and micronutrient (zinc) application for superior cob development',
    ],
    commonChallenges: [
      'Fall Armyworm (Spodoptera frugiperda) defoliation on young leaves and tassels',
      'Stalk rots and seedling blights in poorly drained fields',
      'Nutrient leaching in heavy rainfall zones',
    ],
    icon: '🌽',
    colorTheme: 'yellow',
    sources: [
      {
        name: 'ICAR - Indian Institute of Maize Research (IIMR)',
        url: 'https://iimr.icar.gov.in',
        organization: 'ICAR-IIMR, Ludhiana',
      },
    ],
  },
  {
    id: 'crop-bajra',
    slug: 'pearl-millet',
    name: 'Pearl Millet (Bajra)',
    hindiName: 'बाजरा (Bajra)',
    scientificName: 'Pennisetum glaucum',
    category: 'Cereal & Grain',
    shortDescription:
      'Drought-hardy, climate-resilient super millet rich in iron, zinc, and dietary fiber; the lifeblood of arid and semi-arid Indian agriculture.',
    seasons: ['Kharif', 'Zaid'],
    suitableSoilIds: ['soil-sandy', 'soil-sandy-loam'],
    temperatureRange: {
      minC: 22,
      maxC: 40,
      description: 'Remarkable heat tolerance; grows actively between 28°C and 36°C even in intense summer sunshine.',
    },
    waterRequirement: {
      level: 'Low',
      annualMm: '350–500 mm',
      description: 'Extremely efficient water user; thrives under dryland rainfed situations with minimal supplemental watering.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'First onset of monsoon (Late June to mid July)',
      harvestPeriod: 'September to October',
      germinationDays: '3–5 days',
    },
    soilPreparation:
      'Shallow plowing or harrowing is sufficient; excessive pulverization of sandy soils leads to wind erosion and moisture loss.',
    irrigationGuidance:
      'Primarily rainfed. Under dry spells, 1–2 life-saving irrigations during boot leaf emergence and flowering stage substantially boost grain yield.',
    sustainablePractices: [
      'Intercropping with drought-tolerant legumes like cluster bean (guar) or moth bean',
      'Seed treatment with biofertilizer Azospirillum and PSB cultures before drilling',
      'Contour bunding and in-situ rainwater harvesting to conserve runoff in semi-arid zones',
    ],
    commonChallenges: [
      'Downy mildew (green ear disease) during humid microclimate intervals',
      'Ergot infection when overcast rains coincide with flowering',
      'Shoot fly damage during early seedling emergence',
    ],
    icon: '🌾',
    colorTheme: 'orange',
    sources: [
      {
        name: 'ICAR - Indian Institute of Millets Research (IIMR)',
        url: 'https://millets.res.in',
        organization: 'ICAR-IIMR, Hyderabad',
      },
      {
        name: 'ICRISAT - Pearl Millet Agronomy Guide',
        url: 'https://www.icrisat.org',
        organization: 'International Crops Research Institute for the Semi-Arid Tropics',
      },
    ],
  },
  {
    id: 'crop-jowar',
    slug: 'sorghum',
    name: 'Sorghum (Jowar)',
    hindiName: 'ज्वार (Jowar)',
    scientificName: 'Sorghum bicolor',
    category: 'Cereal & Grain',
    shortDescription:
      'Nutritious dual-purpose cereal providing grain for human consumption and quality fodder for livestock across Maharashtra, Karnataka, and MP.',
    seasons: ['Kharif', 'Rabi'],
    suitableSoilIds: ['soil-clay-loam', 'soil-loam', 'soil-sandy'],
    temperatureRange: {
      minC: 20,
      maxC: 38,
      description: 'Warm-season crop; optimal growth at 26–32°C. Capable of entering dormancy during extreme dry spells.',
    },
    waterRequirement: {
      level: 'Low',
      annualMm: '400–600 mm',
      description: 'High drought endurance; extensive fibrous root system extracts deep moisture efficiently.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'June–July (Kharif) or September–October (Rabi)',
      harvestPeriod: 'October–November (Kharif) or February–March (Rabi)',
      germinationDays: '4–6 days',
    },
    soilPreparation:
      'Medium-deep plowing followed by harrowing to produce a firm, weed-free seedbed that retains subsoil moisture.',
    irrigationGuidance:
      'Grown mostly rainfed; if dry spell occurs, irrigate during flowering and grain development stages.',
    sustainablePractices: [
      'Crop rotation with chickpea or pigeon pea to rejuvenate soil nitrogen reserves',
      'Use of organic mulching in Rabi jowar to check capillary moisture evaporation',
      'Integrated pest management for shoot fly and stem borer using pheromone traps',
    ],
    commonChallenges: [
      'Sorghum shoot fly on seedlings less than 30 days old',
      'Stem borer tunneling into stalks during mid-season growth',
      'Grain mold if unseasonal rains occur during panicle maturity',
    ],
    icon: '🌾',
    colorTheme: 'stone',
    sources: [
      {
        name: 'ICAR - All India Coordinated Research Project on Sorghum',
        url: 'https://millets.res.in/sorghum.php',
        organization: 'ICAR-IIMR',
      },
    ],
  },
  {
    id: 'crop-chickpea',
    slug: 'chickpea',
    name: 'Chickpea (Chana)',
    hindiName: 'चना / छोले (Chana)',
    scientificName: 'Cicer arietinum',
    category: 'Pulse & Legume',
    shortDescription:
      'The leading pulse crop of India (both Desi and Kabuli types), fixing atmospheric nitrogen and serving as a vital plant-protein resource.',
    seasons: ['Rabi'],
    suitableSoilIds: ['soil-loam', 'soil-sandy-loam'],
    temperatureRange: {
      minC: 10,
      maxC: 28,
      description: 'Cool weather during vegetative cycle (15–20°C); warm, dry weather during pod maturity (22–26°C).',
    },
    waterRequirement: {
      level: 'Low',
      annualMm: '300–450 mm',
      description: 'Grows primarily on conserved soil moisture; sensitive to over-irrigation which induces vegetative overgrowth at the expense of pods.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'October to Mid November',
      harvestPeriod: 'February to April',
      germinationDays: '5–8 days',
    },
    soilPreparation:
      'Rough, cloddy seedbed preferred over excessively pulverized soil to facilitate aeration and prevent surface compaction.',
    irrigationGuidance:
      'Usually 1–2 light irrigations: one at pre-flowering and one at pod-filling. Never irrigate during active flowering as it causes flower drop.',
    sustainablePractices: [
      'Seed inoculation with Rhizobium leguminosarum and PSB culture to maximize root nodulation',
      'Nipping (pruning of apical buds at 30–40 DAS) to stimulate lateral branching and higher pod count',
      'Intercropping with mustard or linseed in 4:1 or 6:1 row ratios to disrupt pest cycles',
    ],
    commonChallenges: [
      'Fusarium wilt and dry root rot in soils with drainage issues',
      'Pod borer (Helicoverpa armigera) feeding on green developing pods',
      'Cloudy/frosty weather during flowering triggering significant flower shedding',
    ],
    icon: '🫘',
    colorTheme: 'yellow',
    sources: [
      {
        name: 'ICAR - Indian Institute of Pulses Research (IIPR)',
        url: 'https://iipr.icar.gov.in',
        organization: 'ICAR-IIPR, Kanpur',
      },
    ],
  },
  {
    id: 'crop-mustard',
    slug: 'mustard',
    name: 'Mustard',
    hindiName: 'सरसों / राई (Sarson)',
    scientificName: 'Brassica juncea',
    category: 'Oilseed',
    shortDescription:
      'Major edible oilseed crop of Northern and Western India, celebrated for its high oil recovery, pungency, and winter adaptability.',
    seasons: ['Rabi'],
    suitableSoilIds: ['soil-loam', 'soil-sandy-loam'],
    temperatureRange: {
      minC: 12,
      maxC: 26,
      description: 'Cool subtropical climate; bright sunshine and crisp dry air favor vigorous growth and oil synthesis.',
    },
    waterRequirement: {
      level: 'Low',
      annualMm: '350–450 mm',
      description: 'Low water requirement; 2 well-timed irrigations are sufficient in most semi-arid conditions.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'October (optimum: Oct 1–20)',
      harvestPeriod: 'February to March',
      germinationDays: '3–5 days',
    },
    soilPreparation:
      'Clean, fine, friable seedbed with adequate soil moisture for small seed placement. Depth of sowing should not exceed 3–4 cm.',
    irrigationGuidance:
      'First irrigation at rossetting/branching stage (25–30 DAS); second irrigation at siliquae (pod) formation stage (50–60 DAS).',
    sustainablePractices: [
      'Sulfur fertilization (20–40 kg/ha elemental sulfur or gypsum) to boost oil content and glucosinolate quality',
      'Thinning at 15–20 DAS to maintain optimal plant-to-plant distance (10–15 cm) and avoid overcrowding',
      'Bee-keeping (Apis mellifera hives) in the vicinity to enhance pollination and seed setting by 15–25%',
    ],
    commonChallenges: [
      'Mustard aphid (Lipaphis erysimi) causing devastating sap-sucking during cloudy winter spells',
      'White rust and Alternaria blight leaf spots',
      'Frost injury during pod-setting in early January',
    ],
    icon: '🌼',
    colorTheme: 'yellow',
    sources: [
      {
        name: 'ICAR - Directorate of Rapeseed-Mustard Research (DRMR)',
        url: 'https://drmr.icar.gov.in',
        organization: 'ICAR-DRMR, Bharatpur',
      },
    ],
  },
  {
    id: 'crop-cotton',
    slug: 'cotton',
    name: 'Cotton',
    hindiName: 'कपास (Kapas)',
    scientificName: 'Gossypium hirsutum / arboreum',
    category: 'Fiber',
    shortDescription:
      'Known as the "White Gold" of Indian agriculture, providing the core raw material for India’s extensive textile and apparel industry.',
    seasons: ['Kharif'],
    suitableSoilIds: ['soil-clay-loam', 'soil-clay', 'soil-loam'],
    temperatureRange: {
      minC: 21,
      maxC: 38,
      description: 'Warm, long frost-free season; requires minimum 180–200 sunny days with abundant warmth during boll opening.',
    },
    waterRequirement: {
      level: 'Moderate',
      annualMm: '600–900 mm',
      description: 'Drought tolerant once established, but water stress during square (bud) and boll formation causes severe shedding.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'April–May (North Zone) or June–July (Central & South Zones)',
      harvestPeriod: 'October to February (multiple pickings)',
      germinationDays: '5–9 days',
    },
    soilPreparation:
      'Deep plowing to eliminate perennial weeds and break hard subsoil pan, followed by harrowing and formation of broad beds or ridges.',
    irrigationGuidance:
      'Drip irrigation with fertigation achieves 30–40% water savings and higher boll retention compared to flood irrigation.',
    sustainablePractices: [
      'Refuge planting and pheromone traps for pink bollworm resistance management',
      'High-Density Planting System (HDPS) for short-duration compact cotton varieties',
      'Foliar spray of 2% DAP and 1% potassium nitrate (KNO3) during boll development to curb nutrient deficiency',
    ],
    commonChallenges: [
      'Pink bollworm (Pectinophora gossypiella) internal larvae feeding on developing lint and seed',
      'Whitefly infestations acting as vectors for Cotton Leaf Curl Virus (CLCuV)',
      'High market price volatility and cost of chemical crop protection',
    ],
    icon: '☁️',
    colorTheme: 'slate',
    sources: [
      {
        name: 'ICAR - Central Institute for Cotton Research (CICR)',
        url: 'https://cicr.icar.gov.in',
        organization: 'ICAR-CICR, Nagpur',
      },
    ],
  },
  {
    id: 'crop-sugarcane',
    slug: 'sugarcane',
    name: 'Sugarcane',
    hindiName: 'गन्ना (Ganna)',
    scientificName: 'Saccharum officinarum',
    category: 'Commercial & Cash',
    shortDescription:
      'Long-duration commercial cash crop supporting rural livelihoods, sugar manufacturing, jaggery production, and renewable ethanol bio-refineries.',
    seasons: ['Kharif', 'Rabi', 'Zaid'],
    suitableSoilIds: ['soil-clay-loam', 'soil-loam', 'soil-silty', 'soil-clay'],
    temperatureRange: {
      minC: 20,
      maxC: 38,
      description: 'Tropical and subtropical warmth; 28–32°C ideal for sprouting and vegetative elongation; cool dry weather favors sucrose ripening.',
    },
    waterRequirement: {
      level: 'Very High',
      annualMm: '1500–2200 mm',
      description: 'High water requirement distributed over a 10–14 month crop life cycle; highly responsive to sub-surface drip irrigation.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'Spring (Feb–March), Autumn (Oct), or Adsali (July in Maharashtra)',
      harvestPeriod: '10–14 months after sett planting (Dec to April)',
      germinationDays: '10–18 days',
    },
    soilPreparation:
      'Deep plowing (30–45 cm) using disc plow or chisel, followed by rotary tilling and furrow opening at 90–120 cm row spacing.',
    irrigationGuidance:
      'Irrigate furrows every 8–10 days during summer and 15–20 days during winter. Cease irrigation 15–20 days before harvest to concentrate sucrose.',
    sustainablePractices: [
      'Sub-surface drip irrigation (SSDI) combined with trash mulching between cane rows to cut water consumption by 40%',
      'Single bud sett planting or tissue culture plantlets (STP technique) reducing seed sett tonnage requirement by 75%',
      'Trash shredding and in-situ decomposition using Trichoderma cultures instead of burning residue',
    ],
    commonChallenges: [
      'Early shoot borer and top borer damage in formative stages',
      'Red rot fungal disease destroying vascular tissue and souring juice quality',
      'Prolonged soil moisture depletion in water-stressed command areas',
    ],
    icon: '🎋',
    colorTheme: 'emerald',
    sources: [
      {
        name: 'ICAR - Indian Institute of Sugarcane Research (IISR)',
        url: 'https://iisr.icar.gov.in',
        organization: 'ICAR-IISR, Lucknow',
      },
      {
        name: 'ICAR - Sugarcane Breeding Institute (SBI)',
        url: 'https://sugarcane.icar.gov.in',
        organization: 'ICAR-SBI, Coimbatore',
      },
    ],
  },
  {
    id: 'crop-groundnut',
    slug: 'groundnut',
    name: 'Groundnut (Peanut)',
    hindiName: 'मूंगफली (Mungfali)',
    scientificName: 'Arachis hypogaea',
    category: 'Oilseed',
    shortDescription:
      'Valuable legume oilseed with underground pod development, producing rich edible oil, protein meals, and nutritious livestock haulm.',
    seasons: ['Kharif', 'Zaid'],
    suitableSoilIds: ['soil-sandy-loam', 'soil-sandy'],
    temperatureRange: {
      minC: 22,
      maxC: 34,
      description: 'Warm conditions; optimum temperature for vegetative growth and flowering is 25–30°C.',
    },
    waterRequirement: {
      level: 'Low',
      annualMm: '450–650 mm',
      description: 'Critical watering stages are flowering, peg penetration, and pod development; avoids standing water.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'June–July (Kharif) or January–February (Summer/Rabi)',
      harvestPeriod: 'October–November (Kharif) or May (Summer)',
      germinationDays: '5–8 days',
    },
    soilPreparation:
      'Friable, loose, well-aerated seedbed is essential so that the pegs (gynophores) can penetrate effortlessly into the soil without hardening.',
    irrigationGuidance:
      'Light, frequent irrigations preferred. Ensure adequate moisture during pegging and pod-filling so pegs don’t dry out before entering the soil.',
    sustainablePractices: [
      'Gypsum application (400–500 kg/ha at pegging, 35–40 DAS) to deliver calcium for pod shell formation and eliminate "pops" (empty pods)',
      'Seed treatment with Trichoderma viride and Rhizobium inoculant prior to planting',
      'Broad Bed and Furrow (BBF) cultivation on clay-rich plains to ensure aeration and easy harvesting',
    ],
    commonChallenges: [
      'Tikka disease (Cercospora leaf spot) and collar rot in humid microclimates',
      'White grub larvae severing subterranean pegs and tap roots',
      'Aflatoxin contamination if pods are stored under humid, improperly dried conditions',
    ],
    icon: '🥜',
    colorTheme: 'amber',
    sources: [
      {
        name: 'ICAR - Directorate of Groundnut Research (DGR)',
        url: 'https://dgr.icar.gov.in',
        organization: 'ICAR-DGR, Junagadh',
      },
    ],
  },
  {
    id: 'crop-soybean',
    slug: 'soybean',
    name: 'Soybean',
    hindiName: 'सोयाबीन (Soyabean)',
    scientificName: 'Glycine max',
    category: 'Pulse & Legume',
    shortDescription:
      'Major rainfed oilseed and protein crop of Central India (Madhya Pradesh and Maharashtra), enriching soils via symbiotic nitrogen nodulation.',
    seasons: ['Kharif'],
    suitableSoilIds: ['soil-clay-loam', 'soil-loam', 'soil-clay'],
    temperatureRange: {
      minC: 20,
      maxC: 34,
      description: 'Warm temperate to subtropical; optimal emergence at 25–28°C. Sensitive to prolonged saturated chill.',
    },
    waterRequirement: {
      level: 'Moderate',
      annualMm: '600–750 mm',
      description: 'Performs well under monsoon rains; sensitive to waterlogging during early germination and moisture stress during pod filling.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'Mid June to first week of July',
      harvestPeriod: 'Late September to October',
      germinationDays: '4–6 days',
    },
    soilPreparation:
      'One deep plowing followed by two cross-harrowings to create a smooth, weed-free seedbed. Avoid overly fine pulverization which crusts after rain.',
    irrigationGuidance:
      'Almost exclusively rainfed during Kharif. If extended monsoon dry spells occur at pod filling stage, 1 life-saving irrigation protects yield.',
    sustainablePractices: [
      'Ridge-and-furrow or Broad Bed Furrow (BBF) planting to prevent seed rotting during heavy early monsoon downpours',
      'Dual seed inoculation with Bradyrhizobium japonicum and Phosphate Solubilizing Bacteria (PSB)',
      'Intercropping with pigeon pea (4:2 ratio) to de-risk against erratic monsoon rainfall patterns',
    ],
    commonChallenges: [
      'Yellow Mosaic Virus (YMV) transmitted by whitefly vectors',
      'Stem fly (Melanagromyza sojae) and semilooper caterpillar defoliation',
      'Rapid seed viability loss in hot, humid storage conditions',
    ],
    icon: '🌱',
    colorTheme: 'emerald',
    sources: [
      {
        name: 'ICAR - Indian Institute of Soybean Research (IISR)',
        url: 'https://iisrindore.icar.gov.in',
        organization: 'ICAR-IISR, Indore',
      },
    ],
  },
  {
    id: 'crop-potato',
    slug: 'potato',
    name: 'Potato',
    hindiName: 'आलू (Aloo)',
    scientificName: 'Solanum tuberosum',
    category: 'Tuber & Root',
    shortDescription:
      'High-yielding carbohydrate and nutritional powerhouse cultivated in winter across UP, West Bengal, and Bihar under cool sunny regimes.',
    seasons: ['Rabi'],
    suitableSoilIds: ['soil-sandy-loam', 'soil-loam', 'soil-silty'],
    temperatureRange: {
      minC: 14,
      maxC: 24,
      description: 'Cool conditions; night temperatures around 15–18°C are crucial for optimal tuber induction and swelling.',
    },
    waterRequirement: {
      level: 'Moderate',
      annualMm: '450–600 mm',
      description: 'Requires uniform soil moisture; shallow root system is sensitive to both drought stress and waterlogging.',
    },
    sowingAndHarvest: {
      sowingPeriod: 'October to Mid November',
      harvestPeriod: 'January to March',
      germinationDays: '10–14 days',
    },
    soilPreparation:
      'Deep, loose, well-drained pulverized tilth. Furrows opened at 60 cm spacing, tubers planted on ridges and earthed-up at 30–35 DAS.',
    irrigationGuidance:
      'Irrigate lightly every 7–10 days in sandy loams. Stop watering 10–12 days prior to dehaulming/harvest to allow skin curing.',
    sustainablePractices: [
      'Earthing-up at 30–35 days to cover expanding tubers and protect them from sunlight greening (solanine synthesis)',
      'Use of certified disease-free Seed Plot Technique (SPT) tubers',
      'Drip and sprinkler irrigation with soluble fertigation to improve tuber grade uniformity',
    ],
    commonChallenges: [
      'Late blight (Phytophthora infestans) epidemics during cool, cloudy, fog-laden winter conditions',
      'Potato tuber moth (PTM) and aphid vectors transmitting leaf roll virus',
      'High storage costs and post-harvest price swings',
    ],
    icon: '🥔',
    colorTheme: 'orange',
    sources: [
      {
        name: 'ICAR - Central Potato Research Institute (CPRI)',
        url: 'https://cpri.icar.gov.in',
        organization: 'ICAR-CPRI, Shimla',
      },
    ],
  },
];

export function getCropById(id: string): CropRecord | undefined {
  return CROPS_DATA.find((c) => c.id === id);
}

export function getCropBySlug(slug: string): CropRecord | undefined {
  return CROPS_DATA.find((c) => c.slug === slug);
}

export function getCropsBySoilId(soilId: string): CropRecord[] {
  return CROPS_DATA.filter((c) => c.suitableSoilIds.includes(soilId));
}
