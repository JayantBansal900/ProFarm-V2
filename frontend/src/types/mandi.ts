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

export interface MandiPriceQueryParams {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  page?: number;
  limit?: number;
  sort?: 'modal_price_desc' | 'modal_price_asc' | 'arrival_date_desc';
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
  status: 'success';
  commodities: string[];
  states: StateDistrictFilter[];
  dataFreshness: {
    fetchedAt: string;
    cached: boolean;
  };
}

export interface MandiTrendsResponse {
  status: 'success';
  available: boolean;
  message: string;
  reason: string;
  recommendations: string;
}
