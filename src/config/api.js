/**
 * 🛠️ API Environment Configuration (સીધું અહીંથી જ Toggle કરો)
 * 
 * મોડ બદલવા માટે નીચે ENVIRONMENT માં "LOCAL" અથવા "LIVE" લખો:
 * - "LOCAL" -> http://localhost:5000
 * - "LIVE"  -> https://hotelmanagementbackend-dev.up.railway.app
 */

export const ENVIRONMENT = "LOCAL"; // 👉 અહીં "LOCAL" અથવા "LIVE" બદલો

export const LOCAL_API_URL = "http://localhost:5000";
export const LIVE_API_URL = "https://hotelmanagementbackend-dev.up.railway.app";

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

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/v1/auth/refresh-token`,
    ME: `${API_BASE_URL}/api/v1/auth/me`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/v1/auth/change-password`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/v1/auth/forgot-password`,
    VERIFY_OTP: `${API_BASE_URL}/api/v1/auth/verify-otp`,
    RESET_PASSWORD: `${API_BASE_URL}/api/v1/auth/reset-password`,
    LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
  },
  SUPER_ADMIN: {
    DASHBOARD: `${API_BASE_URL}/api/v1/super-admin/dashboard`,
    HOTELS: `${API_BASE_URL}/api/v1/super-admin/hotels`,
    UPDATE_HOTEL: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}`,
    APPROVE_HOTEL: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/approve`,
    REJECT_HOTEL: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/reject`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/status`,
    EXTEND_TRIAL: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/extend-trial`,
    AUDIT_LOGS: `${API_BASE_URL}/api/v1/super-admin/audit-logs`,
    PLANS: `${API_BASE_URL}/api/v1/super-admin/subscription-plans`,
    PLAN_BY_ID: (id) => `${API_BASE_URL}/api/v1/super-admin/subscription-plans/${id}`,
    RESET_DEFAULT_PLANS: `${API_BASE_URL}/api/v1/super-admin/subscription-plans/reset-defaults`,
  },
  SUBSCRIPTION_PLANS: {
    PUBLIC: `${API_BASE_URL}/api/v1/subscription-plans`,
    ADMIN_ALL: `${API_BASE_URL}/api/v1/super-admin/subscription-plans`,
    CREATE: `${API_BASE_URL}/api/v1/super-admin/subscription-plans`,
    UPDATE: (id) => `${API_BASE_URL}/api/v1/super-admin/subscription-plans/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/v1/super-admin/subscription-plans/${id}`,
    RESET_DEFAULTS: `${API_BASE_URL}/api/v1/super-admin/subscription-plans/reset-defaults`,
  },
  HOTELS: {
    ALL: `${API_BASE_URL}/api/v1/super-admin/hotels`,
    UPDATE: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/status`,
    EXTEND_TRIAL: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/extend-trial`,
    APPROVE: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/approve`,
    REJECT: (id) => `${API_BASE_URL}/api/v1/super-admin/hotels/${id}/reject`,
  },
  AUDIT: {
    LOGS: `${API_BASE_URL}/api/v1/super-admin/audit-logs`,
  },
  HOTEL_ADMIN: {
    DASHBOARD: `${API_BASE_URL}/api/v1/admin/dashboard`,
    ROOM_TYPES: `${API_BASE_URL}/api/v1/admin/room-types`,
    UPDATE_ROOM_TYPE: (id) => `${API_BASE_URL}/api/v1/admin/room-types/${id}`,
    DELETE_ROOM_TYPE: (id) => `${API_BASE_URL}/api/v1/admin/room-types/${id}`,
    ROOMS: `${API_BASE_URL}/api/v1/admin/rooms`,
    UPDATE_ROOM: (id) => `${API_BASE_URL}/api/v1/admin/rooms/${id}`,
    DELETE_ROOM: (id) => `${API_BASE_URL}/api/v1/admin/rooms/${id}`,
    UPDATE_ROOM_STATUS: (id) => `${API_BASE_URL}/api/v1/admin/rooms/${id}/status`,
    RECEPTIONISTS: `${API_BASE_URL}/api/v1/admin/receptionists`,
    UPDATE_RECEPTIONIST: (id) => `${API_BASE_URL}/api/v1/admin/receptionists/${id}`,
    DELETE_RECEPTIONIST: (id) => `${API_BASE_URL}/api/v1/admin/receptionists/${id}`,
    UPDATE_RECEPTIONIST_STATUS: (id) => `${API_BASE_URL}/api/v1/admin/receptionists/${id}/status`,
    PAYMENTS: `${API_BASE_URL}/api/v1/admin/payments`,
    RECORD_PAYMENT: `${API_BASE_URL}/api/v1/admin/payments`,
    DAILY_COLLECTIONS: `${API_BASE_URL}/api/v1/admin/daily-collections`,
    SETTLE_HANDOVER: `${API_BASE_URL}/api/v1/admin/daily-collections/handover`,
    PROFILE: `${API_BASE_URL}/api/v1/admin/profile`,
    REPORTS: `${API_BASE_URL}/api/v1/admin/reports`,
  },
  RECEPTIONIST: {
    DASHBOARD: `${API_BASE_URL}/api/v1/receptionist/dashboard`,
    AVAILABLE_ROOMS: `${API_BASE_URL}/api/v1/receptionist/rooms/available`,
    ROOM_TYPES: `${API_BASE_URL}/api/v1/receptionist/room-types`,
    ROOMS: `${API_BASE_URL}/api/v1/receptionist/rooms`,
    CREATE_ROOM: `${API_BASE_URL}/api/v1/receptionist/rooms`,
    UPDATE_ROOM: (id) => `${API_BASE_URL}/api/v1/receptionist/rooms/${id}`,
    DELETE_ROOM: (id) => `${API_BASE_URL}/api/v1/receptionist/rooms/${id}`,
    GUESTS: `${API_BASE_URL}/api/v1/receptionist/guests`,
    GUEST_LOOKUP: (query) => `${API_BASE_URL}/api/v1/receptionist/guests/lookup?query=${encodeURIComponent(query)}`,
    DELETE_GUEST: (id) => `${API_BASE_URL}/api/v1/receptionist/guests/${id}`,
    VERIFY_GUEST_ID: (id) => `${API_BASE_URL}/api/v1/receptionist/guests/${id}/verify-id`,
    BOOKINGS: `${API_BASE_URL}/api/v1/receptionist/bookings`,
    UPDATE_ROOM_STATUS: (id) => `${API_BASE_URL}/api/v1/receptionist/rooms/${id}/status`,
    ADD_CHARGE: (bookingId) => `${API_BASE_URL}/api/v1/receptionist/bookings/${bookingId}/charges`,
    CHECKOUT: (bookingId) => `${API_BASE_URL}/api/v1/receptionist/bookings/${bookingId}/check-out`,
    PAYMENTS: `${API_BASE_URL}/api/v1/receptionist/payments`,
    RECORD_PAYMENT: `${API_BASE_URL}/api/v1/receptionist/payments`,
    DAILY_COLLECTIONS: `${API_BASE_URL}/api/v1/receptionist/daily-collections`,
    SETTLE_HANDOVER: `${API_BASE_URL}/api/v1/receptionist/daily-collections/handover`,
    KYC_OCR_VERIFY: `${API_BASE_URL}/api/v1/receptionist/kyc/ocr-verify`,
    KYC_VERIFY_DL: `${API_BASE_URL}/api/v1/receptionist/kyc/verify-driving-license`,
  },
  SETTINGS: {
    PUBLIC: `${API_BASE_URL}/api/v1/settings`,
  },
  TRIAL_REQUESTS: {
    SUBMIT: `${API_BASE_URL}/api/v1/hotels/request-trial-extension`,
    SUPER_ADMIN_LIST: `${API_BASE_URL}/api/v1/super-admin/trial-requests`,
    APPROVE: (id) => `${API_BASE_URL}/api/v1/super-admin/trial-requests/${id}/approve`,
    REJECT: (id) => `${API_BASE_URL}/api/v1/super-admin/trial-requests/${id}/reject`,
  }
};

/**
 * Reusable helper for Authenticated API Requests with automatic resilient fallback
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {}, token, ...rest } = options;

  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (authToken) {
    reqHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  const config = {
    method,
    headers: reqHeaders,
    credentials: "include", // Automatically send & receive secure httpOnly cookies
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
    // Relative proxy path fallback (Next.js server-side rewrite /api/:path*)
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
      if (response && response.status < 500) break;
      if (response && response.ok) break;
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
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/refresh-token")
    ) {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (storedRefreshToken && !options._retry) {
        try {
          const refreshRes = await fetch(`${currentBase}/api/v1/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && (refreshData.token || refreshData.accessToken)) {
            const newToken = refreshData.token || refreshData.accessToken;
            localStorage.setItem("token", newToken);
            if (refreshData.refreshToken) {
              localStorage.setItem("refreshToken", refreshData.refreshToken);
            }
            // Retry original request seamlessly with new token
            return apiRequest(endpoint, {
              ...options,
              token: newToken,
              _retry: true,
            });
          }
        } catch (refreshErr) {
          console.error("Auto token refresh failed:", refreshErr);
        }
      }

      // Clear expired session and broadcast auth event
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-unauthorized"));
    }

    if (
      response.status === 403 &&
      (data.errorCode === "STAFF_INACTIVE" ||
        data.errorCode === "HOTEL_DISABLED" ||
        data.errorCode === "HOTEL_SUSPENDED" ||
        data.errorCode === "SUBSCRIPTION_EXPIRED" ||
        data.hotelStatus === "DISABLED" ||
        data.hotelStatus === "SUSPENDED" ||
        data.subscriptionStatus === "EXPIRED")
    ) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hotel-status-lockout", {
            detail: {
              errorCode: data.errorCode || "SUBSCRIPTION_EXPIRED",
              message: data.message,
              hotelStatus: data.hotelStatus,
              subscriptionStatus: data.subscriptionStatus,
              supportContact: data.supportContact,
            },
          })
        );
      }
    }

    const error = new Error(data.message || `API Error: ${response.statusText} (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
