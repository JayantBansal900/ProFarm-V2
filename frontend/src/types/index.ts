export interface ApiHealthResponse {
  status: 'ok' | 'error';
  service: string;
}

export interface DatabaseHealthResponse extends ApiHealthResponse {
  database: 'connected' | 'disconnected';
  latencyMs?: number;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
