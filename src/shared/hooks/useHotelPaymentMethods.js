"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { getActiveHotelId } from "@/shared/utils/cookieAuth";

const FALLBACK = [
  { id: "CASH", name: "CASH", isSystem: true, displayOrder: 1 },
  { id: "CARD", name: "CARD", isSystem: true, displayOrder: 2 },
  { id: "UPI", name: "UPI", isSystem: true, displayOrder: 3 },
];

const KNOWN_LABELS = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  ONLINE: "Online",
};

/** Turn an API name into a dropdown label. Custom hotel names stay as saved. */
export function paymentMethodLabel(name) {
  const raw = String(name || "").trim();
  if (!raw) return "Cash";
  return KNOWN_LABELS[raw.toUpperCase()] || raw;
}

/**
 * Normalize dashboard / summary payment breakdowns.
 * Accepts either:
 *   [{ payment_method_id, name, is_system, collected_amount }, ...]
 * or a legacy map { CASH: 2000, UPI: 100, cash_collected_amount: 2000 }
 * Returns { rows, byName } where byName is keyed by uppercased method name.
 */
export function normalizePaymentMethodCollections(raw) {
  const byName = {};
  const rows = [];

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const name = String(item.name || item.payment_method || item.paymentMethod || "").trim();
      if (!name) return;
      const key = name.toUpperCase();
      const amount = Number(
        item.collected_amount ?? item.collectedAmount ?? item.amount ?? item.total ?? 0
      ) || 0;
      byName[key] = (Number(byName[key]) || 0) + amount;
      rows.push({
        id: item.payment_method_id ?? item.paymentMethodId ?? item.id ?? key,
        name,
        isSystem: Boolean(item.is_system ?? item.isSystem),
        amount,
      });
    });
    return { rows, byName };
  }

  if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([key, value]) => {
      if (value != null && typeof value === "object" && !Array.isArray(value)) {
        const name = String(value.name || value.payment_method || key || "").trim();
        if (!name) return;
        const amount = Number(
          value.collected_amount ?? value.collectedAmount ?? value.amount ?? value.total ?? 0
        ) || 0;
        const upper = name.toUpperCase();
        byName[upper] = (Number(byName[upper]) || 0) + amount;
        rows.push({
          id: value.payment_method_id ?? value.paymentMethodId ?? value.id ?? upper,
          name,
          isSystem: Boolean(value.is_system ?? value.isSystem),
          amount,
        });
        return;
      }
      const amount = Number(value);
      if (!Number.isFinite(amount)) return;
      let name = String(key || "").trim();
      // legacy keys like cash_collected_amount / bankTransferCollectedAmount
      name = name
        .replace(/_collected_amount$/i, "")
        .replace(/CollectedAmount$/i, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/-/g, "_");
      if (!name) return;
      const upper = name.toUpperCase();
      byName[upper] = (Number(byName[upper]) || 0) + amount;
      rows.push({ id: upper, name: upper, isSystem: true, amount });
    });
  }

  return { rows, byName };
}

/** Look up collected amount for a method name from array or map payloads. */
export function amountFromPaymentCollections(raw, methodName) {
  const byName =
    raw && typeof raw === "object" && raw.byName && typeof raw.byName === "object"
      ? raw.byName
      : normalizePaymentMethodCollections(raw).byName;
  const upper = String(methodName || "").trim().toUpperCase();
  if (!upper) return 0;
  if (byName[upper] != null) return Number(byName[upper]) || 0;
  if (upper === "BANK" || upper === "BANK_TRANSFER") {
    return Number(byName.BANK_TRANSFER ?? byName.BANK ?? byName.ONLINE ?? 0) || 0;
  }
  if (upper === "ONLINE") {
    return Number(byName.ONLINE ?? byName.BANK_TRANSFER ?? 0) || 0;
  }
  return 0;
}

/**
 * Build Sources tiles for dashboards.
 * Prefers collection array amounts; keeps hotel payment-methods order when available;
 * appends any collection-only methods (e.g. custom "Google Pay") so totals stay complete.
 */
export function buildPaymentCollectionSourceRows(rawCollections, hotelMethods = []) {
  const normalized = normalizePaymentMethodCollections(rawCollections);
  const seen = new Set();
  const ordered = [];

  (Array.isArray(hotelMethods) ? hotelMethods : []).forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;
    const key = name.toUpperCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(name);
  });

  // If hotel methods are not loaded yet, fall back to the API collection list
  if (ordered.length === 0 && normalized.rows.length > 0) {
    normalized.rows.forEach((row) => {
      const key = String(row.name || "").toUpperCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      ordered.push(row.name);
    });
  } else {
    // Keep custom methods that appear in collections but not in the hotel method list
    normalized.rows.forEach((row) => {
      const key = String(row.name || "").toUpperCase();
      if (!key || seen.has(key)) return;
      if (!(Number(row.amount) > 0)) return;
      seen.add(key);
      ordered.push(row.name);
    });
  }

  return ordered.map((name) => ({
    name,
    label: paymentMethodLabel(name),
    amount: amountFromPaymentCollections(normalized, name),
  }));
}

export function parsePaymentMethods(res) {
  const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
  const list =
    payload?.payment_methods ||
    payload?.paymentMethods ||
    payload?.data?.payment_methods ||
    payload?.data?.paymentMethods ||
    (Array.isArray(payload) ? payload : []) ||
    [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      id: item?.id,
      name: String(item?.name || "").trim(),
      isSystem: Boolean(item?.is_system ?? item?.isSystem),
      displayOrder: Number(item?.display_order ?? item?.displayOrder) || 0,
      hotelId: item?.hotel_id ?? item?.hotelId,
    }))
    .filter((item) => item.name)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

let cachedMethods = null;
let cachedHotelId = null;

/**
 * Active payment methods (GET /api/v1/payment-methods).
 * Hotel admin / receptionist: hotel comes from the auth token — do not pass hotel_id.
 * Super admin only: pass `{ hotelId }` when scoping to a specific hotel.
 * Booking and checkout send the method `name` as payment_method.
 * Pass `{ enabled: false }` until the dialog/wizard is open so unused pages do not fetch.
 */
export function useHotelPaymentMethods({ enabled = true, hotelId: hotelIdOverride } = {}) {
  const [methods, setMethods] = useState(() => cachedMethods || []);
  const [loading, setLoading] = useState(() => enabled && !cachedMethods);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    // Cache key follows active hotel context; query param is only for super-admin override
    const cacheKey = hotelIdOverride != null && hotelIdOverride !== ""
      ? String(hotelIdOverride)
      : String(getActiveHotelId() || "token");
    if (cachedMethods && cachedHotelId === cacheKey) {
      setMethods(cachedMethods);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url =
          hotelIdOverride != null && hotelIdOverride !== ""
            ? `${API_ENDPOINTS.PAYMENT_METHODS.LIST}?hotel_id=${encodeURIComponent(hotelIdOverride)}`
            : API_ENDPOINTS.PAYMENT_METHODS.LIST;
        const res = await apiRequest(url);
        const parsed = parsePaymentMethods(res);
        const next = parsed.length ? parsed : FALLBACK;
        if (!cancelled) {
          cachedMethods = next;
          cachedHotelId = cacheKey;
          setMethods(next);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setMethods(FALLBACK);
          setError(err?.message || "Could not load payment methods");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, hotelIdOverride]);

  const names = methods.map((item) => item.name);
  const defaultName = names.find((name) => name.toUpperCase() === "CASH") || names[0] || "CASH";

  return { methods, names, defaultName, loading, error };
}
