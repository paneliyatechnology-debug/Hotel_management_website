"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function ReactQueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000, // 10 seconds default stale time
            gcTime: 5 * 60 * 1000, // 5 minutes cache retention
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSocketAnyEvent = (e) => {
      // Instantly invalidate all active React Query caches across Receptionist, Hotel Admin, and Super Admin
      queryClient.invalidateQueries();
    };

    window.addEventListener("socket:any", handleSocketAnyEvent);
    return () => {
      window.removeEventListener("socket:any", handleSocketAnyEvent);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
