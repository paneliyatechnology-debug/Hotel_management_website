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
 * Active payment methods for the signed-in hotel (GET /api/v1/payment-methods).
 * Booking and checkout send the method `name` as payment_method.
 * Pass `{ enabled: false }` until the dialog/wizard is open so unused pages do not fetch.
 */
export function useHotelPaymentMethods({ enabled = true } = {}) {
  const [methods, setMethods] = useState(() => cachedMethods || []);
  const [loading, setLoading] = useState(() => enabled && !cachedMethods);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    const hotelId = getActiveHotelId();
    if (cachedMethods && cachedHotelId === hotelId) {
      setMethods(cachedMethods);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = hotelId
          ? `${API_ENDPOINTS.PAYMENT_METHODS.LIST}?hotel_id=${encodeURIComponent(hotelId)}`
          : API_ENDPOINTS.PAYMENT_METHODS.LIST;
        const res = await apiRequest(url);
        const parsed = parsePaymentMethods(res);
        const next = parsed.length ? parsed : FALLBACK;
        if (!cancelled) {
          cachedMethods = next;
          cachedHotelId = hotelId;
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
  }, [enabled]);

  const names = methods.map((item) => item.name);
  const defaultName = names.find((name) => name.toUpperCase() === "CASH") || names[0] || "CASH";

  return { methods, names, defaultName, loading, error };
}
