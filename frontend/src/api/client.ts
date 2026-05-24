const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  app: string;
  environment: string;
  database: string;
}

/**
 * Fetch backend health parameters.
 * Validates connectivity with backend services.
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!response.ok) {
    throw new Error(`API health check failed with status: ${response.status}`);
  }
  return response.json();
}
