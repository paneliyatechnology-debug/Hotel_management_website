"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

const FALLBACK = [{ id: "CASH", name: "CASH", isSystem: true }];

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
    [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      id: item?.id,
      name: String(item?.name || "").trim(),
      isSystem: Boolean(item?.is_system ?? item?.isSystem),
    }))
    .filter((item) => item.name);
}

/**
 * Active payment methods for the signed-in hotel (GET /api/v1/payment-methods).
 * Booking and checkout send the method `name` as payment_method.
 */
export function useHotelPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(API_ENDPOINTS.PAYMENT_METHODS.LIST);
        const parsed = parsePaymentMethods(res);
        if (!cancelled) setMethods(parsed.length ? parsed : FALLBACK);
      } catch {
        if (!cancelled) setMethods(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const names = methods.map((item) => item.name);
  const defaultName = names.find((name) => name.toUpperCase() === "CASH") || names[0] || "CASH";

  return { methods, names, defaultName, loading };
}
