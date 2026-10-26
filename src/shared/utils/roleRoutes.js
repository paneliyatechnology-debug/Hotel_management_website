/**
 * ====================================================================
 * ROLE ROUTES - single source of truth for dashboard URLs
 * ====================================================================
 * Every signed-in role has one base path and an ordered list of pages.
 * The order MUST match the sidebar order (see the *_NAV arrays in each
 * role's layout), because a page's position is the tab index that the
 * dashboards render.
 *
 *   SUPER_ADMIN  -> /super-admin/<page>
 *   HOTEL_ADMIN  -> /admin/<page>
 *   RECEPTIONIST -> /receptionist/<page>
 *
 * This file is pure (no React / browser APIs) so it can also be used by
 * server components (e.g. generateStaticParams).
 */

export const ROLE_BASE_PATH = {
  SUPER_ADMIN: "/super-admin",
  HOTEL_ADMIN: "/admin",
  RECEPTIONIST: "/receptionist",
};

export const ROLE_NAV_PATHS = {
  SUPER_ADMIN: ["overview", "hotels", "plans", "settings"],
  HOTEL_ADMIN: ["overview", "guests", "staff", "rooms", "gst-report", "subscriptions", "settings"],
  RECEPTIONIST: ["dashboard", "rooms", "guests", "more"],
};

// Older / alternative URL names that still resolve to a real page of that role
export const ROLE_PAGE_ALIASES = {
  SUPER_ADMIN: {
    dashboard: "overview",
    hotel: "hotels",
    subscriptions: "plans",
    "subscription-plans": "plans",
  },
  HOTEL_ADMIN: {
    dashboard: "overview",
    collections: "overview",
    "daily-collections": "overview",
    payments: "overview",
    billing: "overview",
    guest: "guests",
    directory: "guests",
    team: "staff",
    gst: "gst-report",
    reports: "gst-report",
    plans: "subscriptions",
    pricing: "subscriptions",
    "room-types": "rooms",
    "room-categories": "rooms",
  },
  RECEPTIONIST: {
    overview: "dashboard",
    folios: "dashboard",
    "in-house": "dashboard",
    inhouse: "dashboard",
    checkin: "rooms",
    "check-in": "rooms",
    booking: "rooms",
    "room-types": "rooms",
    "room-categories": "rooms",
    guest: "guests",
    directory: "guests",
    settings: "more",
    operations: "more",
  },
};

// First URL segments that belong to the signed-in app ("app" is the legacy shared prefix)
const APP_SEGMENTS = [...Object.values(ROLE_BASE_PATH).map((p) => p.replace(/^\//, "")), "app"];

export function isKnownRole(role) {
  return Boolean(role && ROLE_NAV_PATHS[role]);
}

export function getNavPaths(role) {
  return ROLE_NAV_PATHS[role] || [];
}

export function getBasePath(role) {
  return ROLE_BASE_PATH[role] || "/login";
}

/** Landing page for a role, e.g. "/admin/overview" */
export function getHomePath(role) {
  const paths = getNavPaths(role);
  return paths.length ? `${getBasePath(role)}/${paths[0]}` : "/login";
}

/** Map any page name (canonical or alias) to the role's canonical page, or null */
export function resolvePageKey(role, rawKey) {
  const key = String(rawKey || "").toLowerCase();
  const paths = getNavPaths(role);
  if (!key) return null;
  if (paths.includes(key)) return key;
  const alias = ROLE_PAGE_ALIASES[role]?.[key];
  return alias && paths.includes(alias) ? alias : null;
}

/** Page name found in a URL: "/admin/rooms" -> "rooms", "/rooms" -> "rooms", "/admin" -> "" */
export function getPageKeyFromPathname(pathname) {
  const parts = String(pathname || "").split("?")[0].split("#")[0].split("/").filter(Boolean);
  if (!parts.length) return "";
  if (APP_SEGMENTS.includes(parts[0])) return parts[1] || "";
  return parts[0];
}

/** Tab index of the page in a URL for the given role (falls back to the first tab) */
export function getTabIndexFromPathname(role, pathname) {
  const key = resolvePageKey(role, getPageKeyFromPathname(pathname));
  const idx = key ? getNavPaths(role).indexOf(key) : -1;
  return idx === -1 ? 0 : idx;
}

/** Canonical URL for a tab index, e.g. (HOTEL_ADMIN, 3) -> "/admin/rooms" */
export function getPathForTab(role, tabIndex) {
  const page = getNavPaths(role)[tabIndex];
  return page === undefined ? getHomePath(role) : `${getBasePath(role)}/${page}`;
}

/** Canonical URL the current pathname should be rewritten to for this role */
export function getCanonicalPath(role, pathname) {
  return getPathForTab(role, getTabIndexFromPathname(role, pathname));
}

/** Every page slug (canonical + aliases) a role answers to - used for static params / 404s */
export function getRoleSlugs(role) {
  return [...getNavPaths(role), ...Object.keys(ROLE_PAGE_ALIASES[role] || {})];
}

export function getAllRoleSlugs() {
  return [...new Set(Object.keys(ROLE_NAV_PATHS).flatMap(getRoleSlugs))];
}

/** Only allow post-login redirects that stay inside the signed-in app */
export function sanitizeRedirectPath(rawPath) {
  if (typeof rawPath !== "string" || !rawPath.startsWith("/") || rawPath.startsWith("//")) return null;
  const first = rawPath.split("?")[0].split("/").filter(Boolean)[0];
  return APP_SEGMENTS.includes(first) ? rawPath.split("?")[0] : null;
}
