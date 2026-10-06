"use client";

import { useState, useEffect } from "react";

/**
 * ⏱️ Custom Debounce Hook
 * Delays updating the debounced value until after `delay` milliseconds have elapsed
 * since the last time the input value changed.
 *
 * @param {any} value - Input search query or state
 * @param {number} delay - Debounce delay in milliseconds (default: 350ms)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
