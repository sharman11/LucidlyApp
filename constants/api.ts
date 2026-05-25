export const API_BASE = "https://api.lucidly.finance/services";

export type VaultCategory =
  | "flagship"
  | "delta"
  | "loop"
  | "tranches"
  | "subscriptions";

export const VAULTS = [
  {
    type: "syUSD" as const,
    name: "Stable Yield USD",
    ticker: "syUSD",
    nameColor: "#2775CA",
    address: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
    category: "flagship" as VaultCategory,
  },
  {
    type: "cyBTC" as const,
    name: "Carry Yield BTC",
    ticker: "cyBTC",
    nameColor: "#0078CF",
    address: "0x272BCD869CbDFcb32c335dB2f1F6C54Eb1A50aCc",
    category: "loop" as VaultCategory,
  },
  {
    type: "cyETH" as const,
    name: "Carry Yield ETH",
    ticker: "cyETH",
    nameColor: "#627EEA",
    address: "0x5373690c930553648f0aaA2e53B51f0C59290B7d",
    category: "loop" as VaultCategory,
  },
  {
    type: "jrRoyUSDC" as const,
    name: "Junior Royco USDC Vault",
    ticker: "jrRoyUSDC",
    nameColor: "#248670",
    address: "0x71861827Aa95cA48148bdA0b40BC740d1c421070",
    category: "tranches" as VaultCategory,
  },
] as const;

// Archived vaults — kept for reference; not rendered on yields or portfolio.
export const ARCHIVED_VAULTS = [
  {
    type: "syETH" as const,
    name: "Stable Yield ETH",
    ticker: "syETH",
    nameColor: "#6F89EC",
    address: "0xEa96252EaBE2F2A0EA20ff42779CD985Ba596657",
    category: "flagship" as VaultCategory,
  },
  {
    type: "syBTC" as const,
    name: "Stable Yield BTC",
    ticker: "syBTC",
    nameColor: "#E07A1F",
    address: "0xC0D48269f8d6E427B0637F5e0695De11C8E75F6c",
    category: "flagship" as VaultCategory,
  },
] as const;

export type VaultType =
  | (typeof VAULTS)[number]["type"]
  | (typeof ARCHIVED_VAULTS)[number]["type"];

// ─── Timing Constants ────────────────────────────────────────────────────────

export const MIN_SPLASH_MS = 3000;
export const MAX_SPLASH_MS = 4500;
export const AUTO_DISMISS_MS = 3500;
export const AUTO_RESET_MS = 8000;
export const BAR_GAP = 2;
