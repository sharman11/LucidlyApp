import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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

// ─── Provider ────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { wallets, activeWalletId } = useAuth();
  const activeWallet =
    wallets.find((w) => w.walletId === activeWalletId) ?? wallets[0] ?? null;

  const [points, setPoints] = useState<PointsResult | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const fetchIdRef = useRef(0);

  const fetchAll = useCallback((walletId: string) => {
    const id = ++fetchIdRef.current;
    const stale = () => fetchIdRef.current !== id;

    setPoints(null);
    setPointsLoading(true);
    setReferralCode(null);

    // Points (slow ~15s) — biggest win from prefetching
    fetchJSON<{ result?: PointsResult }>(
      `${API_BASE}/user/points?userAddress=${walletId}`,
    )
      .then((json) => {
        if (!stale()) setPoints(json?.result ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!stale()) setPointsLoading(false);
      });

    // Referral code
    fetchJSON<{ result?: { ref_code?: string } }>(
      `${API_BASE}/user/referral/code?wallet_address=${walletId}`,
    )
      .then((json) => {
        if (!stale()) setReferralCode(json?.result?.ref_code ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeWallet) return;
    fetchAll(activeWallet.walletId);
  }, [activeWallet?.walletId, fetchAll]);

  const refresh = useCallback(() => {
    if (activeWallet) fetchAll(activeWallet.walletId);
  }, [activeWallet?.walletId, fetchAll]);

  return (
    <DataContext.Provider
      value={{ points, pointsLoading, referralCode, refresh }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
