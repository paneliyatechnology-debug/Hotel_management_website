/**
 * Central API Configuration for Web Portal
 * All calls use Next.js proxy rewrites (/api/...) to route to backend
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
