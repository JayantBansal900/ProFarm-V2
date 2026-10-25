import { env } from '../config/env';
import { MemoryCache } from '../lib/memoryCache';
import { AppError } from '../middleware/errorHandler';

export interface MandiRecord {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrivalDate: string; // "DD/MM/YYYY"
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number;
  priceUnit: string; // "₹ / quintal"
}

export interface MandiPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface MandiPriceResponse {
  status: 'success';
  records: MandiRecord[];
  pagination: MandiPagination;
  filters: {
    commodity: string | null;
    state: string | null;
    district: string | null;
    market: string | null;
  };
  sorting: string;
  attribution: {
    source: string;
    datasetTitle: string;
    resourceId: string;
    url: string;
    disclaimer: string;
  };
  dataFreshness: {
    fetchedAt: string;
    cached: boolean;
  };
}

export interface StateDistrictFilter {
  state: string;
  districts: string[];
}

export interface MandiFilterOptions {
  commodities: string[];
  states: StateDistrictFilter[];
  dataFreshness: {
    fetchedAt: string;
    cached: boolean;
  };
}

// ---------------------------------------------------------------------------
// In-Memory Caches
// ---------------------------------------------------------------------------

const PRICE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const FILTER_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const priceCache = new MemoryCache<MandiPriceResponse>(500);
const filterCache = new MemoryCache<MandiFilterOptions>(20);

export const mandiCacheManager = {
  priceCache,
  filterCache,
  clearAll: () => {
    priceCache.clear();
    filterCache.clear();
  },
};

// ---------------------------------------------------------------------------
// Upstream API Details
// ---------------------------------------------------------------------------

export const MANDI_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const MANDI_API_BASE_URL = `https://api.data.gov.in/resource/${MANDI_RESOURCE_ID}`;
const REQUEST_TIMEOUT_MS = 9000;

function createApiError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Curated comprehensive agricultural commodities and states for instant high-quality filtering
export const POPULAR_COMMODITIES = [
  'Apple',
  'Bajra(Pearl Millet/Cumbu)',
  'Banana',
  'Barley (Jau)',
  'Beans',
  'Bhindi(Ladies Finger)',
  'Bitter gourd',
  'Bottle gourd',
  'Brinjal',
  'Cabbage',
  'Carrot',
  'Cauliflower',
  'Chana(Gram)(Whole)',
  'Chilli Red',
  'Coconut',
  'Coriander(Leaves)',
  'Cotton',
  'Cucumbar(Cucumber)',
  'Garlic',
  'Ginger(Green)',
  'Green Chilli',
  'Green Gram (Moong)(Whole)',
  'Groundnut',
  'Jowar(Sorghum)',
  'Maize',
  'Mango',
  'Mustard',
  'Onion',
  'Paddy(Common)',
  'Paddy(Dhan)(Basmati)',
  'Papaya',
  'Peas Wet',
  'Pomegranate',
  'Potato',
  'Ragi (Finger Millet)',
  'Rice',
  'Soyabean',
  'Spinach',
  'Sugarcane',
  'Sunflower',
  'Tomato',
  'Turmeric',
  'Water Melon',
  'Wheat',
].sort();

