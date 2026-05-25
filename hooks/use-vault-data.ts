import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/constants/api";
import { fetchJSON } from "@/lib/fetch";
import { getDeviceId } from "@/lib/device-id";
import {
  type VaultType,
  type TvlPoint,
  type ApyPoint,
  type ApyMaWindow,
  type AllocPoint,
  type AttrPoint,
  type HealthSnapshot,
  type RawCarrySnapshot,
  type FaqItem,
  type VaultDetails,
  VAULT_STATIC,
  FEE_OVERRIDES,
  DETAILS_OVERRIDES,
  FAQ_OVERRIDES,
  formatTVL,
} from "@/constants/yield-detail";

export type UseVaultDataResult = {
  // Header
  vaultName: string;
  ticker: string;
  tvl: string;
  apy: string;
  balance: string;

  // Charts
  tvlHistory: TvlPoint[];
  tvlBaseCurrency: string;
  tvlLoading: boolean;
  apyHistory: ApyPoint[];
  apyLoading: boolean;
  allocHistory: AllocPoint[];
  allocLoading: boolean;
  attrHistory: AttrPoint[];
  attrLoading: boolean;
  healthHistory: HealthSnapshot[];
  healthLoading: boolean;

  // Details / FAQ
  vaultDetails: VaultDetails | null;
  detailsLoading: boolean;
  faqs: FaqItem[];
};

/**
 * Bundles all per-vault data fetches behind one hook. Each underlying query is
 * independent (own key, own cache entry); the portfolio query intentionally
 * shares its key with portfolio.tsx + wallet.tsx so the three screens dedup.
 */
