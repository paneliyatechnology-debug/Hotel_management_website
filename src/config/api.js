/**
 * 🛠️ API Environment Configuration (સીધું અહીંથી જ Toggle કરો)
 * 
 * મોડ બદલવા માટે નીચે ENVIRONMENT માં "LOCAL" અથવા "LIVE" લખો:
 * - "LOCAL" -> http://localhost:5000
 * - "LIVE"  -> https://hotel-management-backend-9qf5.onrender.com
 */

export const ENVIRONMENT = "LIVE"; // 👉 અહીં "LOCAL" અથવા "LIVE" બદલો

export const LOCAL_API_URL = "http://localhost:5000";
export const LIVE_API_URL = "https://hotelmanagementbackend-dev.up.railway.app";

// Active API Base URL
export const API_BASE_URL = ENVIRONMENT === "LIVE" ? LIVE_API_URL : LOCAL_API_URL;


export const API_ENDPOINTS = {
  HOTELS: {
    REGISTER: `${API_BASE_URL}/api/v1/hotels/register`,
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    ME: `${API_BASE_URL}/api/v1/auth/me`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/v1/auth/change-password`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/v1/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/v1/auth/reset-password`,
  },
  PUBLIC: {
    CONTACT: `${API_BASE_URL}/api/v1/contact`,
  },
  SUBSCRIPTION_PLANS: {
    PUBLIC: `${API_BASE_URL}/api/v1/subscription-plans`,
  },
};

/**
 * Reusable helper to make proxied API requests
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {}, ...rest } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  };

  if (body) {
    config.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  // Ensure full URL is formed correctly with API_BASE_URL
  const fullUrl = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${API_BASE_URL ? API_BASE_URL.replace(/\/+$/, "") : ""}/${endpoint.replace(/^\/+/, "")}`;

  const response = await fetch(fullUrl, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `API Error: ${response.statusText} (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}
