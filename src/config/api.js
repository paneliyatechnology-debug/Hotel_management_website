/**
 * Central API Configuration with Dynamic Local vs. Live Environment Switch
 * 
 * Set in .env.local:
 *   NEXT_PUBLIC_API_MODE="LOCAL" (or "LIVE")
 *   NEXT_PUBLIC_LOCAL_API_URL="http://localhost:5000"
 *   NEXT_PUBLIC_LIVE_API_URL="https://api.yourlivehoteldomain.com"
 */

export const LOCAL_API_URL = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:5000";
export const LIVE_API_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || "https://hotel-management-backend-9qf5.onrender.com";

// Mode: "LOCAL" | "LIVE" (Defaults to "LIVE" if live URL is provided and in production, otherwise "LOCAL")
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE || (LIVE_API_URL && process.env.NODE_ENV === "production" ? "LIVE" : "LOCAL");

export const API_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (API_MODE === "LIVE" && LIVE_API_URL) {
    return LIVE_API_URL.replace(/\/+$/, "");
  }
  return LOCAL_API_URL.replace(/\/+$/, "");
})();

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

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `API Error: ${response.statusText} (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}
