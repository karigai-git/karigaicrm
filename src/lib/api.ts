import axios from 'axios';

// Default API base URL
const DEFAULT_API_BASE = 'http://localhost:3001';

// Cache for the API base URL
let apiBaseUrl: string | null = null;

/**
 * Discovers the API server port by:
 * 1. Trying to read from port-info.json if in development
 * 2. Trying common ports in sequence if needed
 * 3. Falling back to the default port as a last resort
 */
export const discoverApiServer = async (): Promise<string> => {
  // If we already discovered the URL, return it
  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  // Production environment will have these configurations predefined
  if (import.meta.env.VITE_API_URL) {
    apiBaseUrl = import.meta.env.VITE_API_URL;
    return apiBaseUrl;
  }

  // List of potential ports to try
  const potentialPorts = [3001, 3002, 3003, 3004, 4001, 4002, 4003];
  
  // First, try to fetch port-info.json
  try {
    const portInfoResponse = await fetch('/port-info.json');
    if (portInfoResponse.ok) {
      const { port } = await portInfoResponse.json();
      apiBaseUrl = `http://localhost:${port}`;
      console.log(`Discovered API server at ${apiBaseUrl} from port-info.json`);
      return apiBaseUrl;
    }
  } catch (err) {
    console.log('Could not read port-info.json, trying direct connection...');
  }
  
  // If port-info.json is not available, try each port directly
  for (const port of potentialPorts) {
    const url = `http://localhost:${port}`;
    try {
      const response = await fetch(`${url}/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(500) // 500ms timeout for quick checking
      });
      
      if (response.ok) {
        apiBaseUrl = url;
        console.log(`Discovered API server at ${apiBaseUrl} by connection test`);
        return apiBaseUrl;
      }
    } catch (err) {
      // This port didn't work, try the next one
    }
  }
  
  // If all else fails, return the default
  console.warn('Could not discover API server, using default port');
  apiBaseUrl = DEFAULT_API_BASE;
  return apiBaseUrl;
};

/**
 * Creates an axios instance configured to use the discovered API server
 */
export const createApiClient = async () => {
  const baseURL = await discoverApiServer();
  
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Utility to make API calls with automatic server discovery
 */
export const apiCall = async (method: string, endpoint: string, data?: any) => {
  const apiClient = await createApiClient();
  
  try {
    const response = await apiClient({
      method,
      url: endpoint,
      data,
    });
    
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// Convenience methods for common request types
export const api = {
  get: (endpoint: string) => apiCall('get', endpoint),
  post: (endpoint: string, data: any) => apiCall('post', endpoint, data),
  put: (endpoint: string, data: any) => apiCall('put', endpoint, data),
  delete: (endpoint: string) => apiCall('delete', endpoint),
};

export default api; 