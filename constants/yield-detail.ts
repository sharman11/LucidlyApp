import { VAULTS, ARCHIVED_VAULTS } from "@/constants/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VaultType =
  | "syUSD"
  | "syETH"
  | "syBTC"
  | "cyBTC"
  | "cyETH"
  | "jrRoyUSDC";

export type TvlPoint = { date: string; usd: number; base: number };

export type ApyPoint = { timestamp: string; apy: number };
export type ApyMaWindow = "7d" | "30d";

export type AllocPoint = {
  date: string;
  allocations: { allocation: string; aum: number }[];
};

export const ALLOC_VIEWS = ["Assets & liabilities", "Holdings"] as const;
export type AllocView = (typeof ALLOC_VIEWS)[number];

export type DualPoint = { date: string; assets: number; liabilities: number };

export type IncentivePoint = {
  name: string;
  description: string;
  image: string | number;
  multiplier: number;
  link?: string;
};

export type AttrPoint = {
  date: string;
  strategies: {
    strategy_name: string;
    yield_in_dollars: number;
    strategy_id: string;
  }[];
  vault_total_yield: number;
};

export const HEALTH_SUBTABS = ["LTV", "Net Carry"] as const;
export type HealthSubTab = (typeof HEALTH_SUBTABS)[number];

export type HealthPoint = { date: string; value: number };

export type HealthSnapshot = {
  date: string;
  ltv: number;
  netCarry: number;
  assets: number;
  liabilities: number;
};

export type RawCarrySnapshot = {
  timestamp: string;
  ltv: number;
  credit_in_usdc: number;
  debt_in_usdc: number;
  collateral_in_usdc: number;
};

export type FaqItem = { question: string; answer: string };

export type VaultDetails = {
  address: string;
  auditedBy: string;
  deploymentDate: string;
  managementFee: string;
  performanceFee: string;
  rateProvider: string;
  feeReceipt: string;
  ownerAddress: string;
  sharePrice: string;
  baseAsset: string;
  symbol: string;
};

// ─── Static per-vault config ─────────────────────────────────────────────────

export const VAULT_STATIC: Record<
  VaultType,
  { address: string; icon: number; defaultName: string }
> = {
  syUSD: {
    address: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
    icon: require("../assets/syusdIcon.svg"),
    defaultName: "Stable Yield USD",
  },
  syETH: {
    address: "0xEa96252EaBE2F2A0EA20ff42779CD985Ba596657",
    icon: require("../assets/syethIcon.svg"),
    defaultName: "Stable Yield ETH",
  },
  syBTC: {
    address: "0xC0D48269f8d6E427B0637F5e0695De11C8E75F6c",
    icon: require("../assets/sybtcIcon.svg"),
    defaultName: "Stable Yield BTC",
  },
  cyBTC: {
    address: "0x272BCD869CbDFcb32c335dB2f1F6C54Eb1A50aCc",
    icon: require("../assets/cyBTCIcon.svg"),
    defaultName: "Carry Yield BTC",
  },
  cyETH: {
    address: "0x5373690c930553648f0aaA2e53B51f0C59290B7d",
    icon: require("../assets/cyETHIcon.svg"),
    defaultName: "Carry Yield ETH",
  },
  jrRoyUSDC: {
    address: "0x71861827Aa95cA48148bdA0b40BC740d1c421070",
    icon: require("../assets/jrRoyIcon.svg"),
    defaultName: "Junior Royco USDC Vault",
  },
};

// Tab sets per vault category.
export const TABS_DEFAULT = [
  "TVL",
  "APY",
  "Allocations",
  "Attribution",
  "Incentives",
  "Details",
  "FAQ",
];

export const TABS_CARRY = [
  "TVL",
  "APY",
  "Allocations",
  "Attribution",
  "Health Info",
  "Details",
  "FAQ",
];

export function tabsForVault(vault: VaultType): string[] {
  return vault === "cyBTC" || vault === "cyETH" ? TABS_CARRY : TABS_DEFAULT;
}

export const SCROLLABLE_TABS = ["Incentives", "Details", "FAQ"];

export const ACTIVE_COLOR = "#7F56D9";
export const INACTIVE_COLOR = "#353140";

// ─── Strategy-type tag badges ────────────────────────────────────────────────

const TAG_FLAGSHIP = {
  source: require("../assets/flagshipTag.svg"),
  width: 90,
  height: 24,
};
const TAG_LOOP = {
  source: require("../assets/loopTag.svg"),
  width: 140,
  height: 24,
};
const TAG_TRANCHES = {
  source: require("../assets/tranchesTag.svg"),
  width: 122,
  height: 24,
};

export const VAULT_TAG: Record<
  VaultType,
  { source: number; width: number; height: number }
