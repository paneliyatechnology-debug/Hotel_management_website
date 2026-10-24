"use client";

import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";

/**
 * Marker after a list. Loads the next API page only when the user scrolls it into view.
 * Ignores the initial "already visible" state (short lists) so page 2 is not fetched on mount.
 */
export default function InfiniteScrollSentinel({ hasMore, onLoadMore, loadedCount, delay = 350, endLabel }) {
  const { themeConfig } = useAppTheme();
  const ref = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!hasMore) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;

    let timer;
    let armed = false; // become true only after sentinel leaves the viewport once
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || cancelled) return;

        if (!entry.isIntersecting) {
          armed = true;
          return;
        }

        // Still the first paint with sentinel on-screen — wait for a real scroll
        if (!armed) return;

        observer.disconnect();
        setLoading(true);
        timer = setTimeout(() => {
          if (cancelled) return;
          setLoading(false);
          onLoadMoreRef.current?.();
        }, delay);
      },
      { root: null, rootMargin: "80px 0px", threshold: 0 }
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timer);
      setLoading(false);
    };
  }, [hasMore, loadedCount, delay]);

  if (!hasMore) {
    return endLabel ? (
      <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: themeConfig.textMuted, py: 2, fontWeight: 600 }}>
        {endLabel}
      </Typography>
    ) : null;
  }

  return (
    <Box ref={ref} sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, py: 3, minHeight: 56 }}>
      {loading ? (
        <>
          <CircularProgress size={20} thickness={5} sx={{ color: themeConfig.primary }} />
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
            Loading more...
          </Typography>
        </>
      ) : null}
    </Box>
  );
}
