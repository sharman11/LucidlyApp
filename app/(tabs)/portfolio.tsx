import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Animated,
  Easing,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/context/auth";
import { API_BASE, AUTO_RESET_MS, BAR_GAP } from "@/constants/api";
import { fetchJSON } from "@/lib/fetch";
import { getDeviceId } from "@/lib/device-id";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorRetry } from "@/components/ui/error-retry";
import { Skeleton } from "@/components/ui/skeleton";

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

type TabConfig = {
  key: string;
  label: string;
  icon: number;
  tint: boolean;
  barColor: string;
  activeBg?: string;
  activeBorder?: string;
  textColor?: string;
};

const TABS: TabConfig[] = [
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
    key: "cyBTC",
    label: "cyBTC",
    icon: require("../../assets/cyBTCIcon.svg"),
    tint: false,
    activeBg: "#CFE7F6",
    activeBorder: "#9BCDEC",
    textColor: "#0078CF",
    barColor: "#0078CF",
  },
  {
    key: "cyETH",
    label: "cyETH",
    icon: require("../../assets/cyETHIcon.svg"),
    tint: false,
    activeBg: "#E0E5FC",
    activeBorder: "#B6C2F4",
    textColor: "#627EEA",
    barColor: "#627EEA",
  },
  {
    key: "jrRoyUSDC",
    label: "jrRoyUSDC",
    icon: require("../../assets/jrRoyIcon.svg"),
    tint: false,
    activeBg: "#D4ECE5",
    activeBorder: "#9FD2C2",
    textColor: "#248670",
    barColor: "#248670",
  },
];

type TabKey = string;

// ─── Bar Chart ────────────────────────────────────────────────────────────────

type HistoryPoint = { balance_usd: number; date: string };
type TimeRange = "45d" | "3m" | "6m";

const TIME_RANGES: {
  key: TimeRange;
  label: string;
  days: number;
  maxBars: number;
}[] = [
  { key: "45d", label: "45D", days: 45, maxBars: 45 },
  { key: "3m", label: "3M", days: 90, maxBars: 65 },
  { key: "6m", label: "6M", days: 180, maxBars: 90 },
];


function sample(arr: HistoryPoint[], maxBars: number): HistoryPoint[] {
  if (arr.length <= maxBars) return arr;
  const step = arr.length / maxBars;
  return Array.from({ length: maxBars }, (_, i) => arr[Math.round(i * step)]);
}

const BAR_HEIGHTS = [
  0.4, 0.6, 0.5, 0.8, 0.7, 0.3, 0.9, 0.5, 0.6, 0.4,
  0.7, 0.8, 0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.6, 0.5,
];

