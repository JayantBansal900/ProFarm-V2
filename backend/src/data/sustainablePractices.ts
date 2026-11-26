export interface SustainablePractice {
  id: string;
  title: string;
  category: 'soil_health' | 'water_management' | 'nutrient_management' | 'pest_management' | 'climate_resilience';
  description: string;
  benefits: string[];
  limitations: string;
  applicableCropCategories?: string[];
  applicableSoilIds?: string[];
  source: {
    name: string;
    organization: string;
    url?: string;
  };
}

export const SUSTAINABLE_PRACTICES: SustainablePractice[] = [
  {
    id: 'practice-mulching',
    title: 'Organic Surface Mulching & Crop Residue Retention',
    category: 'water_management',
    description:
      'Spreading an organic layer of dry crop residues, straw, or leaves (5–7 cm thick) across the soil surface between crop rows.',
    benefits: [
      'Reduces soil surface evaporation by 20–35%, conserving root-zone moisture',
      'Moderates daytime soil temperature spikes by 2–4°C during warm conditions',
      'Suppresses weed seed germination by shading the inter-row surface',
      'Decomposes over time to replenish soil organic carbon (SOC)',
    ],
    limitations:
      'In poorly drained heavy clay during extended wet spells, thick mulch can retain excessive surface moisture. Ensure mulch does not touch crop stems directly to prevent fungal collar rot.',
    applicableSoilIds: ['soil-sandy', 'soil-sandy-loam', 'soil-loam', 'soil-clay-loam'],
    source: {
      name: 'Principles of Conservation Agriculture & Soil Health Management',
      organization: 'ICAR - Central Soil Salinity Research Institute (CSSRI)',
      url: 'https://cssri.icar.gov.in',
    },
  },
  {
    id: 'practice-green-manuring',
    title: 'In-situ Green Manuring with Leguminous Cover Crops',
    category: 'soil_health',
    description:
      'Growing fast-growing leguminous crops such as Dhaincha (Sesbania aculeata) or Sunnhemp (Crotalaria juncea) for 45–50 days and incorporating them into the soil before main crop sowing.',
    benefits: [
      'Adds 20–25 tonnes/ha of fresh green biomass to feed soil microbiome',
      'Fixes 60–80 kg/ha of atmospheric nitrogen naturally',
      'Loosens compact heavy clay soils and boosts moisture retention in coarse sands',
      'Suppresses seasonal weed flushes between cropping seasons',
    ],
    limitations:
      'Requires pre-sowing moisture and approximately 10–12 days decomposition period before sowing the primary cash or food crop.',
    source: {
      name: 'Organic Matter Recycling and Soil Fertility Maintenance',
      organization: 'ICAR - Indian Institute of Soil Science (IISS), Bhopal',
      url: 'https://iiss.icar.gov.in',
    },
  },
  {
    id: 'practice-crop-rotation',
    title: 'Legume-Cereal Crop Rotation & Intercropping',
    category: 'nutrient_management',
    description:
      'Sequencing cereal or cash crops (e.g., wheat, rice, cotton) with nitrogen-fixing pulses (e.g., chickpea, moong, soybean) either in alternate seasons or as intercrops.',
    benefits: [
      'Disrupts specialized host-specific soil pests, nematodes, and fungal spores',
      'Reduces chemical nitrogen fertilizer requirements for the following crop season',
      'Improves soil biodiversity and builds deeper, multidimensional root channels',
      'Diversifies farmer economic income and cushions against single-crop market volatility',
    ],
    limitations:
      'Requires selecting pulse varieties that fit the local seasonal maturity window without delaying main crop sowing.',
    source: {
      name: 'Cropping Systems Research & Pulse Production Technologies',
      organization: 'ICAR - Indian Institute of Pulses Research (IIPR), Kanpur',
      url: 'https://iipr.icar.gov.in',
    },
  },
  {
    id: 'practice-fym-compost',
    title: 'Farmyard Manure (FYM) & Enriched Vermicompost Incorporation',
    category: 'soil_health',
    description:
      'Incorporating well-decomposed farmyard manure (8–10 tonnes/ha) or earthworm vermicompost (3–5 tonnes/ha) during secondary preparatory tillage.',
    benefits: [
      'Improves cation exchange capacity (CEC), allowing fertilizers to stay bound rather than leaching',
      'Stimulates beneficial soil bacteria (rhizobacteria) and mycorrhizal fungi',
      'Buffers soil against sudden pH shifts and salinity stress',
      'Produces a workable, granular crumb structure across both tight clays and loose sands',
    ],
    limitations:
      'Only fully decomposed manure should be applied; raw or unfermented dung may harbor weed seeds, white grubs, and cause temporary nitrogen immobilization.',
    source: {
      name: 'Standard Operating Procedures for Organic Inputs & Manures',
      organization: 'National Centre of Organic and Natural Farming (NCONF), Ghaziabad',
      url: 'https://ncof.dacnet.nic.in',
    },
  },
  {
    id: 'practice-drip-irrigation',
    title: 'Micro-Irrigation (Drip / Furrow Scheduling)',
    category: 'water_management',
    description:
      'Delivering water directly to the crop root zone at low pressures and frequent controlled intervals, avoiding broad surface flooding.',
    benefits: [
      'Conserves 30–50% irrigation water compared to conventional flood basin methods',
      'Prevents waterlogging, root suffocation, and soil salinity buildup',
      'Enables fertigation (metered soluble nutrient delivery directly to active roots)',
      'Leaves inter-row spaces dry, markedly reducing weed population and weeding labor',
    ],
    limitations:
      'Requires initial capital investment, clean filtration to avoid emitter clogging, and periodic emitter flushing.',
    source: {
      name: 'Micro Irrigation Guidelines & Water Saving Technologies',
      organization: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) / ICAR-CIAE',
      url: 'https://pmksy.gov.in',
    },
  },
  {
    id: 'practice-bbf-drainage',
    title: 'Broad Bed and Furrow (BBF) & Ridge Drainage Layout',
    category: 'climate_resilience',
    description:
      'Shaping fields into raised broad beds (100–120 cm wide) separated by shallow furrows (30–45 cm wide) across the land contour.',
    benefits: [
      'Allows excess surface rainwater to drain safely during intense storm events without submerging root crowns',
      'Conserves crucial root-zone moisture inside the raised bed during intermittent dry spells',
      'Reduces soil crusting and enables tractor/bullock wheel traffic without compacting crop rows',
      'Proven highly effective for Vertisols (Black Cotton Soils) and heavy clay loams',
    ],
    limitations:
      'Requires specialized bed-former attachment or additional labor during initial field shaping.',
    applicableSoilIds: ['soil-clay', 'soil-clay-loam', 'soil-silty'],
    source: {
      name: 'Broad Bed and Furrow System for Soil and Water Management in Vertisols',
      organization: 'International Crops Research Institute for the Semi-Arid Tropics (ICRISAT)',
      url: 'https://www.icrisat.org',
    },
  },
  {
    id: 'practice-ipm',
    title: 'Integrated Pest Management (IPM) & Biological Cultural Controls',
    category: 'pest_management',
    description:
      'Combining cultural practices, pest monitoring with pheromone/sticky traps, and biological agents (Trichoderma, neem seed kernel extract) before chemical options.',
    benefits: [
      'Protects beneficial pollinator populations (honeybees, syrphid flies, predatory ladybird beetles)',
      'Prevents secondary pest resurgence and pesticide resistance development',
      'Significantly lowers farmer input expenditure on synthetic chemical sprays',
      'Eliminates toxic chemical pesticide residues on food and commercial produce',
    ],
    limitations:
      'Requires regular field scouting and early threshold detection rather than blanket calendar-based spraying.',
    source: {
      name: 'Integrated Pest Management Package of Practices',
      organization: 'Directorate of Plant Protection, Quarantine & Storage (DPPQS) / ICAR-NCIPM',
      url: 'https://ppqs.gov.in',
    },
  },
  {
    id: 'practice-neem-urea',
    title: 'Neem-Coated Urea & Split Nitrogen Application',
    category: 'nutrient_management',
    description:
      'Applying nitrogen fertilizer in 3–4 synchronized splits aligned with peak crop growth stages rather than a heavy single basal broadcast.',
    benefits: [
      'Neem oil coating slows nitrification rate, reducing ammonia volatilization and leaching',
      'Increases Nitrogen Use Efficiency (NUE) by 10–15%',
      'Eliminates nitrogen luxury consumption that attracts sucking pests (aphids, jassids)',
      'Prevents nitrate contamination in local groundwater aquifers and village wells',
    ],
    limitations:
      'Timing must coincide with favorable soil moisture; avoid broadcasting prior to forecasted heavy storms to prevent runoff loss.',
    source: {
      name: 'Efficient Nutrient Management in Field Crops',
      organization: 'Indian Agricultural Research Institute (ICAR-IARI), New Delhi',
      url: 'https://iari.res.in',
    },
  },
];
