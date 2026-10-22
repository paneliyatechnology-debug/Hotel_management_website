"use client";

import { useCallback, useState } from "react";

/**
 * Client-side "load more on scroll" helper.
 *
 *   const { visibleItems, hasMore, loadMore } = useInfiniteList(items, { pageSize: 12, resetKey: search });
 *
 * Render `visibleItems`, then place <InfiniteScrollSentinel hasMore onLoadMore={loadMore} /> after the list.
 * The visible count resets to one page whenever `resetKey` changes (search / filter change).
 */
export function useInfiniteList(items, { pageSize = 12, resetKey = "" } = {}) {
  const [state, setState] = useState({ key: resetKey, count: pageSize });
  const count = state.key === resetKey ? state.count : pageSize;

  const loadMore = useCallback(() => {
    setState((prev) => {
      const base = prev.key === resetKey ? prev.count : pageSize;
      return { key: resetKey, count: base + pageSize };
    });
  }, [resetKey, pageSize]);

  return {
    visibleItems: items.slice(0, count),
    visibleCount: Math.min(count, items.length),
    hasMore: count < items.length,
    loadMore,
  };
}
