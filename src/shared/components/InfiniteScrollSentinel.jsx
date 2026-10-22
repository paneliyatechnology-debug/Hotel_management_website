"use client";

import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";

/**
 * Invisible marker placed after a list. When it scrolls into view it shows a small
 * loader and asks the parent for the next batch (lazy loading).
 *
 * `loadedCount` should change every time a batch is added, so the observer is re-armed
 * and keeps loading if the sentinel is still on screen (tall screens, short lists).
 */
export default function InfiniteScrollSentinel({ hasMore, onLoadMore, loadedCount, delay = 350, endLabel }) {
  const { themeConfig } = useAppTheme();
  const ref = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasMore) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;

    let timer;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        setLoading(true);
        timer = setTimeout(() => {
          setLoading(false);
          onLoadMore();
        }, delay);
      },
      { rootMargin: "120px 0px" }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
