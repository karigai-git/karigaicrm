import axios from 'axios';
// Default API base URL - use the URL where the frontend is running by default
const DEFAULT_API_BASE = window.location.origin;
// Cache for the API base URL
let apiBaseUrl = null;
/**
 * Discovers the API server port by:
 * 1. Trying to read from port-info.json if in development
 * 2. Trying direct access to the /email-api endpoint
 * 3. Using the current window origin with email-api path
 */
export const discoverApiServer = async () => {
    // If we already discovered the URL, return it
    if (apiBaseUrl) {
        return apiBaseUrl;
    }
    // Production environment will have these configurations predefined
    if (import.meta.env.VITE_API_URL) {
        apiBaseUrl = import.meta.env.VITE_API_URL;
        return apiBaseUrl;
    }
    // In production, just use the same domain with /email-api path
    // This works with the proxied setup in Vite
    console.log('Using current domain for API endpoint:', window.location.origin);
    apiBaseUrl = window.location.origin;
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
export const apiCall = async (method, endpoint, data) => {
    const apiClient = await createApiClient();
    try {
        const response = await apiClient({
            method,
            url: endpoint,
            data,
        });
        return response.data;
    }
    catch (error) {
        console.error(`API call failed: ${method} ${endpoint}`, error);
        throw error;
    }
};
// Convenience methods for common request types
export const api = {
    get: (endpoint) => apiCall('get', endpoint),
    post: (endpoint, data) => apiCall('post', endpoint, data),
    put: (endpoint, data) => apiCall('put', endpoint, data),
    delete: (endpoint) => apiCall('delete', endpoint),
};
export default api;