function SkeletonBars() {
  // Single shared shimmer driver, native-driven for opacity.
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    shimmer.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View style={chartStyles.outer}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
        <Skeleton width={80} height={22} borderRadius={100} />
        <View style={{ flex: 1 }} />
        <Skeleton width={36} height={22} borderRadius={100} />
        <Skeleton width={36} height={22} borderRadius={100} />
        <Skeleton width={36} height={22} borderRadius={100} />
      </View>
      <View style={chartStyles.barsRow}>
        {BAR_HEIGHTS.map((baseH, i) => {
          // Stagger each bar's pulse peak so the bars shimmer in a wave.
          // Range [0.05, 0.5] keeps the interpolate input strictly increasing.
          const peak = 0.05 + (i % 8) / 16;
          const opacity = shimmer.interpolate({
            inputRange: [0, peak, peak + 0.45, 1],
            outputRange: [0.35, 0.7, 0.35, 0.35],
            extrapolate: "clamp",
          });
          return (
            <View
              key={i}
              style={[
                chartStyles.barWrapper,
                i < BAR_HEIGHTS.length - 1 && { marginRight: BAR_GAP },
              ]}
            >
              <Animated.View
                style={{
                  width: "100%",
                  height: `${baseH * 80}%`,
                  backgroundColor: "#D6CFF0",
                  borderRadius: 3,
                  opacity,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BarChart({
  data,
  color,
  loading,
  error,
  onSelectPoint,
  onRetry,
}: {
  data: HistoryPoint[];
  color: string;
  loading: boolean;
  error: boolean;
  onSelectPoint: (point: HistoryPoint | null) => void;
  onRetry: () => void;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>("45d");
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [barsSize, setBarsSize] = useState({ width: 0, height: 0 });
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barAnims = useRef<Animated.Value[]>([]);

  const cfg = TIME_RANGES.find((r) => r.key === timeRange)!;
  const raw = data.slice(-cfg.days);
  const points = sample(raw, cfg.maxBars);
  const max = Math.max(...points.map((p) => p.balance_usd), 0.01);

  // Animate bars growing when data changes
  useEffect(() => {
    if (points.length === 0) return;
    barAnims.current = points.map(() => new Animated.Value(0));
    Animated.stagger(
      10,
      barAnims.current.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [data, timeRange]);

  // Drop any pending auto-reset timer on unmount so we don't fire setState
  // (or call the parent's onSelectPoint) after this chart has gone away.
  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

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

  const handleRangeChange = (r: TimeRange) => {
    setTimeRange(r);
    clearSelection();
  };

  if (loading) {
    return <SkeletonBars />;
  }

  if (error) {
    return (
      <View style={chartStyles.outer}>
        <ErrorRetry message="Unable to load chart data" onRetry={onRetry} />
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={[chartStyles.outer, { justifyContent: "center", alignItems: "center" }]}>
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
      <View style={chartStyles.rangeRow}>
        <TouchableOpacity
          style={[
            chartStyles.datePill,
            hasSelection && {
              borderColor: color + "60",
              backgroundColor: color + "12",
            },
          ]}
          onPress={() => { if (hasSelection) clearSelection(); }}
          activeOpacity={hasSelection ? 0.7 : 1}
        >
          <Text style={[chartStyles.datePillText, hasSelection && { color }]}>
            {selectedDate}
          </Text>
          {hasSelection && (
            <Svg width={9} height={9} viewBox="0 0 10 10" fill="none">
              <Path d="M2 2l6 6M8 2l-6 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {TIME_RANGES.map((r) => {
          const active = timeRange === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => handleRangeChange(r.key)}
              style={[
                chartStyles.rangeBtn,
                active && { backgroundColor: color + "18", borderColor: color + "50" },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[chartStyles.rangeText, active && { color }]}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={chartStyles.barsRow}
        onLayout={(e) =>
          setBarsSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
        }
      >
        {barsSize.height > 0 &&
          points.map((point, i) => {
            const heightPct = point.balance_usd / max;
            const targetHeight = Math.min(barsSize.height, Math.max(4, heightPct * barsSize.height));
            const anim = barAnims.current[i];
            const isSelected = selectedBar === i;

            return (
              <TouchableOpacity
                key={i}
                style={[chartStyles.barWrapper, i < points.length - 1 && { marginRight: BAR_GAP }]}
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
                <Animated.View
                  style={{
                    width: "100%",
                    height: anim
                      ? anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, targetHeight],
                        })
                      : targetHeight,
                    backgroundColor: color,
                    opacity: isSelected ? 1 : 0.25,
                    borderRadius: 3,
                  }}
                />
              </TouchableOpacity>
            );
          })}
      </View>

      <View style={chartStyles.labelsRow}>
        {[0, Math.round(points.length * 0.25), Math.round(points.length * 0.5), Math.round(points.length * 0.75), points.length - 1]
          .filter((idx, pos, arr) => idx < points.length && arr.indexOf(idx) === pos)
          .map((idx) => (
            <Text key={idx} style={chartStyles.dateLabel}>{formatDate(points[idx].date)}</Text>
          ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  outer: { flex: 1, padding: 16 },
  rangeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  datePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: "#E5E0F5",
  },
  datePillText: { fontSize: 11, fontFamily: "HankenGrotesk_500Medium", color: "#9B97A6" },
  rangeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: "#E5E0F5" },
  rangeText: { fontSize: 11, fontFamily: "HankenGrotesk_500Medium", color: "#9B97A6" },
  barsRow: { flex: 1, flexDirection: "row", alignItems: "flex-end" },
  barWrapper: { flex: 1, justifyContent: "flex-end" },
  labelsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  dateLabel: { fontSize: 9, fontFamily: "HankenGrotesk_400Regular", color: "#9B97A6" },
  emptyText: { fontSize: 13, fontFamily: "HankenGrotesk_400Regular", color: "#9B97A6" },
  errorText: { fontSize: 13, fontFamily: "HankenGrotesk_500Medium", color: "#9B97A6" },
  retryBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: "#E2D9F9" },
  retryText: { fontSize: 12, fontFamily: "HankenGrotesk_600SemiBold", color: "#7F56D9" },
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
  const walletId = activeWallet?.walletId ?? null;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedPoint, setSelectedPoint] = useState<HistoryPoint | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const portfolioQuery = useQuery({
    queryKey: ["portfolio", walletId],
    queryFn: async ({ signal }) => {
      const deviceId = await getDeviceId();
      const json = await fetchJSON<{ portfolio?: PortfolioEntry[] }>(
        `${API_BASE}/mobile/user/wallet/portfolio?device_id=${deviceId}&wallet_address=${walletId}`,
        { signal },
      );
      return json?.portfolio ?? [];
    },
    enabled: !!walletId,
  });
  const portfolio = portfolioQuery.data ?? [];
  const portfolioLoading = portfolioQuery.isPending && !!walletId;
  const portfolioError = portfolioQuery.isError;

  // Reset tab + selection when active wallet changes
  const lastWalletId = useRef<string | null>(null);
  useEffect(() => {
    if (walletId !== lastWalletId.current) {
      lastWalletId.current = walletId;
      setActiveTab("all");
      setSelectedPoint(null);
    }
  }, [walletId]);

  const allHistoryQuery = useQuery({
    queryKey: ["balance-history", walletId],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<{ result?: HistoryPoint[] }>(
        `${API_BASE}/mobile/user/wallet/balance_history?userAddress=${walletId}`,
        { signal },
      );
      return json?.result ?? [];
    },
    enabled: !!walletId,
  });

  const strategyGraphUrl =
    activeTab !== "all"
      ? portfolio.find((p) => p.ticker === activeTab)?.graph_url ?? null
      : null;

  const strategyHistoryQuery = useQuery({
    queryKey: ["strategy-history", strategyGraphUrl],
    queryFn: async ({ signal }) => {
      const json = await fetchJSON<{ result?: { balance?: string; date: string }[] }>(
        strategyGraphUrl!,
        { signal },
      );
      return (json?.result ?? []).map((p) => ({
        balance_usd: parseFloat(p.balance ?? "0"),
        date: p.date,
      }));
    },
    enabled: !!strategyGraphUrl,
  });

  const history: HistoryPoint[] =
    activeTab === "all"
      ? allHistoryQuery.data ?? []
      : strategyHistoryQuery.data ?? [];
  const loadingHistory =
    activeTab === "all"
      ? allHistoryQuery.isPending && !!walletId
      : strategyHistoryQuery.isPending && !!strategyGraphUrl;
  const historyError =
    activeTab === "all"
      ? allHistoryQuery.isError
      : strategyHistoryQuery.isError;

  // Drop the selected chart point when the user switches tabs.
  useEffect(() => {
    setSelectedPoint(null);
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    if (!walletId) return;
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["portfolio", walletId] }),
      queryClient.invalidateQueries({
        queryKey: ["balance-history", walletId],
      }),
      strategyGraphUrl
        ? queryClient.invalidateQueries({
            queryKey: ["strategy-history", strategyGraphUrl],
          })
        : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [queryClient, walletId, strategyGraphUrl]);

  const handleRetryHistory = () => {
    if (activeTab === "all") {
      allHistoryQuery.refetch();
    } else if (strategyGraphUrl) {
      strategyHistoryQuery.refetch();
    }
  };

  // Derived data
  const visibleTickers = [
    "all",
    ...portfolio.filter((p) => p.balance > 0).map((p) => p.ticker),
  ];

  const activeData = portfolio.find(
    (p) => p.ticker === (activeTab === "all" ? "all" : activeTab),
  );

  const isLoading = portfolioLoading && !activeData;

  const displayBalance = selectedPoint
    ? `$${selectedPoint.balance_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : activeData
      ? `$${activeData.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;

  const pnl = activeData ? activeData.pnl : null;
  const pnlPct =
    activeData && activeData.balance > 0 && pnl != null
      ? (pnl / (activeData.balance - pnl)) * 100
      : null;
  const pnlText =
    !selectedPoint && pnl != null
      ? `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}${pnlPct != null ? ` (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)` : ""}`
      : null;

  const activeTabConfig = TABS.find((t) => t.key === activeTab);
  const barColor = activeTabConfig?.barColor ?? "#7F56D9";

  // Tab indicator animation
  const [tabLayouts, setTabLayouts] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: layout.x,
        damping: 20,
        stiffness: 200,
        useNativeDriver: false,
      }),
      Animated.spring(indicatorW, {
        toValue: layout.width,
        damping: 20,
        stiffness: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeTab, tabLayouts]);

  // Zero balance state (portfolio loaded but all $0)
  const allZero =
    !portfolioLoading &&
    portfolio.length > 0 &&
    portfolio.every((p) => p.ticker === "all" || p.balance === 0) &&
    (portfolio.find((p) => p.ticker === "all")?.balance ?? 0) === 0;

  if (!activeWallet) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Wallet Connected</Text>
          <Text style={styles.emptySubtitle}>
            Add a wallet to view your portfolio.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.navigate("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonLabel}>Add Wallet</Text>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7F56D9"
            colors={["#7F56D9"]}
          />
        }
      >
        {/* Segment Control */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
            style={styles.tabsScroll}
          >
            {/* Animated indicator */}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  left: indicatorX,
                  width: indicatorW,
                  backgroundColor: activeTabConfig?.activeBg ?? "#E2D9F9",
                  borderColor: activeTabConfig?.activeBorder ?? "#CBBAF1",
                },
              ]}
            />
            {TABS.filter(
              (tab) =>
                portfolioLoading ||
                visibleTickers.includes(tab.key === "all" ? "all" : tab.key),
            ).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    setTabLayouts((prev) => ({
                      ...prev,
                      [tab.key]: { x, width },
                    }));
                  }}
                >
                  <View style={[styles.tabIconWrapper, tab.tint && !active && { opacity: 0.6 }]}>
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
                      active && tab.textColor && { color: tab.textColor },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <View style={styles.balanceRow}>
            {isLoading ? (
              <Skeleton width={200} height={44} borderRadius={10} />
            ) : portfolioError ? (
              <TouchableOpacity
                onPress={() => portfolioQuery.refetch()}
                activeOpacity={0.7}
              >
                <Text style={styles.balanceError}>Unable to load balance. Tap to retry.</Text>
              </TouchableOpacity>
            ) : displayBalance ? (
              <Text style={styles.balanceValue}>{displayBalance}</Text>
            ) : (
              <Skeleton width={200} height={44} borderRadius={10} />
            )}
            {pnlText != null && (
              <Text style={[styles.pnl, { color: pnl! >= 0 ? "#22C55E" : "#EF4444" }]}>
                {pnlText}
              </Text>
            )}
          </View>
        </View>

        {/* Zero balance state */}
        {allZero ? (
          <View style={styles.zeroState}>
            <Text style={styles.zeroTitle}>No deposits yet</Text>
            <Text style={styles.zeroSubtitle}>
              Deposit into a strategy to start tracking your portfolio here.
            </Text>
            <TouchableOpacity
              style={styles.zeroButton}
              onPress={() => router.navigate("/(tabs)/yields")}
              activeOpacity={0.8}
            >
              <Text style={styles.zeroButtonText}>View Strategies</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Chart Card */
          <View style={[styles.chartCard, { marginBottom: 94 + insets.bottom }]}>
            <BarChart
              data={history}
              color={barColor}
              loading={loadingHistory}
              error={historyError}
              onSelectPoint={setSelectedPoint}
              onRetry={handleRetryHistory}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F0FF" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    width: "100%", maxWidth: 398, alignSelf: "center",
  },
  headerLeft: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  walletName: { fontSize: 17, fontFamily: "HankenGrotesk_600SemiBold", color: "#000000" },

  // Segment
  tabsWrapper: { position: "relative", marginBottom: 20 },
  tabsScroll: {
    flexGrow: 0,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  tabsContainer: { paddingHorizontal: 16, gap: 8 },
  tabIndicator: {
    position: "absolute", top: 0, bottom: 0,
    borderRadius: 100, borderWidth: 1,
  },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: "#D6CFF0",
  },
  tabIconWrapper: { width: 20, height: 20, borderRadius: 10, overflow: "hidden" },
  tabIcon: { width: 20, height: 20 },
  tabLabel: { fontSize: 13, fontFamily: "HankenGrotesk_500Medium", color: "#626066" },
  tabLabelActive: { color: "#7F56D9" },

  // Balance
  balanceSection: {
    paddingHorizontal: 16, marginBottom: 16, gap: 4,
    width: "100%", maxWidth: 398, alignSelf: "center",
  },
  balanceLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  balanceLabel: { fontSize: 13, fontFamily: "HankenGrotesk_400Regular", color: "#626066" },
  strategyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1 },
  strategyBadgeText: { fontSize: 11, fontFamily: "HankenGrotesk_600SemiBold" },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  balanceValue: { fontSize: 40, fontFamily: "HankenGrotesk_700Bold", color: "#000000", lineHeight: 48 },
  balanceError: { fontSize: 14, fontFamily: "HankenGrotesk_500Medium", color: "#EF4444", lineHeight: 48 },
  pnl: { fontSize: 13, fontFamily: "HankenGrotesk_500Medium", paddingBottom: 6 },

  // Chart
  chartCard: {
    flex: 1, marginHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "#E2D9F9", minHeight: 280,
  },

  // Zero balance
  zeroState: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 40, gap: 10,
    width: "100%", maxWidth: 398, alignSelf: "center",
  },
  zeroTitle: { fontSize: 18, fontFamily: "HankenGrotesk_700Bold", color: "#000000" },
  zeroSubtitle: {
    fontSize: 13, fontFamily: "HankenGrotesk_400Regular", color: "#626066",
    textAlign: "center", lineHeight: 20, marginBottom: 4,
  },
  zeroButton: {
    backgroundColor: "#E2D9F9", borderRadius: 100, paddingVertical: 12, paddingHorizontal: 24,
  },
  zeroButtonText: { fontSize: 14, fontFamily: "HankenGrotesk_600SemiBold", color: "#7F56D9" },

  // Empty state (no wallet)
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32,
    width: "100%", maxWidth: 398, alignSelf: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "HankenGrotesk_700Bold", color: "#000000" },
  emptySubtitle: {
    fontSize: 14, fontFamily: "HankenGrotesk_400Regular", color: "#626066",
    textAlign: "center", lineHeight: 22, marginBottom: 8,
  },
  button: { backgroundColor: "#E2D9F9", borderRadius: 100, paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" },
  buttonLabel: { fontSize: 15, fontFamily: "HankenGrotesk_600SemiBold", color: "#7F56D9" },
});
