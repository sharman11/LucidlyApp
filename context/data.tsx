import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { API_BASE } from "@/constants/api";
import { fetchJSON } from "@/lib/fetch";

// ─── Types ───────────────────────────────────────────────────────────────────

type PointsResult = {
  total_points: string;
  drops_tier: string;
  tier_multiplier: string;
  referral_bonus: string;
  deposit_exposure: string;
};

interface DataContextType {
  points: PointsResult | null;
  pointsLoading: boolean;
  referralCode: string | null;
  refresh: () => void;
}

const DataContext = createContext<DataContextType>({
  points: null,
  pointsLoading: false,
  referralCode: null,
  refresh: () => {},
});

// ─── Query keys ──────────────────────────────────────────────────────────────

export const dataKeys = {
  points: (walletId: string) => ["points", walletId] as const,
  referral: (walletId: string) => ["referral", walletId] as const,
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { wallets, activeWalletId } = useAuth();
  const activeWallet =
    wallets.find((w) => w.walletId === activeWalletId) ?? wallets[0] ?? null;
  const walletId = activeWallet?.walletId ?? null;

  const queryClient = useQueryClient();

  const pointsQuery = useQuery({
    queryKey: walletId ? dataKeys.points(walletId) : ["points", "none"],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<{ result?: PointsResult }>(
        `${API_BASE}/user/points?userAddress=${walletId}`,
        { signal },
      );
      return json?.result ?? null;
    },
    enabled: !!walletId,
    // Points are the slow (~15s) endpoint — cache aggressively.
    staleTime: 60_000,
  });

  const referralQuery = useQuery({
    queryKey: walletId ? dataKeys.referral(walletId) : ["referral", "none"],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<{ result?: { ref_code?: string } }>(
        `${API_BASE}/user/referral/code?wallet_address=${walletId}`,
        { signal },
      );
      return json?.result?.ref_code ?? null;
    },
    enabled: !!walletId,
    staleTime: 5 * 60_000,
  });

  const refresh = useCallback(() => {
    if (!walletId) return;
    queryClient.invalidateQueries({ queryKey: dataKeys.points(walletId) });
    queryClient.invalidateQueries({ queryKey: dataKeys.referral(walletId) });
  }, [queryClient, walletId]);

  return (
    <DataContext.Provider
      value={{
        points: pointsQuery.data ?? null,
        pointsLoading: pointsQuery.isPending && !!walletId,
        referralCode: referralQuery.data ?? null,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
