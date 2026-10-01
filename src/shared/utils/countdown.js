"use client";

import { useState, useEffect } from "react";

/**
 * Calculates exact remaining time (Days, Hours, Minutes, Seconds) until targetDate
 */
export function getRemainingTime(targetDate) {
  if (!targetDate) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "0d 0h 0m 0s",
      shortFormatted: "Expired",
    };
  }

  const end = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (isNaN(end) || diff <= 0) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Expired",
      shortFormatted: "0m 0s",
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    formatted: parts.join(" "),
    shortFormatted: days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`,
  };
}

/**
 * React Custom Hook: Returns live ticking remaining time object that updates every 1 second
 */
export function useLiveCountdown(targetDate) {
  const [remainingTime, setRemainingTime] = useState(() => getRemainingTime(targetDate));

  useEffect(() => {
    setRemainingTime(getRemainingTime(targetDate));

    const interval = setInterval(() => {
      const updated = getRemainingTime(targetDate);
      setRemainingTime(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return remainingTime;
}
