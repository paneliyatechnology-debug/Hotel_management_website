/**
 * 🛠️ API Environment Configuration (સીધું અહીંથી જ Toggle કરો)
 * 
 * મોડ બદલવા માટે નીચે ENVIRONMENT માં "LOCAL" અથવા "LIVE" લખો:
 * - "LOCAL" -> http://localhost:5000
 * - "LIVE"  -> https://hotel-management-backend-9qf5.onrender.com
 */

export const ENVIRONMENT = "LIVE"; // 👉 અહીં "LOCAL" અથવા "LIVE" બદલો

export const LOCAL_API_URL = "http://localhost:5000";
export const LIVE_API_URL = "https://hotel-management-backend-9qf5.onrender.com";

export const LOCAL_ADMIN_URL = "http://localhost:3001";
export const LIVE_ADMIN_URL = "https://hotel-management-admin-livid.vercel.app";

// Active API Base URL (Case-insensitive check for LOCAL / LIVE)
export const getApiBaseUrl = () => {
  // 1. Direct ENVIRONMENT in this file has primary priority when set
  const manualEnv = (typeof ENVIRONMENT !== "undefined" && ENVIRONMENT ? ENVIRONMENT : "").trim().toUpperCase();

  // 2. Next.js env variable
  const processEnv = (
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_MODE
      ? process.env.NEXT_PUBLIC_API_MODE
      : ""
  ).trim().toUpperCase();

  const envMode = manualEnv || processEnv || "LOCAL";

  if (typeof window !== "undefined") {
    // If set to LOCAL in code, remove stale LIVE override from localStorage
    if (manualEnv === "LOCAL" && localStorage.getItem("API_ENVIRONMENT") === "LIVE") {
      localStorage.removeItem("API_ENVIRONMENT");
    }
    const override = localStorage.getItem("API_ENVIRONMENT");
    if (override === "LIVE" && envMode === "LIVE") return LIVE_API_URL;
    if (override === "LOCAL" && envMode === "LOCAL") return LOCAL_API_URL;
  }

  if (envMode === "LIVE") {
    return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LIVE_API_URL) || LIVE_API_URL;
  }

  return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOCAL_API_URL) || LOCAL_API_URL;
};

// Active Admin Portal URL (LOCAL vs LIVE)
export const getAdminUrl = () => {
  const manualEnv = (typeof ENVIRONMENT !== "undefined" && ENVIRONMENT ? ENVIRONMENT : "").trim().toUpperCase();
  const processEnv = (
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_MODE
      ? process.env.NEXT_PUBLIC_API_MODE
      : ""
  ).trim().toUpperCase();

  const envMode = manualEnv || processEnv || "LOCAL";

  if (envMode === "LIVE") {
    return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_URL) || LIVE_ADMIN_URL;
  }

  return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOCAL_ADMIN_URL) || LOCAL_ADMIN_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const ADMIN_PORTAL_URL = getAdminUrl();

export const API_ENDPOINTS = {
  HOTELS: {
    get REGISTER() { return `${getApiBaseUrl()}/api/v1/hotels/register`; },
  },
  AUTH: {
    get LOGIN() { return `${getApiBaseUrl()}/api/v1/auth/login`; },
    get ME() { return `${getApiBaseUrl()}/api/v1/auth/me`; },
    get CHANGE_PASSWORD() { return `${getApiBaseUrl()}/api/v1/auth/change-password`; },
    get FORGOT_PASSWORD() { return `${getApiBaseUrl()}/api/v1/auth/forgot-password`; },
    get VERIFY_OTP() { return `${getApiBaseUrl()}/api/v1/auth/verify-otp`; },
    get RESET_PASSWORD() { return `${getApiBaseUrl()}/api/v1/auth/reset-password`; },
  },
  PUBLIC: {
    get CONTACT() { return `${getApiBaseUrl()}/api/v1/contact`; },
  },
  SUBSCRIPTION_PLANS: {
    get PUBLIC() { return `${getApiBaseUrl()}/api/v1/subscription-plans`; },
  },
  SETTINGS: {
    get PUBLIC() { return `${getApiBaseUrl()}/api/v1/settings`; },
  },
};

/**
 * Reusable helper to make proxied API requests with automatic resilient fallback
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {}, ...rest } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Send & receive secure httpOnly cookies
    ...rest,
  };

  if (body) {
    config.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const currentBase = getApiBaseUrl().replace(/\/+$/, "");
  let fullUrl;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    if (
      endpoint.startsWith("http://localhost:5000") ||
      endpoint.startsWith("http://127.0.0.1:5000") ||
      endpoint.startsWith("https://hotelmanagementbackend-dev.up.railway.app") ||
      endpoint.startsWith("https://hotel-management-backend-9qf5.onrender.com")
    ) {
      fullUrl = endpoint.replace(
        /^(http:\/\/localhost:5000|http:\/\/127\.0\.0\.1:5000|https:\/\/hotelmanagementbackend-dev\.up\.railway\.app|https:\/\/hotel-management-backend-9qf5\.onrender\.com)/,
        currentBase
      );
    } else {
      fullUrl = endpoint;
    }
  } else {
    fullUrl = `${currentBase}/${endpoint.replace(/^\/+/, "")}`;
  }

  // Generate fallback candidates in case fetch fails
  const candidateUrls = [fullUrl];
  if (fullUrl.includes("localhost:5000")) {
    candidateUrls.push(fullUrl.replace("localhost:5000", "127.0.0.1:5000"));
  } else if (fullUrl.includes("127.0.0.1:5000")) {
    candidateUrls.push(fullUrl.replace("127.0.0.1:5000", "localhost:5000"));
  }
  if (typeof window !== "undefined") {
    const urlObj = new URL(fullUrl, window.location.origin);
    const relativePath = urlObj.pathname + urlObj.search;
    if (relativePath.startsWith("/api/")) {
      candidateUrls.push(relativePath);
    }
  }

  let response;
  let lastError;

  for (const targetUrl of candidateUrls) {
    try {
      response = await fetch(targetUrl, config);
      if (response) break;
    } catch (netErr) {
      lastError = netErr;
      console.warn(`[API Network Warning] Attempt to reach ${targetUrl} failed, trying next candidate...`);
    }
  }

  if (!response) {
    console.error(`[API Network Error] All candidates failed for ${fullUrl}:`, lastError);
    throw new Error(
      `Network request failed to reach the server. Please check if the backend server is running.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `API Error: ${response.statusText} (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}