> = {
  syUSD: TAG_FLAGSHIP,
  syETH: TAG_FLAGSHIP,
  syBTC: TAG_FLAGSHIP,
  cyBTC: TAG_LOOP,
  cyETH: TAG_LOOP,
  jrRoyUSDC: TAG_TRANCHES,
};

// Per-vault accent color (matches the Yields card name color).
export const VAULT_ACCENT: Record<string, string> = Object.fromEntries(
  [...VAULTS, ...ARCHIVED_VAULTS].map((v) => [v.type, v.nameColor]),
);

// ─── Overrides ───────────────────────────────────────────────────────────────

export const STATIC_INCENTIVES: Record<VaultType, IncentivePoint[]> = {
  syUSD: [
    {
      name: "KAT Incentives",
      description: "Earn 10% Katana incentives as bonus",
      image: "https://app.lucidly.finance/images/icons/katana.png",
      multiplier: 0.1,
    },
    {
      name: "InfiniFi Points",
      description: "Points earned through protocol fund allocation",
      image: require("../assets/infinifiIcon.svg"),
      multiplier: 12,
    },
  ],
  syETH: [],
  syBTC: [],
  cyBTC: [],
  cyETH: [],
  jrRoyUSDC: [],
};

// Display-fee overrides — the API's vault_config can be stale.
export const FEE_OVERRIDES: Partial<
  Record<VaultType, { managementFee?: string; performanceFee?: string }>
> = {
  syUSD: { managementFee: "0", performanceFee: "10" },
  jrRoyUSDC: { managementFee: "0", performanceFee: "10" },
};

// Static Details overrides — for vaults whose vault_config is missing or stale.
export const DETAILS_OVERRIDES: Partial<
  Record<
    VaultType,
    Partial<
      Pick<
        VaultDetails,
        | "auditedBy"
        | "deploymentDate"
        | "rateProvider"
        | "feeReceipt"
        | "ownerAddress"
      >
    >
  >
> = {
  jrRoyUSDC: {
    auditedBy: "Pashov",
    deploymentDate: "7 April 2026",
    rateProvider: "0x0142d7E0787498c523c5E21c5BeCe9afDD82C6a3",
    feeReceipt: "0x78acDecABb2Faa7d811b02937Db3806968c7dc2b",
    ownerAddress: "0x0000000000000000000000000000000000000000",
  },
};

