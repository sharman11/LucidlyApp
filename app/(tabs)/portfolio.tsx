import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/context/auth";

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9 3v12M3 9h12"
        stroke="#000000"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SupportIcon() {
  return (
    <Image
      source={require("../../assets/support.svg")}
      style={{ width: 20, height: 20 }}
      contentFit="contain"
    />
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  {
    key: "all",
    label: "All Deposits",
    icon: require("../../assets/all.svg"),
    tint: true,
    barColor: "#7F56D9",
  },
  {
    key: "syUSD",
    label: "syUSD",
    icon: require("../../assets/syusdIcon.svg"),
    tint: false,
    activeBg: "#D5DEF7",
    activeBorder: "#A8BAEA",
    textColor: "#2775CA",
    barColor: "#2775CA",
  },
  {
    key: "syETH",
    label: "syETH",
    icon: require("../../assets/syethIcon.svg"),
    tint: false,
    activeBg: "#E5E5FD",
    activeBorder: "#D6D6F9",
    textColor: "#627EEA",
    barColor: "#627EEA",
  },
  {
    key: "syBTC",
    label: "syBTC",
    icon: require("../../assets/sybtcIcon.svg"),
    tint: false,
    activeBg: "#F5E7E7",
    activeBorder: "#E2C9D3",
    textColor: "#F7931A",
    barColor: "#F7931A",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Bar Chart ────────────────────────────────────────────────────────────────

type HistoryPoint = { balance_usd: number; date: string };
type TimeRange = "45d" | "3m" | "6m";

const TIME_RANGES: {
  key: TimeRange;
  label: string;
  days: number;
  maxBars: number;
}[] = [
  { key: "45d", label: "45D", days: 45, maxBars: 45 }, // fewest bars → thickest
  { key: "3m", label: "3M", days: 90, maxBars: 65 }, // more bars   → medium
  { key: "6m", label: "6M", days: 180, maxBars: 90 }, // most bars   → thinnest
];

const BAR_GAP = 2;
const AUTO_RESET_MS = 8000;

// Down-sample to at most maxBars by picking evenly-spaced entries
function sample(arr: HistoryPoint[], maxBars: number): HistoryPoint[] {
  if (arr.length <= maxBars) return arr;
  const step = arr.length / maxBars;
  return Array.from({ length: maxBars }, (_, i) => arr[Math.round(i * step)]);
}

function BarChart({
  data,
  color,
  loading,
  onSelectPoint,
}: {
  data: HistoryPoint[];
  color: string;
  loading: boolean;
  onSelectPoint: (point: HistoryPoint | null) => void;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>("45d");
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [barsSize, setBarsSize] = useState({ width: 0, height: 0 });
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = TIME_RANGES.find((r) => r.key === timeRange)!;
  const raw = data.slice(-cfg.days);
  const points = sample(raw, cfg.maxBars);
  const max = Math.max(...points.map((p) => p.balance_usd), 0.01);

  const clearSelection = () => {
    setSelectedBar(null);
    onSelectPoint(null);
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  const scheduleReset = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(clearSelection, AUTO_RESET_MS);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Reset selected bar when range changes
  const handleRangeChange = (r: TimeRange) => {
    setTimeRange(r);
    clearSelection();
  };

  if (loading) {
    return (
      <View style={chartStyles.outer}>
        <ActivityIndicator color={color} />
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={chartStyles.outer}>
        <Text style={chartStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  const selectedDate =
    selectedBar !== null && points[selectedBar]
      ? new Date(points[selectedBar].date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  const hasSelection = selectedBar !== null;

  return (
    <View style={chartStyles.outer}>
      {/* Filter row: date pill left, range pills right */}
      <View style={chartStyles.rangeRow}>
        {/* Date pill — resets on tap when a bar is selected */}
        <TouchableOpacity
          style={[
            chartStyles.datePill,
            hasSelection && {
              borderColor: color + "60",
              backgroundColor: color + "12",
            },
          ]}
          onPress={() => {
            if (hasSelection) clearSelection();
          }}
          activeOpacity={hasSelection ? 0.7 : 1}
        >
          <Text style={[chartStyles.datePillText, hasSelection && { color }]}>
            {selectedDate}
          </Text>
          {hasSelection && (
            <Svg width={9} height={9} viewBox="0 0 10 10" fill="none">
              <Path
                d="M2 2l6 6M8 2l-6 6"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          )}
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Range pills */}
        {TIME_RANGES.map((r) => {
          const active = timeRange === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => handleRangeChange(r.key)}
              style={[
                chartStyles.rangeBtn,
                active && {
                  backgroundColor: color + "18",
                  borderColor: color + "50",
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[chartStyles.rangeText, active && { color }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bars */}
      <View
        style={chartStyles.barsRow}
        onLayout={(e) =>
          setBarsSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {barsSize.height > 0 &&
          points.map((point, i) => {
            const heightPct = point.balance_usd / max;
            const barHeight = Math.min(
              barsSize.height,
              Math.max(4, heightPct * barsSize.height),
            );
            const isSelected = selectedBar === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  chartStyles.barWrapper,
                  i < points.length - 1 && { marginRight: BAR_GAP },
                ]}
                onPress={() => {
                  if (isSelected) {
                    clearSelection();
                  } else {
                    setSelectedBar(i);
                    onSelectPoint(point);
                    scheduleReset();
                  }
                }}
                activeOpacity={1}
              >
                <View
                  style={{
                    width: "100%",
                    height: barHeight,
                    backgroundColor: color,
                    opacity: isSelected ? 1 : 0.25,
                    borderRadius: 3,
                  }}
                />
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Date labels — flex space-between, never overflows */}
      <View style={chartStyles.labelsRow}>
        {[
          0,
          Math.round(points.length * 0.25),
          Math.round(points.length * 0.5),
          Math.round(points.length * 0.75),
          points.length - 1,
        ]
          .filter(
            (idx, pos, arr) => idx < points.length && arr.indexOf(idx) === pos,
          )
          .map((idx) => (
            <Text key={idx} style={chartStyles.dateLabel}>
              {formatDate(points[idx].date)}
            </Text>
          ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  outer: {
    flex: 1,
    padding: 16,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E5E0F5",
  },
  datePillText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E5E0F5",
  },
  rangeText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
  },
  barsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 0,
  },
  dateLabel: {
    fontSize: 9,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

type PortfolioEntry = {
  ticker: string;
  balance: number;
  pnl: number;
  graph_url: string;
};

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { wallets, activeWalletId } = useAuth();
  const activeWallet =
    wallets.find((w) => w.walletId === activeWalletId) ?? wallets[0] ?? null;

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<HistoryPoint | null>(null);

  // Fetch portfolio (balances + visible tickers)
  useEffect(() => {
    if (!activeWallet) return;
    setPortfolio([]);
    setActiveTab("all");
    setSelectedPoint(null);
    async function fetchPortfolio() {
      try {
        const deviceId =
          (await AsyncStorage.getItem("lucidly_device_id")) ?? "lucidly-ios";
        const res = await fetch(
          `https://api.lucidly.finance/services/mobile/user/wallet/portfolio?device_id=${deviceId}&wallet_address=${activeWallet!.walletId}`,
        );
        const json = await res.json();
        setPortfolio(json?.portfolio ?? []);
      } catch {
        // silently ignore
      }
    }
    fetchPortfolio();
  }, [activeWallet?.walletId]);

  // Fetch balance history whenever active wallet changes
  useEffect(() => {
    if (!activeWallet) return;
    setHistory([]);
    setLoadingHistory(true);
    async function fetchHistory() {
      try {
        const res = await fetch(
          `https://api.lucidly.finance/services/mobile/user/wallet/balance_history?userAddress=${activeWallet!.walletId}`,
        );
        const json = await res.json();
        setHistory(json?.result ?? []);
      } catch {
        // silently ignore
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [activeWallet?.walletId]);

  // Only show "all" + tickers with balance > 0
  const visibleTickers = [
    "all",
    ...portfolio.filter((p) => p.balance > 0).map((p) => p.ticker),
  ];

  // Data for the currently active tab
  const activeData = portfolio.find(
    (p) => p.ticker === (activeTab === "all" ? "all" : activeTab),
  );

  // If a bar is selected, show that bar's historical balance instead
  const displayBalance = selectedPoint
    ? `$${selectedPoint.balance_usd.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : activeData
      ? `$${activeData.balance.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "$---";

  const pnl = activeData ? activeData.pnl : null;
  const pnlText =
    !selectedPoint && pnl != null
      ? `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`
      : null;

  // Bar color for active tab
  const activeTabConfig = TABS.find((t) => t.key === activeTab);
  const barColor = activeTabConfig?.barColor ?? "#7F56D9";

  if (!activeWallet) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Wallet Connected</Text>
          <Text style={styles.emptySubtitle}>
            Connect a wallet to view your portfolio.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.navigate("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonLabel}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.navigate("/login")}
          activeOpacity={0.7}
        >
          <PlusIcon />
        </TouchableOpacity>
        <Text style={styles.walletName}>{activeWallet.name}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL("https://t.me/lucidlyfi")}>
          <SupportIcon />
        </TouchableOpacity>
      </View>

      {/* Segment Control */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScroll}
      >
        {TABS.filter(
          (tab) =>
            visibleTickers.length === 0 ||
            visibleTickers.includes(tab.key === "all" ? "all" : tab.key),
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                active && styles.tabActive,
                active &&
                  (tab as any).activeBg && {
                    backgroundColor: (tab as any).activeBg,
                    borderColor: (tab as any).activeBorder,
                  },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  tab.tint && !active && { opacity: 0.6 },
                ]}
              >
                <Image
                  source={tab.icon}
                  style={styles.tabIcon}
                  contentFit="cover"
                  tintColor={active && tab.tint ? "#7F56D9" : undefined}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                  active &&
                    (tab as any).textColor && {
                      color: (tab as any).textColor,
                    },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Balance */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>{displayBalance}</Text>
          {pnlText != null && (
            <Text
              style={[styles.pnl, { color: pnl! >= 0 ? "#22C55E" : "#EF4444" }]}
            >
              {pnlText}
            </Text>
          )}
        </View>
      </View>

      {/* Chart Card */}
      <View style={[styles.chartCard, { marginBottom: 94 + insets.bottom }]}>
        <BarChart
          data={history}
          color={barColor}
          loading={loadingHistory}
          onSelectPoint={setSelectedPoint}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  walletName: {
    fontSize: 17,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#000000",
  },

  // Segment
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 20,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#D6CFF0",
  },
  tabActive: {
    backgroundColor: "#E2D9F9",
    borderColor: "#CBBAF1",
  },
  tabIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#626066",
  },
  tabLabelActive: {
    color: "#7F56D9",
  },

  // Balance
  balanceSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  balanceValue: {
    fontSize: 40,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    lineHeight: 48,
  },
  pnl: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_500Medium",
    paddingBottom: 6,
  },

  // Chart
  chartCard: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2D9F9",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonLabel: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
  },
});
