import { ApiResponse } from './types';

// In-flight request deduplication
const inFlightRequests = new Map<string, Promise<unknown>>();

export async function apiFetch<T>(url: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
  // Prevent API calls when offline (client-side only)
  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('Offline: No internet connection');
  }

  // Only deduplicate GET requests
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const requestKey = `${options.method || 'GET'}:${url}`;

  if (isGet && inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      return await apiFetchInternal<T>(url, options, retries);
    } finally {
      if (isGet) inFlightRequests.delete(requestKey);
    }
  })();

  if (isGet) inFlightRequests.set(requestKey, fetchPromise);
  return fetchPromise;
}

async function apiFetchInternal<T>(url: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
  // All API requests should be versioned. If it doesn't start with /api/v1/, we prepend it.
  const versionedUrl = url.startsWith('/api/v1/')
    ? url
    : url.startsWith('/')
      ? url.replace('/api/', '/api/v1/')
      : `/api/v1/${url}`;

  const makeRequest = async (signal?: AbortSignal): Promise<Response> => {
    return fetch(versionedUrl, {
      ...options,
      signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
    });
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await makeRequest(options.signal || undefined);
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'API request failed');
      }

      // Handle standardized response format { success, data, error }
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        const standardRes = responseData as ApiResponse<T>;
        if (!standardRes.success) {
          throw new Error(standardRes.error || 'Operation failed');
        }
        return standardRes.data as T;
      }

      // Fallback for non-standardized responses
      return responseData as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Retry on network errors or 5xx status codes
      const isRetryable = 
        lastError.message.includes('fetch') ||
        lastError.message.includes('Network') ||
        lastError.message.includes('500') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('504');
      
      if (attempt === retries - 1 || !isRetryable) {
        throw lastError;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw lastError || new Error('API request failed after retries');
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
  checkHealth: async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('/api/v1/system?action=maintenance', {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
};
