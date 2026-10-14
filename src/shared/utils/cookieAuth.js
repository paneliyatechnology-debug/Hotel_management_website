/**
 * 🍪 Client-side Cookie & Auth Persistence Utilities
 * Manages accessToken, refreshToken, hotel_id, and user profile in browser cookies
 */

export function setCookie(name, value, days = 7) {
  if (typeof document === "undefined") return;
  try {
    let serialized;
    if (typeof value === "object" && value !== null) {
      try {
        const seen = new WeakSet();
        serialized = JSON.stringify(value, (k, v) => {
          if (typeof v === "object" && v !== null) {
            if (seen.has(v)) return undefined;
            seen.add(v);
          }
          return v;
        });
      } catch {
        serialized = "{}";
      }
    } else {
      serialized = String(value);
    }
    const valStr = encodeURIComponent(serialized);
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `${name}=${valStr};expires=${expires.toUTCString()};path=/;SameSite=Lax${isSecure ? ";Secure" : ""}`;
  } catch (err) {
    console.error(`Error setting cookie "${name}":`, err);
  }
}

export function getCookie(name) {
  if (typeof document === "undefined" || !document.cookie) return null;
  try {
    const parts = document.cookie.split(";");
    for (let part of parts) {
      const [k, ...v] = part.trim().split("=");
      if (k === name) {
        const rawVal = decodeURIComponent(v.join("="));
        if (rawVal.startsWith("{") || rawVal.startsWith("[")) {
          try {
            return JSON.parse(rawVal);
          } catch {
            return rawVal;
          }
        }
        return rawVal;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function removeCookie(name) {
  if (typeof document === "undefined") return;
  try {
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax${isSecure ? ";Secure" : ""}`;
    document.cookie = `${name}=;max-age=0;path=/;SameSite=Lax${isSecure ? ";Secure" : ""}`;
  } catch (err) {
    console.error(`Error removing cookie "${name}":`, err);
  }
}

/**
 * Stores full login response payload into cookies (accessToken, refreshToken, user, hotel_id)
 */
export function setAuthCookies({ accessToken, refreshToken, user, token } = {}) {
  const finalToken = accessToken || token;
  if (finalToken) {
    setCookie("accessToken", finalToken, 7);
    setCookie("token", finalToken, 7);
  }
  if (refreshToken) {
    setCookie("refreshToken", refreshToken, 30);
  }
  if (user) {
    setCookie("user", user, 7);
    const hid = user.hotel_id || user.hotelId || user.hotel?.id;
    if (hid) {
      setCookie("hotel_id", hid, 7);
      setCookie("hotelId", hid, 7);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("hotel_id", String(hid));
          localStorage.setItem("hotelId", String(hid));
        } catch {}
      }
    }
  }
}

/**
 * Clears all authentication cookies upon logout
 */
export function clearAuthCookies() {
  removeCookie("accessToken");
  removeCookie("token");
  removeCookie("refreshToken");
  removeCookie("user");
  removeCookie("hotel_id");
  removeCookie("hotelId");
}

/**
 * Resolves active hotel ID from cookies, user object, or localStorage
 */
export function getActiveHotelId() {
  if (typeof document !== "undefined") {
    const cookieHid = getCookie("hotel_id") || getCookie("hotelId");
    if (cookieHid) return Number(cookieHid);

    const cookieUser = getCookie("user");
    if (cookieUser && typeof cookieUser === "object") {
      const hid = cookieUser.hotel_id || cookieUser.hotelId || cookieUser.hotel?.id;
      if (hid) return Number(hid);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const lsHid = localStorage.getItem("hotel_id") || localStorage.getItem("hotelId");
      if (lsHid) return Number(lsHid);

      const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
      const hid = lsUser.hotel_id || lsUser.hotelId || lsUser.hotel?.id;
      if (hid) return Number(hid);
    } catch {}
  }

  return null;
}

/**
 * Retrieves stored authentication credentials from cookies
 */
export function getAuthCookies() {
  return {
    accessToken: getCookie("accessToken") || getCookie("token"),
    token: getCookie("token") || getCookie("accessToken"),
    refreshToken: getCookie("refreshToken"),
    user: getCookie("user"),
    hotel_id: getActiveHotelId(),
  };
}
