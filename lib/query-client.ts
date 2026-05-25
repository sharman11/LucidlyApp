import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // RN doesn't have a window — refetchOnWindowFocus is meaningless and
      // would no-op anyway, but keep it explicit.
      refetchOnWindowFocus: false,
      // Retry once on transient errors; don't hammer a flaky backend.
      retry: 1,
      // Most of this data (TVL, APY, balances) only changes on the order of
      // minutes — a 30s freshness window cuts duplicate fetches across tab
      // switches without making the UI feel stale.
      staleTime: 30_000,
      // Keep cached data for 5 minutes after the last observer unmounts so
      // returning to a screen feels instant.
      gcTime: 5 * 60_000,
    },
  },
});