export function useVaultData(
  vaultType: VaultType,
  apyMaWindow: ApyMaWindow,
  walletId: string | null,
): UseVaultDataResult {
  const symbol = vaultType.toLowerCase();
  const config = VAULT_STATIC[vaultType];

  // Vault config (drives header name/ticker + Details tab + FAQ tab)
  const vaultConfigQuery = useQuery({
    queryKey: ["vault-config", symbol],
    queryFn: async ({ signal }) => {
      return fetchJSON<any>(`${API_BASE}/vault_config?vaultSymbol=${symbol}`, {
        signal,
      });
    },
    staleTime: 5 * 60_000,
  });
  const cfgJson = vaultConfigQuery.data;
  const vc =
    cfgJson?.result?.vault_constants ?? cfgJson?.vault_constants ?? null;
  const vaultName: string = vc?.name ?? cfgJson?.name ?? config.defaultName;
  const ticker: string = vc?.symbol ?? cfgJson?.symbol ?? vaultType;

  // TVL history — also gives us "current TVL" via last point
  const tvlHistoryQuery = useQuery({
    queryKey: ["vault-tvl-history", config.address],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<any>(
        `${API_BASE}/vault/daily_tvl?strategyAddress=${config.address}`,
        { signal },
      );
      const arr = Array.isArray(json) ? json : (json?.result ?? []);
      const baseCurrency: string = arr[0]?.base_currency ?? "USD";
      const points: TvlPoint[] = arr.map(
        (item: {
          date: string;
          tvl: string | number;
          tvl_usd?: string | number;
        }) => ({
          date: item.date,
          usd: parseFloat(String(item.tvl_usd ?? item.tvl)) || 0,
          base: parseFloat(String(item.tvl)) || 0,
        }),
      );
      return { baseCurrency, points };
    },
  });
  const tvlHistory: TvlPoint[] = tvlHistoryQuery.data?.points ?? [];
  const tvlBaseCurrency = tvlHistoryQuery.data?.baseCurrency ?? "USD";
  const tvlLoading = tvlHistoryQuery.isPending;
  const tvl: string = (() => {
    const last = tvlHistory[tvlHistory.length - 1];
    return last ? formatTVL(last.usd) : "$0";
  })();

  // Current APY (header pill)
  const apyCurrentQuery = useQuery({
    queryKey: ["vault-apy-current", config.address],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<any>(
        `${API_BASE}/vault/apy?vaultAddress=${config.address}&duration=30d`,
        { signal },
      );
      const raw = json?.result?.trailing_total_APY;
      if (raw == null) return "—";
      // A negative APY usually reflects a transient mark; show a dash
      // rather than a number that would alarm depositors. Yields list
      // applies the same rule.
      const n = Number(raw);
      return n < 0 ? "—" : n.toFixed(2) + "%";
    },
  });
  const apy: string = apyCurrentQuery.data ?? "—";

  // APY history — keyed by MA window so changing the window refetches
  const apyHistoryQuery = useQuery({
    queryKey: ["vault-apy-history", config.address, apyMaWindow],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<any>(
        `${API_BASE}/vault/apy_history?vaultAddress=${config.address}&duration=${apyMaWindow}&period=daily`,
        { signal },
      );
      const arr = json?.result ?? [];
      return arr.map(
        (item: { timestamp: string; ma_apy_annualized: number }) => ({
          timestamp: item.timestamp,
          apy: item.ma_apy_annualized ?? 0,
        }),
      ) as ApyPoint[];
    },
  });
  const apyHistory: ApyPoint[] = apyHistoryQuery.data ?? [];
  const apyLoading = apyHistoryQuery.isPending;

  // Allocation history
  const allocHistoryQuery = useQuery({
    queryKey: ["vault-alloc-history", config.address],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<any>(
        `${API_BASE}/vault/allocations_daily?vaultAddress=${config.address}`,
        { signal },
      );
      const arr = Array.isArray(json) ? json : (json?.result ?? []);
      return arr.map(
        (item: {
          date: string;
          allocations: { allocation: string; aum: number }[];
        }) => ({
          date: item.date,
          allocations: (item.allocations ?? []).map((a) => ({
            allocation: a.allocation,
            aum: a.aum ?? 0,
          })),
        }),
      ) as AllocPoint[];
    },
  });
  const allocHistory: AllocPoint[] = allocHistoryQuery.data ?? [];
  const allocLoading = allocHistoryQuery.isPending;

  // Attribution history
  const attrHistoryQuery = useQuery({
    queryKey: ["vault-attr-history", config.address],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<any>(
        `${API_BASE}/vault/return_attribution?vaultAddress=${config.address}`,
        { signal },
      );
      const arr = Array.isArray(json) ? json : (json?.result ?? []);
      return arr.map(
        (item: {
          date: string;
          strategies: {
            strategy_name: string;
            yield_in_dollars: number;
            strategy_id: string;
          }[];
          vault_total_yield: number;
        }) => ({
          date: item.date,
          strategies: item.strategies ?? [],
          vault_total_yield: item.vault_total_yield ?? 0,
        }),
      ) as AttrPoint[];
    },
  });
  const attrHistory: AttrPoint[] = attrHistoryQuery.data ?? [];
  const attrLoading = attrHistoryQuery.isPending;

  // Health (carry vaults only)
  const isCarryVault = vaultType === "cyBTC" || vaultType === "cyETH";
  const healthHistoryQuery = useQuery({
    queryKey: ["vault-carry-history", config.address],
    queryFn: async ({ signal }) => {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 45 * 24 * 60 * 60;
      const json = await fetchJSON<any>(
        `${API_BASE}/vault/carry?vaultAddress=${config.address}&start=${start}&end=${end}`,
        { signal },
      );
      const arr: RawCarrySnapshot[] = Array.isArray(json)
        ? json
        : (json?.result ?? []);
      return arr.map((item) => ({
        date: item.timestamp,
        ltv: (item.ltv ?? 0) * 100,
        netCarry: (item.credit_in_usdc ?? 0) - (item.debt_in_usdc ?? 0),
        assets: item.collateral_in_usdc ?? 0,
        liabilities: item.debt_in_usdc ?? 0,
      })) as HealthSnapshot[];
    },
    enabled: isCarryVault,
  });
  const healthHistory: HealthSnapshot[] = healthHistoryQuery.data ?? [];
  const healthLoading = isCarryVault && healthHistoryQuery.isPending;

  // Exchange rate (used by Details for share price)
  const exchangeRateQuery = useQuery({
    queryKey: ["vault-exchange-rate", config.address],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<any>(
        `${API_BASE}/exchange_rates?vaultAddress=${config.address}`,
        { signal },
      );
      return (json?.result ?? 1) as number;
    },
  });

  // Derived: vaultDetails + faqs
  const detailsOverride = DETAILS_OVERRIDES[vaultType];
  const vaultDetails: VaultDetails | null = vc
    ? {
        address: vc.address ?? config.address,
        auditedBy:
          detailsOverride?.auditedBy ??
          (vc.audited_by ? `${vc.audited_by} Audit Group` : "—"),
        deploymentDate:
          detailsOverride?.deploymentDate ?? vc.deployment_date ?? "—",
        managementFee:
          FEE_OVERRIDES[vaultType]?.managementFee ?? vc.management_fee ?? "0",
        performanceFee:
          FEE_OVERRIDES[vaultType]?.performanceFee ??
          vc.performance_fee ??
          "0",
        rateProvider: detailsOverride?.rateProvider ?? vc.rate_provider ?? "—",
        feeReceipt: detailsOverride?.feeReceipt ?? vc.fee_payout ?? "—",
        ownerAddress: detailsOverride?.ownerAddress ?? vc.owner ?? "—",
        sharePrice: (exchangeRateQuery.data ?? 1).toFixed(4),
        baseAsset: vc.base_asset?.asset ?? "USDC",
        symbol: vc.symbol ?? vaultType,
      }
    : null;
  const detailsLoading =
    vaultConfigQuery.isPending || exchangeRateQuery.isPending;
  const rawFaqs: { question: string; answer: string }[] =
    vc?.faqs ?? cfgJson?.result?.faqs ?? [];
  const faqs: FaqItem[] =
    FAQ_OVERRIDES[vaultType] ??
    rawFaqs.map((f) => ({ question: f.question, answer: f.answer }));

  // Portfolio balance for this vault — shares cache key with portfolio.tsx
  const portfolioQuery = useQuery({
    queryKey: ["portfolio", walletId],
    queryFn: async ({ signal }) => {
      const deviceId = await getDeviceId();
      const json = await fetchJSON<{
        portfolio?: { ticker: string; balance: number }[];
      }>(
        `${API_BASE}/mobile/user/wallet/portfolio?device_id=${deviceId}&wallet_address=${walletId}`,
        { signal },
      );
      return json?.portfolio ?? [];
    },
    enabled: !!walletId,
  });
  const balance: string = (() => {
    if (!walletId) return "--";
    const entry = (portfolioQuery.data ?? []).find(
      (p) => p.ticker === vaultType,
    );
    const bal = entry?.balance ?? 0;
    return bal > 0 ? formatTVL(bal) : "--";
  })();

  return {
    vaultName,
    ticker,
    tvl,
    apy,
    balance,
    tvlHistory,
    tvlBaseCurrency,
    tvlLoading,
    apyHistory,
    apyLoading,
    allocHistory,
    allocLoading,
    attrHistory,
    attrLoading,
    healthHistory,
    healthLoading,
    vaultDetails,
    detailsLoading,
    faqs,
  };
}
