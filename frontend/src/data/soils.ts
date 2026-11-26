import { SoilRecord } from '../types/agriculture';

export const SOILS_DATA: SoilRecord[] = [
  {
    id: 'soil-loam',
    slug: 'loamy-soil',
    name: 'Loamy Soil',
    shortDescription:
      'A balanced mixture of sand, silt, and clay offering optimal drainage, aeration, and moisture retention for diverse Indian crops.',
    textureCharacteristics:
      'Medium texture with a crumbly, soft feel when moist; typically contains roughly 40% sand, 40% silt, and 20% clay particles.',
    drainage: 'Good / Well-Drained',
    waterRetention: 'Moderate',
    nutrientRetention:
      'High cation exchange capacity and balanced organic matter retention, making nutrients easily accessible to root zones.',
    advantages: [
      'Optimal balance between moisture holding and root aeration',
      'Naturally fertile with workable tilth across moisture spectrums',
      'Warms up steadily in spring and resists compaction better than heavy clay',
      'Supports the widest diversity of cash, pulse, cereal, and horticultural crops',
    ],
    challenges: [
      'Can degrade and lose organic carbon quickly under intensive monoculture without crop residues',
      'Prone to erosion on sloped fields if left bare between sowing seasons',
    ],
    improvementPractices: [
      'Regular incorporation of well-decomposed Farm Yard Manure (FYM) or vermicompost (5–10 tonnes/ha)',
      'Green manuring with Dhaincha (Sesbania) or Sunnhemp prior to Kharif sowing',
      'Minimum tillage or conservation tillage to protect soil structure and microbial life',
    ],
    suitableCropIds: [
      'crop-wheat',
      'crop-maize',
      'crop-chickpea',
      'crop-mustard',
      'crop-cotton',
      'crop-sugarcane',
      'crop-soybean',
      'crop-potato',
    ],
    colorTheme: 'amber',
    icon: '🌾',
    sources: [
      {
        name: 'Indian Council of Agricultural Research (ICAR) - Soil Health Bulletin',
        url: 'https://icar.org.in',
        organization: 'ICAR, Government of India',
      },
      {
        name: 'FAO Soils Portal: Loam and Soil Quality',
        url: 'https://www.fao.org/soils-portal',
        organization: 'Food and Agriculture Organization (FAO)',
      },
    ],
  },
  {
    id: 'soil-clay',
    slug: 'clay-soil',
    name: 'Clay Soil',
    shortDescription:
      'Heavy, dense soil characterized by high water retention and fine mineral particles, widely cultivated for wetland rice and sugarcane.',
    textureCharacteristics:
      'Fine-textured, sticky and plastic when wet; hard and cloddy with visible cracking when dry.',
    drainage: 'Slow / Poor',
    waterRetention: 'Very High',
    nutrientRetention:
      'Very high nutrient-holding capacity due to charged clay minerals; retains potassium, calcium, and magnesium effectively.',
    advantages: [
      'Exceptional water retention ideal for water-intensive puddle cultivation (paddy/rice)',
      'High natural mineral fertility and slow nutrient leaching',
      'Sustains moisture during prolonged dry spells better than lighter soils',
    ],
    challenges: [
      'Poor internal drainage leading to waterlogging risk for sensitive root crops',
      'Heavy draft requirements; narrow window for effective tillage between too-wet and rock-hard dry',
      'Root aeration can become restricted when soil pores remain saturated',
    ],
    improvementPractices: [
      'Addition of gypsum (calcium sulphate) in sodic/compacted clays to improve flocculation and porosity',
      'Deep subsoiling every 2–3 seasons to shatter hardpans below plow depth',
      'Incorporation of bulky organic matter and paddy straw mulch to prevent surface crusting',
      'Ridge-and-furrow planting for moisture-sensitive crops like pulses or cotton',
    ],
    suitableCropIds: [
      'crop-rice',
      'crop-wheat',
      'crop-sugarcane',
      'crop-cotton',
      'crop-soybean',
    ],
    colorTheme: 'stone',
    icon: '🧱',
    sources: [
      {
        name: 'National Bureau of Soil Survey and Land Use Planning (NBSS&LUP)',
        url: 'https://nbsslup.icar.gov.in',
        organization: 'ICAR-NBSS&LUP',
      },
      {
        name: 'FAO - Management of Heavy Clay Soils',
        url: 'https://www.fao.org',
        organization: 'Food and Agriculture Organization (FAO)',
      },
    ],
  },
  {
    id: 'soil-sandy',
    slug: 'sandy-soil',
    name: 'Sandy Soil',
    shortDescription:
      'Light, porous soil composed predominantly of coarse particles, providing rapid drainage but low moisture and nutrient retention.',
    textureCharacteristics:
      'Coarse and gritty texture; non-cohesive when moist and crumbles instantly between fingers.',
    drainage: 'Rapid / Excessive',
    waterRetention: 'Low',
    nutrientRetention:
      'Very low cation exchange capacity; nitrogen and potassium leach rapidly below the root zone with heavy irrigation or rainfall.',
    advantages: [
      'Excellent root aeration and freedom from waterlogging',
      'Easy to till, requires low draft power, and allows effortless digging of tuber/pod crops',
      'Warms quickly during the early season, facilitating rapid seed germination',
    ],
    challenges: [
      'High irrigation frequency required due to quick percolation',
      'Fertilizer leaching leads to nutrient deficiency if applied in single large doses',
      'Prone to severe wind and water erosion when uncovered',
    ],
    improvementPractices: [
      'Frequent, light split applications of fertilizers rather than single basal dressing',
      'Adoption of micro-irrigation (drip irrigation) to deliver water directly to the root zone without deep drainage loss',
      'Heavy application of compost, biochar, and green manure to build humus and moisture-holding colloidal content',
      'Mulching with crop residue to reduce surface evaporation and soil temperature spikes',
    ],
    suitableCropIds: [
      'crop-bajra',
      'crop-jowar',
      'crop-groundnut',
    ],
    colorTheme: 'yellow',
    icon: '🏜️',
    sources: [
      {
        name: 'Central Arid Zone Research Institute (CAZRI) - Sandy Soil Management',
        url: 'http://www.cazri.res.in',
        organization: 'ICAR-CAZRI, Jodhpur',
      },
      {
        name: 'Government of India - National Soil Health Card Scheme Guidelines',
        url: 'https://soilhealth.dac.gov.in',
        organization: 'Ministry of Agriculture & Farmers Welfare',
      },
    ],
  },
  {
    id: 'soil-silty',
    slug: 'silty-soil',
    name: 'Silty Soil',
    shortDescription:
      'Smooth, highly fertile alluvial soil predominantly deposited by river basins, offering good moisture holding and balanced fertility.',
    textureCharacteristics:
      'Smooth, floury, talcum-powder feel when dry; soapy, slick feel when wet with moderate cohesion.',
    drainage: 'Moderate',
    waterRetention: 'High',
    nutrientRetention:
      'High natural fertility; holds organic nutrients and micronutrients well throughout the profile.',
    advantages: [
      'Very high native mineral and biological fertility (common in Indo-Gangetic plains)',
      'Finer than sand, providing reliable moisture retention without the extreme compactness of clay',
      'Allows deep root penetration when uncompacted',
    ],
    challenges: [
      'High susceptibility to surface crusting after heavy rains, which can hinder seed emergence',
      'Prone to water erosion and gully formation along drainage lines',
      'Can become compacted if heavy farm machinery is operated when saturated',
    ],
    improvementPractices: [
      'Surface residue retention (zero-till happy seeder practice) to prevent surface crusting and impact capping',
      'Avoidance of heavy machinery transit on wet fields',
      'Cover cropping between main seasons to hold fine silts against monsoon runoff',
    ],
    suitableCropIds: [
      'crop-rice',
      'crop-wheat',
      'crop-sugarcane',
      'crop-maize',
      'crop-potato',
    ],
    colorTheme: 'emerald',
    icon: '🌊',
    sources: [
      {
        name: 'Indian Institute of Soil Science (IISS) - Alluvial Soil Dynamics',
        url: 'https://iiss.icar.gov.in',
        organization: 'ICAR-IISS, Bhopal',
      },
    ],
  },
  {
    id: 'soil-sandy-loam',
    slug: 'sandy-loam-soil',
    name: 'Sandy Loam Soil',
    shortDescription:
      'A versatile, well-aerated loam with a higher proportion of sand, making it the premier soil for root, tuber, and pulse crops in India.',
    textureCharacteristics:
      'Gritty feel with enough fine silt and clay to cast a weak ribbon; soft and easily crumbled.',
    drainage: 'Good / Well-Drained',
    waterRetention: 'Moderate',
    nutrientRetention:
      'Moderate retention; benefits substantially from split application of nitrogenous fertilizers.',
    advantages: [
      'Superb root development and tuber expansion without shape distortion (ideal for potato and groundnut)',
      'Drains excess monsoon rain quickly, preventing pulse root rot',
      'Easy seedbed preparation with minimal fuel/labor energy',
    ],
    challenges: [
      'Dries out faster than silty or clay loams during peak summer/Boro season',
      'Requires steady organic matter replenishment to maintain water-holding capacity',
    ],
    improvementPractices: [
      'Mulching with straw or biomass to conserve critical topsoil moisture',
      'Integrated nutrient management combining biofertilizers (Rhizobium, PSB) with organic amendments',
      'Supplemental irrigation during critical crop stages (pod-filling or flowering)',
    ],
    suitableCropIds: [
      'crop-groundnut',
      'crop-potato',
      'crop-chickpea',
      'crop-mustard',
      'crop-maize',
      'crop-bajra',
    ],
    colorTheme: 'orange',
    icon: '🌱',
    sources: [
      {
        name: 'ICAR - Directorate of Groundnut Research Agronomy Guides',
        url: 'https://dgr.icar.gov.in',
        organization: 'ICAR-DGR, Junagadh',
      },
    ],
  },
  {
    id: 'soil-clay-loam',
    slug: 'clay-loam-soil',
    name: 'Clay Loam Soil',
    shortDescription:
      'A nutrient-dense loam with higher clay content, offering strong moisture endurance for long-duration commercial crops like cotton and sugarcane.',
    textureCharacteristics:
      'Noticeably sticky and plastic when moist, yet breaks into distinct granular aggregates when worked at proper moisture.',
    drainage: 'Moderate',
    waterRetention: 'High',
    nutrientRetention:
      'High retention of macronutrients and trace minerals; minimal loss from leaching under normal rainfall.',
    advantages: [
      'Retains moisture across prolonged dry spells in rainfed agricultural regions',
      'Provides firm plant anchorage for tall, heavy crops such as sugarcane and sorghum',
      'High baseline fertility reduces total synthetic fertilizer requirement',
    ],
    challenges: [
      'Susceptible to clodding if tilled when too dry or smearing if worked too wet',
      'Slow early spring/winter warming can delay germination of delicate seeds',
    ],
    improvementPractices: [
      'Timed tillage strictly at "vapsa" (field capacity moisture) to prevent clod formation',
      'Deep-rooted cover crops (such as pigeon pea or radish) to create biopores through the clay matrix',
      'Application of organic composts and crop residue recycling to enhance soil aggregation',
    ],
    suitableCropIds: [
      'crop-cotton',
      'crop-sugarcane',
      'crop-soybean',
      'crop-wheat',
      'crop-jowar',
    ],
    colorTheme: 'slate',
    icon: '🌿',
    sources: [
      {
        name: 'Central Institute for Cotton Research (CICR) - Soil Guidelines',
        url: 'https://cicr.icar.gov.in',
        organization: 'ICAR-CICR, Nagpur',
      },
    ],
  },
];

export function getSoilById(id: string): SoilRecord | undefined {
  return SOILS_DATA.find((s) => s.id === id);
}

export function getSoilBySlug(slug: string): SoilRecord | undefined {
  return SOILS_DATA.find((s) => s.slug === slug);
}