export const STATE_DISTRICT_MAP: Record<string, string[]> = {
  'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
  'Bihar': ['Araria', 'Bhagalpur', 'Gaya', 'Muzaffarpur', 'Nalanda', 'Patna', 'Purnia', 'Rohtas', 'Samastipur', 'Saran'],
  'Gujarat': ['Ahmedabad', 'Amreli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Junagadh', 'Kutch', 'Mehsana', 'Rajkot', 'Surat', 'Surendranagar', 'Vadodara'],
  'Haryana': ['Ambala', 'Bhiwani', 'Fatehabad', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Panipat', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
  'Himachal Pradesh': ['Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kullu', 'Mandi', 'Shimla', 'Solan', 'Una'],
  'Karnataka': ['Bagalkot', 'Belagavi', 'Ballari', 'Bidar', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Mandya', 'Mysuru', 'Raichur', 'Shivamogga', 'Tumakuru'],
  'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Thrissur', 'Wayanad'],
  'Madhya Pradesh': ['Betul', 'Bhopal', 'Chhindwara', 'Dewas', 'Dhar', 'Gwalior', 'Hoshangabad', 'Indore', 'Jabalpur', 'Khandwa', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Raisen', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Sidhi', 'Ujjain', 'Vidisha'],
  'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Buldhana', 'Chandrapur', 'Dhule', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Nagpur', 'Nanded', 'Nashik', 'Osmanabad', 'Parbhani', 'Pune', 'Sangli', 'Satara', 'Solapur', 'Wardha', 'Yavatmal'],
  'Odisha': ['Balasore', 'Bargarh', 'Bhadrak', 'Cuttack', 'Ganjam', 'Kalahandi', 'Koraput', 'Puri', 'Sambalpur'],
  'Punjab': ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Muktsar', 'Patiala', 'Rupnagar', 'Sangrur', 'Tarn Taran'],
  'Rajasthan': ['Ajmer', 'Alwar', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Chittorgarh', 'Ganganagar', 'Hanumangarh', 'Jaipur', 'Jalore', 'Jodhpur', 'Kota', 'Nagaur', 'Pali', 'Sikar', 'Tonk', 'Udaipur'],
  'Tamil Nadu': ['Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Madurai', 'Namakkal', 'Salem', 'Thanjavur', 'Theni', 'Tiruchirappalli', 'Tirunelveli', 'Tirupur', 'Vellore', 'Villupuram'],
  'Telangana': ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahabubnagar', 'Medak', 'Nalgonda', 'Nizamabad', 'Rangareddy', 'Warangal'],
  'Uttar Pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Azamgarh', 'Bareilly', 'Basti', 'Bulandshahr', 'Etawah', 'Faizabad', 'Farrukhabad', 'Fatehpur', 'Ghaziabad', 'Gorakhpur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kanpur', 'Lakhimpur', 'Lucknow', 'Mathura', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pratapgarh', 'Rae Bareli', 'Saharanpur', 'Shahjahanpur', 'Sitapur', 'Unnao', 'Varanasi'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar'],
  'West Bengal': ['Bankura', 'Birbhum', 'Burdwan', 'Coochbehar', 'Hooghly', 'Jalpaiguri', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'South 24 Parganas'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parsePrice(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '').trim());
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

export function parseArrivalDateIso(dateStr: string): string {
  // Format is typically DD/MM/YYYY
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// Map common user search terms to official AGMARKNET commodity names if possible
export function normalizeCommodityQuery(query: string): string {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  const exactMatch = POPULAR_COMMODITIES.find((c) => c.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  if (lower === 'wheat') return 'Wheat';
  if (lower === 'paddy' || lower === 'rice') return 'Paddy(Common)';
  if (lower === 'cotton') return 'Cotton';
  if (lower === 'mustard') return 'Mustard';
  if (lower === 'maize' || lower === 'corn') return 'Maize';
  if (lower === 'potato') return 'Potato';
  if (lower === 'onion') return 'Onion';
  if (lower === 'tomato') return 'Tomato';
  if (lower === 'groundnut' || lower === 'peanut') return 'Groundnut';
  if (lower === 'soybean' || lower === 'soya') return 'Soyabean';

  return trimmed;
}

// ---------------------------------------------------------------------------
// Fetch Upstream Mandi Data
// ---------------------------------------------------------------------------

interface RawRecord {
  state?: string;
  State?: string;
  district?: string;
  District?: string;
  market?: string;
  Market?: string;
  commodity?: string;
  Commodity?: string;
  variety?: string;
  Variety?: string;
  grade?: string;
  Grade?: string;
  arrival_date?: string;
  Arrival_Date?: string;
  min_price?: unknown;
  Min_x0020_Price?: unknown;
  max_price?: unknown;
  Max_x0020_Price?: unknown;
  modal_price?: unknown;
  Modal_x0020_Price?: unknown;
}

interface RawApiResponse {
  status?: string;
  total?: number;
  count?: number;
  records?: RawRecord[];
  message?: string;
}

export async function fetchUpstreamMandiData(params: {
  limit: number;
  offset: number;
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
}): Promise<RawApiResponse> {
  const apiKey = env.DATA_GOV_IN_API_KEY ? env.DATA_GOV_IN_API_KEY.trim() : '';
  if (!apiKey) {
    throw createApiError(
      'Mandi price service is temporarily unavailable: API key not configured on backend',
      503
    );
  }

  const queryParts = [
    `api-key=${encodeURIComponent(apiKey)}`,
    'format=json',
    `limit=${params.limit}`,
    `offset=${params.offset}`,
  ];

  if (params.commodity) {
    queryParts.push(`filters[commodity]=${encodeURIComponent(params.commodity)}`);
  }
  if (params.state) {
    queryParts.push(`filters[state]=${encodeURIComponent(params.state)}`);
  }
  if (params.district) {
    queryParts.push(`filters[district]=${encodeURIComponent(params.district)}`);
  }
  if (params.market) {
    queryParts.push(`filters[market]=${encodeURIComponent(params.market)}`);
  }

  const url = `${MANDI_API_BASE_URL}?${queryParts.join('&')}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ProFarm-Agricultural-Platform/2.0 (Mozilla/5.0 compatible)',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw createApiError('Government Mandi data service rejected authentication', 502);
    }
    if (response.status === 429) {
      throw createApiError('Government Mandi data rate limit exceeded. Please wait a moment.', 429);
    }
    if (response.status >= 500) {
      throw createApiError('Government Mandi data service temporarily unavailable', 502);
    }
    if (!response.ok) {
      throw createApiError(`Government Mandi data service responded with HTTP ${response.status}`, 502);
    }

    const data = (await response.json()) as RawApiResponse;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      throw createApiError('Government Mandi data service timed out', 504);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Mandi Prices Service
// ---------------------------------------------------------------------------

export async function getMandiPrices(query: {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  page?: number;
  limit?: number;
  sort?: 'modal_price_desc' | 'modal_price_asc' | 'arrival_date_desc';
}): Promise<MandiPriceResponse> {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;
  const offset = (page - 1) * limit;
  const sort = query.sort || 'modal_price_desc';

  const normalizedCommodity = query.commodity ? normalizeCommodityQuery(query.commodity) : undefined;
  const state = query.state ? query.state.trim() : undefined;
  const district = query.district ? query.district.trim() : undefined;
  const market = query.market ? query.market.trim() : undefined;

  const cacheKey = JSON.stringify({
    commodity: normalizedCommodity?.toLowerCase() || '',
    state: state?.toLowerCase() || '',
    district: district?.toLowerCase() || '',
    market: market?.toLowerCase() || '',
    page,
    limit,
    sort,
  });

  const cached = priceCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      dataFreshness: {
        ...cached.dataFreshness,
        cached: true,
      },
    };
  }

  const rawData = await fetchUpstreamMandiData({
    limit,
    offset,
    commodity: normalizedCommodity,
    state,
    district,
    market,
  });

  const rawRecords = rawData.records || [];
  const totalRecords = typeof rawData.total === 'number' ? rawData.total : rawRecords.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const normalizedRecords: MandiRecord[] = [];

  for (const r of rawRecords) {
    const rawModal = r.modal_price ?? r.Modal_x0020_Price;
    const modalPrice = parsePrice(rawModal);
    if (modalPrice === null) continue; // Reject records without valid modal prices

    const stateStr = (r.state ?? r.State ?? '').trim() || 'Unknown State';
    const districtStr = (r.district ?? r.District ?? '').trim() || 'Unknown District';
    const marketStr = (r.market ?? r.Market ?? '').trim() || 'Unknown Mandi';
    const commodityStr = (r.commodity ?? r.Commodity ?? '').trim() || (normalizedCommodity || 'Unknown Commodity');
    const varietyStr = (r.variety ?? r.Variety ?? '').trim() || 'Other';
    const gradeStr = (r.grade ?? r.Grade ?? '').trim() || 'FAQ';
    const arrivalDateStr = (r.arrival_date ?? r.Arrival_Date ?? '').trim() || new Date().toISOString().split('T')[0];

    const rawMin = r.min_price ?? r.Min_x0020_Price;
    const rawMax = r.max_price ?? r.Max_x0020_Price;

    const minPrice = parsePrice(rawMin);
    const maxPrice = parsePrice(rawMax);

    const id = `${slugify(stateStr)}-${slugify(districtStr)}-${slugify(marketStr)}-${slugify(commodityStr)}-${slugify(varietyStr)}-${slugify(arrivalDateStr)}`;

    normalizedRecords.push({
      id,
      state: stateStr,
      district: districtStr,
      market: marketStr,
      commodity: commodityStr,
      variety: varietyStr,
      grade: gradeStr,
      arrivalDate: arrivalDateStr,
      minPrice,
      maxPrice,
      modalPrice,
      priceUnit: '₹ / quintal',
    });
  }

  // Sort records
  if (sort === 'modal_price_asc') {
    normalizedRecords.sort((a, b) => a.modalPrice - b.modalPrice);
  } else if (sort === 'modal_price_desc') {
    normalizedRecords.sort((a, b) => b.modalPrice - a.modalPrice);
  } else if (sort === 'arrival_date_desc') {
    normalizedRecords.sort((a, b) => {
      const da = parseArrivalDateIso(a.arrivalDate);
      const db = parseArrivalDateIso(b.arrivalDate);
      return db.localeCompare(da);
    });
  }

  const response: MandiPriceResponse = {
    status: 'success',
    records: normalizedRecords,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },
    filters: {
      commodity: normalizedCommodity || null,
      state: state || null,
      district: district || null,
      market: market || null,
    },
    sorting: sort,
    attribution: {
      source: 'Government of India — data.gov.in / AGMARKNET',
      datasetTitle: 'Current Daily Price of Various Commodities from Various Markets (Mandi)',
      resourceId: MANDI_RESOURCE_ID,
      url: 'https://data.gov.in/resource/variety-wise-daily-market-prices-data-commodity',
      disclaimer: 'Prices are reported wholesale market observations and may vary by commodity quality, variety, market, and reporting date.',
    },
    dataFreshness: {
      fetchedAt: new Date().toISOString(),
      cached: false,
    },
  };

  priceCache.set(cacheKey, response, PRICE_CACHE_TTL_MS);
  return response;
}

// ---------------------------------------------------------------------------
// Mandi Filter Discovery Service
// ---------------------------------------------------------------------------

export async function getMandiFilters(stateFilter?: string): Promise<MandiFilterOptions> {
  const cacheKey = `filters-${stateFilter ? stateFilter.toLowerCase() : 'all'}`;
  const cached = filterCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      dataFreshness: {
        ...cached.dataFreshness,
        cached: true,
      },
    };
  }

  const statesList: StateDistrictFilter[] = [];

  for (const [stateName, districts] of Object.entries(STATE_DISTRICT_MAP)) {
    if (!stateFilter || stateName.toLowerCase() === stateFilter.toLowerCase()) {
      statesList.push({
        state: stateName,
        districts: [...districts].sort(),
      });
    }
  }

  const response: MandiFilterOptions = {
    commodities: POPULAR_COMMODITIES,
    states: statesList.sort((a, b) => a.state.localeCompare(b.state)),
    dataFreshness: {
      fetchedAt: new Date().toISOString(),
      cached: false,
    },
  };

  filterCache.set(cacheKey, response, FILTER_CACHE_TTL_MS);
  return response;
}