// FAQ overrides — when an entry exists here it fully replaces the fetched FAQ
// list for that vault.
export const FAQ_OVERRIDES: Partial<Record<VaultType, FaqItem[]>> = {
  syUSD: [
    {
      question: "What is syUSD and how does it work?",
      answer:
        "syUSD is a USDC denominated yield token designed to earn risk adjusted returns across multiple bluechip DeFi protocols. It allocates deposits to leverage positions on lending markets like Morpho and AaveV3, combined with delta neutral strategies to generate yield while maintaining USD stability.",
    },
    {
      question: "How is the yield generated?",
      answer:
        "The strategy generates yield through leveraged loop positions, and delta neutral arbitrage opportunities. Allocation decisions are made by the Lucidly team focusing on strategies with the lowest execution costs and highest risk adjusted returns.",
    },
    {
      question: "What are the main risks?",
      answer:
        "Key risks include smart contract vulnerabilities in underlying protocols, liquidation risk from leveraged positions (mitigated by safeguards), and temporary depegging of stablecoins. The vault only takes exposure to bluechip collaterals to minimize risk.",
    },
    {
      question: "How liquid is my position?",
      answer:
        "syUSD is fully liquid, you can redeem your position at any time through the Lucidly app. All transactions are executed onchain and can be verified via third-party portfolio indexers like DeBank.",
    },
    {
      question: "Who manages the strategy allocations?",
      answer:
        "All allocation decisions are made by the Lucidly team using offchain algorithms for optimal capital deployment. The Manager smart contract executes transactions verified by Merkle proofs, with the vault restricted to calling whitelisted calldata.",
    },
    {
      question: "Are there any fees?",
      answer:
        "Yes, Lucidly charges a 10% performance fee on yield generated, there is NO management fee. Exact fee structures are displayed in the app before depositing and are competitive with institutional grade yield products.",
    },
    {
      question: "What is fast redeem?",
      answer:
        "Fast Redeem enables near-instant withdrawals using the vault's reserved USDC buffer. If your withdrawal amount is within the available buffer, it will be processed in the next cycle without impacting active strategies or requiring any position unwinding.",
    },
  ],
  jrRoyUSDC: [
    {
      question: "What is Royco Jr USDC?",
      answer:
        "jrROYCO USDC is a Lucidly-managed USDC yield vault that takes structured first-loss positions on Royco Dawn's risk-tranched markets. You deposit USDC and receive jrROYCO USDC share tokens, which accrue value as the vault earns yield. The vault deploys into Junior tranches across three underlying yield sources (syrupUSDC, usdAI, and scUSD) and earns a continuously-paid risk premium from the corresponding Senior tranches in exchange for absorbing first-dollar losses on the underlying. Target net APY is ~10%.",
    },
    {
      question: "What does first-loss actually mean?",
      answer:
        "Royco Dawn splits a single yield source into two risk slices: Senior and Junior. Senior holders earn a protected, lower yield. Junior holders (like this vault) act as first-loss capital: if the underlying strategy suffers a credit event or persistent drawdown, Junior absorbs those losses before Senior is ever touched, starting from the very first dollar. In exchange, Junior earns the full base yield of the underlying plus a risk premium paid continuously by Senior holders. The premium widens when Junior capital is scarce and tightens when abundant, creating a dynamic equilibrium. Dawn also has an observation window. Temporary volatility that reverses within the window does not impair Junior. Only persistent, realized losses are allocated to Junior.",
    },
    {
      question: "Where does the yield come from?",
      answer:
        "The vault earns from three stacked components. First, base underlying yield: the lending or RWA yield each strategy produces (e.g. Maple borrower coupons inside syrupUSDC, compute-collateralized yield from usdAI, Sonic-native yield from scUSD). Second, a risk premium from Senior: a continuous spread paid by Senior holders to Junior for first-loss coverage, sized by Dawn's dynamic distribution curve. Third, capital efficiency from tranching: Junior backs a multiple of its own notional in Senior exposure, amplifying effective yield versus holding the underlying directly. Yield accrues to NAV block-by-block, so the jrROYCO USDC exchange rate increases continuously.",
    },
    {
      question: "How does this relate to Dialectic's srRoyUSDC?",
      answer:
        "srRoyUSDC is the Senior counterparty vault, curated by Dialectic. It deposits into Senior tranches and earns a protected, lower yield, with Junior capital sitting underneath it as a buffer. jrROYCO USDC is the direct counterparty to that product. Without sufficient Junior capital, the Senior vault cannot scale and its yield compresses. By deploying first-loss capital into the same Royco markets, Lucidly's vault sits on the other side of the trade, taking on the structurally higher risk-adjusted yield in exchange for absorbing the tail risk Senior is paying to avoid. Same instrument, opposite tranche.",
    },
    {
      question: "How do deposits and redemptions work?",
      answer:
        "Deposits are atomic: you deposit USDC and immediately receive jrROYCO USDC shares at the current exchange rate. The Lucidly strategist then routes USDC into the underlying assets and submits a deposit request to the Royco EntryPoint in the background. This delay is an internal allocation step and does not affect your shares. Redemptions follow a two-stage flow: you submit a withdrawal request to the Lucidly Queue, the solver batches it and calls requestRedemption on the Royco EntryPoint, and after Dawn's redemption delay your USDC is delivered. Total wait time is typically 24 to 72 hours depending on the market being unwound and queue batching. Cancellation hooks exist at every stage as a safeguard.",
    },
    {
      question: "How is the vault secured?",
      answer:
        "Royco Junior USDC runs on the same Boring Vault architecture as Lucidly's other products, with all permissions gated by a merkle tree of pre-approved actions. Every on-chain action (approve, deposit, requestDeposit, executeDeposit, requestRedemption, cancel) must validate against the deployed leaf set. The strategist cannot add new venues or move capital outside the whitelisted call graph. The MPC owner key holds vault ownership while a separate strategy-manager role executes within the merkle root. Operational keys are stored in AWS KMS, never in plaintext. Any new underlying venue requires a 48-hour timelock before being added, and cancellation paths are whitelisted as escape hatches for stuck or mispriced requests.",
    },
    {
      question: "What are the main risks I should know about?",
      answer:
        "First-loss exposure: if syrupUSDC, usdAI, or scUSD suffers a credit event or persistent drawdown beyond Dawn's observation window, the loss is absorbed by Junior (this vault) pro-rata before Senior is touched. Observation-window risk: transient volatility is protected, but a drawdown that survives the window becomes a permanent reduction in Junior NAV. Smart contract risk: three layers exist (the Lucidly Boring Vault, Royco Dawn's tranche contracts, and the underlying protocols); each is independently audited but the composition adds surface area. Liquidity risk in stress: during a drawdown-and-observation period, the strategist may pause or queue redemptions to avoid forced liquidation at impaired prices. This is a higher-risk product than syUSD. Capital is exposed to the possibility of permanent principal loss and is appropriate only for capital that can tolerate drawdown in exchange for double-digit USD yield.",
    },
  ],
};

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function formatTVL(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
