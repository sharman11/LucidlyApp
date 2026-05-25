import { useEffect, useMemo, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ImageBackground,
  Animated,
  Easing,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { useVaultData } from "@/hooks/use-vault-data";
import { AreaChart } from "@/components/ui/area-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { SpinningLogoEgg } from "@/components/ui/spinning-logo-egg";
import { WiggleHint } from "@/components/ui/wiggle-hint";
import {
  isSpinnerDiscovered,
  markSpinnerDiscovered,
} from "@/lib/spinner-discovery";
import Svg, { Path, Line } from "react-native-svg";
import {
  type VaultType,
  type TvlPoint,
  type ApyPoint,
  type ApyMaWindow,
  type AllocPoint,
  type AllocView,
  type DualPoint,
  type IncentivePoint,
  type AttrPoint,
  type HealthSubTab,
  type HealthPoint,
  type HealthSnapshot,
  type FaqItem,
  type VaultDetails,
  VAULT_STATIC,
  VAULT_TAG,
  VAULT_ACCENT,
  STATIC_INCENTIVES,
  ALLOC_VIEWS,
  HEALTH_SUBTABS,
  SCROLLABLE_TABS,
  ACTIVE_COLOR,
  INACTIVE_COLOR,
  tabsForVault,
} from "@/constants/yield-detail";


// ─── Skeleton variants & FadeIn ──────────────────────────────────────────────

function SkeletonChart() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Skeleton width={100} height={16} borderRadius={6} />
      <Skeleton width={140} height={10} borderRadius={4} />
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: "80%" }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} width={0} height={[40, 60, 50, 80, 70, 30, 90, 55, 65, 45, 75, 85, 50, 60, 40, 70, 35, 80, 65, 50][i % 20]} borderRadius={3} style={{ flex: 1 }} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={36} height={8} borderRadius={3} />
        ))}
      </View>
    </View>
  );
}

function SkeletonLines({ count = 4 }: { count?: number }) {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ gap: 6 }}>
          <Skeleton width={80} height={10} borderRadius={4} />
          <Skeleton width={200 - i * 20} height={14} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

function FadeIn({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [visible]);
  if (!visible) return null;
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}


// ─── Nav Icons (mirrored from custom-tab-bar) ─────────────────────────────────

function YieldsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 7L14.1314 14.8686C13.7354 15.2646 13.5373 15.4627 13.309 15.5368C13.1082 15.6021 12.8918 15.6021 12.691 15.5368C12.4627 15.4627 12.2646 15.2646 11.8686 14.8686L9.13137 12.1314C8.73535 11.7354 8.53735 11.5373 8.30902 11.4632C8.10817 11.3979 7.89183 11.3979 7.69098 11.4632C7.46265 11.5373 7.26465 11.7354 6.86863 12.1314L2 17M22 7H15M22 7V14"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PortfolioIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.9474 3.89474H15.7053C17.2086 3.89474 17.9602 3.89474 18.5344 4.1873C19.0395 4.44464 19.4501 4.85527 19.7074 5.36034C20 5.93453 20 6.68617 20 8.18947V15.7053C20 17.2086 20 17.9602 19.7074 18.5344C19.4501 19.0395 19.0395 19.4501 18.5344 19.7074C17.9602 20 17.2086 20 15.7053 20H8.18947C6.68617 20 5.93453 20 5.36034 19.7074C4.85527 19.4501 4.44464 19.0395 4.1873 18.5344C3.89474 17.9602 3.89474 17.2086 3.89474 15.7053V11.9474M8.36842 12.8421V16.4211M15.5263 11.0526V16.4211M11.9474 7.47368V16.4211M3 5.68421L5.68421 3M5.68421 3L8.36842 5.68421M5.68421 3L5.68421 8.36842"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PointsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 13.7778H16.51M3 5.77778V18.2222C3 19.2041 3.89543 20 5 20H19C20.1046 20 21 19.2041 21 18.2222V9.33333C21 8.35149 20.1046 7.55556 19 7.55556L5 7.55556C3.89543 7.55556 3 6.75962 3 5.77778ZM3 5.77778C3 4.79594 3.89543 4 5 4H17M17 13.7778C17 14.0232 16.7761 14.2222 16.5 14.2222C16.2239 14.2222 16 14.0232 16 13.7778C16 13.5323 16.2239 13.3333 16.5 13.3333C16.7761 13.3333 17 13.5323 17 13.7778Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── TVL Chart ────────────────────────────────────────────────────────────────

function TVLChart({
  data,
  loading,
  baseCurrency,
}: {
  data: TvlPoint[];
  loading: boolean;
  baseCurrency: string;
}) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [barsLayout, setBarsLayout] = useState({ width: 0, height: 0 });
  const [currency, setCurrency] = useState<"USD" | "BASE">("USD");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carry vaults have a non-USD base currency (BTC/ETH) → offer a toggle.
  const hasToggle =
    baseCurrency !== "" && baseCurrency.toUpperCase() !== "USD";
  const showBase = hasToggle && currency === "BASE";

  const points = data.slice(-45);
  const valueOf = (p: TvlPoint) => (showBase ? p.base : p.usd);
  const max = Math.max(...points.map(valueOf), 0);

  const displayValue =
    selectedBar !== null
      ? valueOf(points[selectedBar] ?? points[points.length - 1] ?? { date: "", usd: 0, base: 0 })
      : valueOf(points[points.length - 1] ?? { date: "", usd: 0, base: 0 });

  const formatValue = (v: number) =>
    showBase
      ? `${v.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })} ${baseCurrency.toUpperCase()}`
      : `$${v.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const displayDate =
    selectedBar !== null && points[selectedBar]
      ? new Date(points[selectedBar].date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

  const handleBarPress = (i: number) => {
    if (selectedBar === i) {
      setSelectedBar(null);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    } else {
      setSelectedBar(i);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setSelectedBar(null), 8000);
    }
  };

  const labelIndices = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => Math.round(f * (points.length - 1)))
    .filter((v, i, arr) => v < points.length && arr.indexOf(v) === i);

  const formatBarLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}`;
  };

  if (loading) return <SkeletonChart />;

  if (points.length === 0) {
    return (
      <View style={tvlStyles.center}>
        <Text style={tvlStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  const CURRENCY_OPTS: Array<{ key: "USD" | "BASE"; label: string }> = [
    { key: "USD", label: "USD" },
    { key: "BASE", label: baseCurrency.toUpperCase() },
  ];

  return (
    <FadeIn visible={points.length > 0}>
    <View style={tvlStyles.container}>
      {/* Value + date, with optional currency toggle */}
      <View style={tvlStyles.topRow}>
        <View>
          <Text style={tvlStyles.valueText}>{formatValue(displayValue)}</Text>
          <Text style={tvlStyles.dateText}>{displayDate}</Text>
        </View>
        {hasToggle && (
          <View style={tvlStyles.currencySwitch}>
            {CURRENCY_OPTS.map((opt) => {
              const active = currency === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => setCurrency(opt.key)}
                  style={[
                    tvlStyles.currencyTab,
                    active && tvlStyles.currencyTabActive,
                  ]}
                >
                  <Text
                    style={[
                      tvlStyles.currencyTabText,
                      active && tvlStyles.currencyTabTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Bars */}
      <View
        style={tvlStyles.barsArea}
        onLayout={(e) =>
          setBarsLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {barsLayout.height > 0 &&
          points.map((point, i) => {
            const barH =
              max > 0
                ? Math.max(4, (valueOf(point) / max) * barsLayout.height)
                : 4;
            const isSelected = selectedBar === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  tvlStyles.barWrapper,
                  i < points.length - 1 && { marginRight: 2 },
                ]}
                onPress={() => handleBarPress(i)}
                activeOpacity={1}
              >
                <View
                  style={{
                    width: "100%",
                    height: barH,
                    backgroundColor: "#7F56D9",
                    opacity: isSelected ? 0.9 : 0.3,
                    borderRadius: 3,
                  }}
                />
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Date labels */}
      <View style={tvlStyles.labelsRow}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={tvlStyles.dateLabel}>
            {formatBarLabel(points[idx].date)}
          </Text>
        ))}
      </View>
    </View>
    </FadeIn>
  );
}

const tvlStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueText: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  dateText: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    marginTop: 1,
  },
  currencySwitch: {
    flexDirection: "row",
    backgroundColor: "#E8E2F4",
    borderRadius: 100,
    padding: 2,
    alignSelf: "flex-start",
  },
  currencyTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  currencyTabActive: {
    backgroundColor: "#FFFFFF",
  },
  currencyTabText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
  },
  currencyTabTextActive: {
    color: "#1A1A2E",
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  barsArea: {
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
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── APY Chart ────────────────────────────────────────────────────────────────

const APY_MA_OPTS: Array<{ key: ApyMaWindow; label: string }> = [
  { key: "7d", label: "7D MA" },
  { key: "30d", label: "30D MA" },
];

function APYChart({
  data,
  loading,
  maWindow,
  onMaWindowChange,
}: {
  data: ApyPoint[];
  loading: boolean;
  maWindow: ApyMaWindow;
  onMaWindowChange: (w: ApyMaWindow) => void;
}) {
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });

  const points = data.slice(-180);
  const latest = points[points.length - 1];
  const displayValue = latest?.apy ?? 0;
  const displayDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const labelIndices = [0, 0.2, 0.4, 0.6, 0.8, 1]
    .map((f) =>
      Math.min(Math.round(f * (points.length - 1)), points.length - 1),
    )
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const formatLabel = (ts: string) => {
    const d = new Date(ts);
    return `${d.getDate()} ${d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}`;
  };

  if (loading) return <SkeletonChart />;

  if (points.length === 0) {
    return (
      <View style={apyStyles.center}>
        <Text style={apyStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <FadeIn visible={points.length > 0}>
    <View style={apyStyles.container}>
      <View style={apyStyles.header}>
        <View>
          <Text style={apyStyles.valueText}>{displayValue.toFixed(2)}%</Text>
          <Text style={apyStyles.dateText}>{displayDate}</Text>
        </View>
        <View style={apyStyles.maSwitch}>
          {APY_MA_OPTS.map((opt) => {
            const active = maWindow === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => onMaWindowChange(opt.key)}
                style={[
                  apyStyles.maTab,
                  active && apyStyles.maTabActive,
                ]}
              >
                <Text
                  style={[
                    apyStyles.maTabText,
                    active && apyStyles.maTabTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View
        style={apyStyles.chartArea}
        onLayout={(e) =>
          setChartLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {chartLayout.width > 0 && chartLayout.height > 0 && (
          <AreaChart
            data={points.map((p) => p.apy)}
            width={chartLayout.width}
            height={chartLayout.height}
            color="#7F56D9"
            gradientOpacityTop={0.35}
            gradientOpacityBottom={0.08}
            strokeWidth={1.5}
            showDot={false}
            id="apy-chart"
          />
        )}
      </View>
      <View style={apyStyles.labelsRow}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={apyStyles.dateLabel}>
            {formatLabel(points[idx].timestamp)}
          </Text>
        ))}
      </View>
    </View>
    </FadeIn>
  );
}

const apyStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  maSwitch: {
    flexDirection: "row",
    backgroundColor: "#E8E2F4",
    borderRadius: 100,
    padding: 2,
    alignSelf: "flex-start",
  },
  maTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  maTabActive: {
    backgroundColor: "#FFFFFF",
  },
  maTabText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
  },
  maTabTextActive: {
    color: "#1A1A2E",
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  valueText: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  dateText: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    marginTop: 1,
  },
  chartArea: {
    flex: 1,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── Allocations Chart ───────────────────────────────────────────────────────

const ALLOC_COLORS = [
  "#8BA5E8",
  "#E8A87C",
  "#82C891",
  "#F0C060",
  "#C882C8",
  "#60B8C8",
];

function AllocationsChart({
  data,
  loading,
  days = 45,
}: {
  data: AllocPoint[];
  loading: boolean;
  days?: number;
}) {
  const [barsLayout, setBarsLayout] = useState({ width: 0, height: 0 });

  const points = data.slice(-days);

  const allNames = Array.from(
    new Set(points.flatMap((p) => p.allocations.map((a) => a.allocation))),
  );

  const colorMap: Record<string, string> = {};
  allNames.forEach((name, i) => {
    colorMap[name] = ALLOC_COLORS[i % ALLOC_COLORS.length];
  });

  const latestPoint = points[points.length - 1];
  const latestTotal =
    latestPoint?.allocations.reduce((s, a) => s + a.aum, 0) || 1;

  const labelIndices = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => Math.round(f * (points.length - 1)))
    .filter((v, i, arr) => v < points.length && arr.indexOf(v) === i);

  const formatBarLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}`;
  };

  if (loading) return <SkeletonChart />;

  if (points.length === 0) {
    return (
      <View style={allocStyles.center}>
        <Text style={allocStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={allocStyles.container}>
      {/* Legend */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={allocStyles.legendScroll}
        contentContainerStyle={allocStyles.legendContent}
      >
        {allNames.map((name) => {
          const aum =
            latestPoint?.allocations.find((a) => a.allocation === name)?.aum ??
            0;
          const pct = ((aum / latestTotal) * 100).toFixed(1);
          return (
            <View key={name} style={allocStyles.legendItem}>
              <View
                style={[
                  allocStyles.legendSquare,
                  { backgroundColor: colorMap[name] },
                ]}
              />
              <Text style={allocStyles.legendName}>{name}</Text>
              <Text style={allocStyles.legendSep}> | </Text>
              <Text style={allocStyles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bars */}
      <View
        style={allocStyles.barsArea}
        onLayout={(e) =>
          setBarsLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {barsLayout.height > 0 &&
          points.map((point, i) => {
            const total = point.allocations.reduce((s, a) => s + a.aum, 0) || 1;
            return (
              <View
                key={i}
                style={[
                  allocStyles.barWrapper,
                  i < points.length - 1 && { marginRight: 1 },
                ]}
              >
                {allNames.map((name) => {
                  const entry = point.allocations.find(
                    (a) => a.allocation === name,
                  );
                  const pct = (entry?.aum ?? 0) / total;
                  return (
                    <View
                      key={name}
                      style={{
                        width: "100%",
                        height: pct * barsLayout.height,
                        backgroundColor: colorMap[name],
                      }}
                    />
                  );
                })}
              </View>
            );
          })}
      </View>

      {/* Date labels */}
      <View style={allocStyles.labelsRow}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={allocStyles.dateLabel}>
            {formatBarLabel(points[idx].date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const allocStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  legendScroll: {
    flexGrow: 0,
    marginBottom: 10,
  },
  legendContent: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendName: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#333333",
  },
  legendSep: {
    fontSize: 11,
    color: "#D6CFF0",
  },
  legendPct: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#333333",
  },
  barsArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  barWrapper: {
    flex: 1,
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 2,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── Carry Allocations (Assets & Liabilities + Holdings) ─────────────────────

function AssetsLiabilitiesChart({
  data,
  loading,
}: {
  data: DualPoint[];
  loading: boolean;
}) {
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });

  if (loading) return <SkeletonChart />;

  if (data.length < 2) {
    return (
      <View style={faqStyles.center}>
        <Text style={faqStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  const allVals = data.flatMap((d) => [d.assets, d.liabilities]);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const pad = (rawMax - rawMin) * 0.18 || 10;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;

  const GRID = 5;
  const gridValues = Array.from({ length: GRID }, (_, i) =>
    yMax - ((yMax - yMin) / (GRID - 1)) * i,
  );

  const labelIndices = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => Math.round(f * (data.length - 1)))
    .filter((v, i, arr) => v < data.length && arr.indexOf(v) === i);

  const formatLabel = (ts: string) => {
    const d = new Date(ts);
    return `${d.getDate()} ${d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}`;
  };

  const pathFor = (key: "assets" | "liabilities", w: number, h: number) => {
    const range = yMax - yMin || 1;
    return data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((d[key] - yMin) / range) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  };

  return (
    <View style={alStyles.container}>
      <View style={alStyles.chartRow}>
        <View style={alStyles.yAxis}>
          {gridValues.map((v, i) => (
            <Text key={i} style={alStyles.yLabel}>
              ${Math.round(v)}
            </Text>
          ))}
        </View>

        <View
          style={alStyles.chartArea}
          onLayout={(e) =>
            setChartLayout({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
        >
          {chartLayout.width > 0 && chartLayout.height > 0 && (
            <Svg width={chartLayout.width} height={chartLayout.height}>
              {gridValues.map((_, i) => {
                const y =
                  (chartLayout.height / (GRID - 1)) * i;
                return (
                  <Line
                    key={i}
                    x1={0}
                    y1={y}
                    x2={chartLayout.width}
                    y2={y}
                    stroke="#D8D2EC"
                    strokeWidth={1}
                    strokeDasharray="4 5"
                  />
                );
              })}
              <Path
                d={pathFor("assets", chartLayout.width, chartLayout.height)}
                stroke="#3FA66A"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={pathFor(
                  "liabilities",
                  chartLayout.width,
                  chartLayout.height,
                )}
                stroke="#4A7DE0"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>
      </View>

      <View style={alStyles.labelsRow}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={alStyles.dateLabel}>
            {formatLabel(data[idx].date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const Y_AXIS_W = 44;

const alStyles = StyleSheet.create({
  container: { flex: 1 },
  chartRow: {
    flex: 1,
    flexDirection: "row",
  },
  yAxis: {
    width: Y_AXIS_W,
    justifyContent: "space-between",
    paddingVertical: 0,
  },
  yLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  chartArea: {
    flex: 1,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingLeft: Y_AXIS_W,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

const ALLOC_WINDOW_DAYS = 45;

function CarryAllocationsTab({
  allocData,
  allocLoading,
  carryData,
  carryLoading,
}: {
  allocData: AllocPoint[];
  allocLoading: boolean;
  carryData: DualPoint[];
  carryLoading: boolean;
}) {
  const [view, setView] = useState<AllocView>("Assets & liabilities");

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={carryAllocStyles.container}>
      {/* Header: date (left, Assets view only) + view switch (right) */}
      <View style={carryAllocStyles.headerRow}>
        {view === "Assets & liabilities" ? (
          <Text style={carryAllocStyles.dateText}>{dateStr}</Text>
        ) : (
          <View />
        )}
        <View style={carryAllocStyles.viewSwitch}>
          {ALLOC_VIEWS.map((v) => {
            const active = v === view;
            return (
              <TouchableOpacity
                key={v}
                activeOpacity={0.8}
                onPress={() => setView(v)}
                style={[
                  carryAllocStyles.viewTab,
                  active && carryAllocStyles.viewTabActive,
                ]}
              >
                <Text
                  style={[
                    carryAllocStyles.viewTabText,
                    active && carryAllocStyles.viewTabTextActive,
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {view === "Assets & liabilities" ? (
        <AssetsLiabilitiesChart data={carryData} loading={carryLoading} />
      ) : (
        <AllocationsChart
          data={allocData}
          loading={allocLoading}
          days={ALLOC_WINDOW_DAYS}
        />
      )}
    </View>
  );
}

const carryAllocStyles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  viewSwitch: {
    flexDirection: "row",
    backgroundColor: "#E8E2F4",
    borderRadius: 100,
    padding: 2,
    alignSelf: "flex-start",
  },
  viewTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  viewTabActive: {
    backgroundColor: "#FFFFFF",
  },
  viewTabText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
  },
  viewTabTextActive: {
    color: "#1A1A2E",
    fontFamily: "HankenGrotesk_600SemiBold",
  },
});

// ─── Incentives Grid ─────────────────────────────────────────────────────────

function IncentivesGrid({ data }: { data: IncentivePoint[] }) {
  if (data.length === 0) {
    return (
      <View style={incentiveStyles.empty}>
        <Text style={incentiveStyles.emptyText}>No incentives available</Text>
      </View>
    );
  }

  const rows: IncentivePoint[][] = [];
  for (let i = 0; i < data.length; i += 2) {
    rows.push(data.slice(i, i + 2));
  }

  return (
    <View style={incentiveStyles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={incentiveStyles.row}>
          {row.map((item) => (
            <ImageBackground
              key={item.name}
              source={require("../assets/incentiveBG.png")}
              style={incentiveStyles.card}
              imageStyle={incentiveStyles.cardBg}
              resizeMode="stretch"
            >
              <View style={incentiveStyles.cardInner}>
                {/* Top: image + multiplier */}
                <View style={incentiveStyles.topRow}>
                  <Image
                    source={
                      typeof item.image === "number"
                        ? item.image
                        : { uri: item.image }
                    }
                    style={incentiveStyles.incentiveImg}
                    contentFit="contain"
                  />
                  <View style={incentiveStyles.multiplierBlock}>
                    <Text style={incentiveStyles.multiplierVal}>
                      {item.multiplier}x
                    </Text>
                    <Text style={incentiveStyles.multiplierLabel}>
                      Multiplier
                    </Text>
                  </View>
                </View>

                {/* Bottom: name + description */}
                <View style={incentiveStyles.bottomBlock}>
                  <Text style={incentiveStyles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={incentiveStyles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          ))}
          {/* Spacer if odd row */}
          {row.length === 1 && <View style={incentiveStyles.cardSpacer} />}
        </View>
      ))}
    </View>
  );
}

const incentiveStyles = StyleSheet.create({
  grid: {
    gap: 12,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    height: 127,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardBg: {
    borderRadius: 16,
  },
  cardSpacer: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  incentiveImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  multiplierBlock: {
    alignItems: "flex-end",
  },
  multiplierVal: {
    fontSize: 22,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#0D0B14",
    lineHeight: 26,
  },
  multiplierLabel: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  bottomBlock: {
    gap: 2,
  },
  cardName: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#0D0B14",
  },
  cardDesc: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 14,
  },
  empty: {
    alignItems: "center",
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── Attribution Chart ───────────────────────────────────────────────────────

const ATTR_COLORS = [
  "#5B8EE6",
  "#3BBFA0",
  "#E8A87C",
  "#F0C060",
  "#C882C8",
  "#8BA5E8",
  "#82C891",
  "#60B8C8",
];

function AttributionChart({
  data,
  loading,
}: {
  data: AttrPoint[];
  loading: boolean;
}) {
  const [barsLayout, setBarsLayout] = useState({ width: 0, height: 0 });

  const points = data.slice(-45);

  // Only strategies with at least one non-zero yield day
  const activeNames = Array.from(
    new Set(
      points.flatMap((p) =>
        p.strategies
          .filter((s) => s.yield_in_dollars !== 0)
          .map((s) => s.strategy_name),
      ),
    ),
  );

  const colorMap: Record<string, string> = {};
  activeNames.forEach((name, i) => {
    colorMap[name] = ATTR_COLORS[i % ATTR_COLORS.length];
  });

  // Sum yield per strategy for legend label
  const yieldTotals: Record<string, number> = {};
  activeNames.forEach((name) => {
    yieldTotals[name] = points.reduce((sum, p) => {
      const s = p.strategies.find((st) => st.strategy_name === name);
      return sum + (s?.yield_in_dollars ?? 0);
    }, 0);
  });

  // Max absolute yield value for scaling
  const maxAbs = Math.max(
    ...points.flatMap((p) =>
      p.strategies.map((s) => Math.abs(s.yield_in_dollars)),
    ),
    0.001,
  );

  const labelIndices = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => Math.round(f * (points.length - 1)))
    .filter((v, i, arr) => v < points.length && arr.indexOf(v) === i);

  const formatBarLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}`;
  };

  if (loading) return <SkeletonChart />;

  if (points.length === 0) {
    return (
      <View style={attrStyles.center}>
        <Text style={attrStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  const halfH = barsLayout.height / 2;
  const numActive = activeNames.length || 1;
  const groupW = barsLayout.width > 0 ? barsLayout.width / points.length : 0;
  const barW = Math.max(1, (groupW - Math.max(0, numActive - 1)) / numActive);

  return (
    <View style={attrStyles.container}>
      {/* Legend */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={attrStyles.legendScroll}
        contentContainerStyle={attrStyles.legendContent}
      >
        {activeNames.map((name) => {
          const total = yieldTotals[name] ?? 0;
          const sign = total >= 0 ? "+" : "-";
          return (
            <View key={name} style={attrStyles.legendItem}>
              <View
                style={[
                  attrStyles.legendSquare,
                  { backgroundColor: colorMap[name] },
                ]}
              />
              <Text style={attrStyles.legendName}>{name}</Text>
              <Text style={attrStyles.legendSep}> | </Text>
              <Text style={attrStyles.legendVal}>
                {sign}${Math.abs(total).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bars + zero line */}
      <View
        style={attrStyles.barsArea}
        onLayout={(e) =>
          setBarsLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {barsLayout.height > 0 && (
          <View style={[attrStyles.zeroLine, { top: halfH }]} />
        )}

        {barsLayout.height > 0 &&
          barsLayout.width > 0 &&
          points.map((point, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: i * groupW,
                width: groupW,
                height: barsLayout.height,
                top: 0,
              }}
            >
              {activeNames.map((name, si) => {
                const entry = point.strategies.find(
                  (s) => s.strategy_name === name,
                );
                const val = entry?.yield_in_dollars ?? 0;
                if (val === 0) return null;
                const barH = Math.max(2, (Math.abs(val) / maxAbs) * halfH);
                const isNeg = val < 0;
                return (
                  <View
                    key={name}
                    style={{
                      position: "absolute",
                      left: si * (barW + 1),
                      width: barW,
                      height: barH,
                      top: isNeg ? halfH : halfH - barH,
                      backgroundColor: colorMap[name],
                      borderRadius: 1,
                    }}
                  />
                );
              })}
            </View>
          ))}
      </View>

      {/* Date labels */}
      <View style={attrStyles.labelsRow}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={attrStyles.dateLabel}>
            {formatBarLabel(points[idx].date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const attrStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  legendScroll: {
    flexGrow: 0,
    marginBottom: 10,
  },
  legendContent: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendName: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#333333",
  },
  legendSep: {
    fontSize: 11,
    color: "#D6CFF0",
  },
  legendVal: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#333333",
  },
  barsArea: {
    flex: 1,
    position: "relative",
  },
  zeroLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#C8BFED",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── Health Info Chart ───────────────────────────────────────────────────────

function formatHealthValue(value: number, subTab: HealthSubTab): string {
  return subTab === "LTV"
    ? `${value.toFixed(2)}%`
    : `${value.toFixed(2)} USDC`;
}

function HealthLineChart({
  data,
  width,
  height,
}: {
  data: number[];
  width: number;
  height: number;
}) {
  if (data.length < 2) return null;

  const padTop = 8;
  const padBottom = 4;
  const chartH = height - padTop - padBottom;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const getX = (i: number) => (i / (data.length - 1)) * width;
  const getY = (v: number) =>
    padTop + chartH - ((v - min) / range) * chartH;

  const linePath = data
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${getX(i).toFixed(2)} ${getY(v).toFixed(2)}`,
    )
    .join(" ");

  const GRID_LINES = 5;

  return (
    <Svg width={width} height={height}>
      {Array.from({ length: GRID_LINES }).map((_, i) => {
        const y = padTop + (chartH / (GRID_LINES - 1)) * i;
        return (
          <Line
            key={i}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="#D8D2EC"
            strokeWidth={1}
            strokeDasharray="4 5"
          />
        );
      })}
      <Path
        d={linePath}
        stroke="#7F56D9"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HealthInfoChart({
  data,
  loading,
}: {
  data: HealthSnapshot[];
  loading: boolean;
}) {
  const [subTab, setSubTab] = useState<HealthSubTab>("LTV");
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });

  // Project each snapshot onto the metric for the active sub-tab.
  const series = useMemo<HealthPoint[]>(
    () =>
      data.map((d) => ({
        date: d.date,
        value: subTab === "LTV" ? d.ltv : d.netCarry,
      })),
    [data, subTab],
  );

  if (loading) return <SkeletonLines count={6} />;

  if (series.length < 2) {
    return (
      <View style={faqStyles.center}>
        <Text style={faqStyles.emptyText}>No health data available</Text>
      </View>
    );
  }

  const latest = series[series.length - 1];
  const displayValue = latest?.value ?? 0;
  const displayDate =
    new Date(latest.date)
      .toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
      .replace(",", "") + " UTC";

  const labelIndices = [0, 0.2, 0.4, 0.6, 0.8, 1]
    .map((f) =>
      Math.min(Math.round(f * (series.length - 1)), series.length - 1),
    )
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const formatLabel = (ts: string) => {
    const d = new Date(ts);
    return `${d.getDate()} ${d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}`;
  };

  return (
    <View style={healthStyles.container}>
      {/* Header: value on the left, sub-tab switch on the right */}
      <View style={healthStyles.headerRow}>
        <View style={healthStyles.valueBlock}>
          <Text style={healthStyles.valueText}>
            {formatHealthValue(displayValue, subTab)}
          </Text>
          <Text style={healthStyles.dateText}>{displayDate}</Text>
        </View>

        <View style={healthStyles.subTabs}>
          {HEALTH_SUBTABS.map((t) => {
            const active = t === subTab;
            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.8}
                onPress={() => setSubTab(t)}
                style={[
                  healthStyles.subTab,
                  active && healthStyles.subTabActive,
                ]}
              >
                <Text
                  style={[
                    healthStyles.subTabText,
                    active && healthStyles.subTabTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chart */}
      <View
        style={healthStyles.chartArea}
        onLayout={(e) =>
          setChartLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {chartLayout.width > 0 && chartLayout.height > 0 && (
          <HealthLineChart
            data={series.map((d) => d.value)}
            width={chartLayout.width}
            height={chartLayout.height}
          />
        )}
      </View>

      {/* Date labels */}
      <View style={healthStyles.labelsRow}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={healthStyles.dateLabel}>
            {formatLabel(series[idx].date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const healthStyles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subTabs: {
    flexDirection: "row",
    backgroundColor: "#E8E2F4",
    borderRadius: 100,
    padding: 2,
    alignSelf: "flex-start",
  },
  subTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  subTabActive: {
    backgroundColor: "#FFFFFF",
  },
  subTabText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
  },
  subTabTextActive: {
    color: "#1A1A2E",
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  valueBlock: {},
  valueText: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  dateText: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    marginTop: 1,
  },
  chartArea: {
    flex: 1,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
});

// ─── FAQ Tab ─────────────────────────────────────────────────────────────────

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={faqStyles.item}>
      <TouchableOpacity
        style={faqStyles.question}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={faqStyles.questionText}>{item.question}</Text>
        <Svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        >
          <Path
            d="M6 9L12 15L18 9"
            stroke="#7F56D9"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      {open && (
        <View style={faqStyles.answerWrap}>
          <Text style={faqStyles.answerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

function FAQTab({ data, loading }: { data: FaqItem[]; loading: boolean }) {
  if (loading) return <SkeletonLines count={5} />;

  if (data.length === 0) {
    return (
      <View style={faqStyles.center}>
        <Text style={faqStyles.emptyText}>No FAQs available</Text>
      </View>
    );
  }

  return (
    <View style={faqStyles.list}>
      {data.map((item, i) => (
        <FaqAccordion key={i} item={item} />
      ))}
    </View>
  );
}

const faqStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  list: {
    gap: 10,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  item: {
    backgroundColor: "#F4F0FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8CCF6",
    overflow: "hidden",
  },
  question: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#0D0B14",
    lineHeight: 20,
  },
  answerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0EBFF",
  },
  answerText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 20,
    paddingTop: 12,
  },
});

// ─── Details Tab ─────────────────────────────────────────────────────────────

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function CopyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24264C20 6.97741 19.8946 6.72306 19.7071 6.53553L17.4645 4.29289C17.2769 4.10536 17.0226 4 16.7574 4H10C8.89543 4 8 4.89543 8 6"
        stroke="#7F56D9"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8"
        stroke="#7F56D9"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DetailsTab({
  details,
  loading,
}: {
  details: VaultDetails | null;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!details?.address) return;
    await Clipboard.setStringAsync(details.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAddr = async (fullAddr: string, key: string) => {
    await Clipboard.setStringAsync(fullAddr);
    setCopiedAddr(key);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  if (loading) return <SkeletonLines count={6} />;

  if (!details) {
    return (
      <View style={detailStyles.center}>
        <Text style={detailStyles.emptyText}>No data available</Text>
      </View>
    );
  }

  const rows: {
    label: string;
    value: string;
    fullAddr?: string;
    key: string;
  }[] = [
    { label: "Lifetime Returns", value: "—", key: "lifetime" },
    { label: "Fast Redeem", value: "—", key: "fastredeem" },
    {
      label: "Share Price",
      value: `1 ${details.baseAsset} = ${details.sharePrice} ${details.symbol}`,
      key: "shareprice",
    },
    { label: "Management Fees", value: `${details.managementFee}%`, key: "mgmt" },
    { label: "Performance Fee", value: `${details.performanceFee}%`, key: "perf" },
    { label: "Audited by", value: details.auditedBy, key: "audit" },
    { label: "Vault Deployment Date", value: details.deploymentDate, key: "deploy" },
    {
      label: "Rate Provider Address",
      value: truncateAddr(details.rateProvider),
      fullAddr: details.rateProvider,
      key: "rateprovider",
    },
    {
      label: "Fee Receipt",
      value: truncateAddr(details.feeReceipt),
      fullAddr: details.feeReceipt,
      key: "feereceipt",
    },
    {
      label: "Owner Address",
      value: truncateAddr(details.ownerAddress),
      fullAddr: details.ownerAddress,
      key: "owner",
    },
  ];

  return (
    <View style={detailStyles.card}>
      {/* Contract Address Row */}
      <View style={detailStyles.contractRow}>
        <View style={detailStyles.contractLeft}>
          <Text style={detailStyles.contractLabel}>Contract Address</Text>
          <Text style={detailStyles.contractAddr}>
            {truncateAddr(details.address)}
          </Text>
        </View>
        <TouchableOpacity
          style={[detailStyles.copyBtn, copied && detailStyles.copyBtnActive]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <CopyIcon />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={detailStyles.divider} />

      {/* Rows */}
      {rows.map((row, i) => (
        <View
          key={row.key}
          style={[
            detailStyles.row,
            i < rows.length - 1 && detailStyles.rowBorder,
          ]}
        >
          <Text style={detailStyles.rowLabel}>{row.label}</Text>
          {row.fullAddr ? (
            <TouchableOpacity
              activeOpacity={0.6}
              hitSlop={8}
              onPress={() => handleCopyAddr(row.fullAddr!, row.key)}
            >
              <Text
                style={[
                  detailStyles.rowValue,
                  detailStyles.rowValueAddr,
                  copiedAddr === row.key && detailStyles.rowValueCopied,
                ]}
              >
                {copiedAddr === row.key ? "Copied!" : row.value}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={detailStyles.rowValue}>{row.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  card: {
    backgroundColor: "#F4F0FF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8CCF6",
    overflow: "hidden",
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  contractRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contractLeft: {
    flex: 1,
    gap: 2,
  },
  contractLabel: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  contractAddr: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#0D0B14",
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E0FF",
    backgroundColor: "#F9F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtnActive: {
    backgroundColor: "#EDE9FF",
    borderColor: "#C3B5F8",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EBFF",
    marginHorizontal: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBFF",
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#0D0B14",
    textAlign: "right",
  },
  rowValueAddr: {
    textDecorationLine: "underline",
    textDecorationColor: "#7F56D9",
    color: "#7F56D9",
  },
  rowValueCopied: {
    color: "#3BBFA0",
    textDecorationLine: "none",
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { name: "yields", label: "Yields" },
  { name: "portfolio", label: "Portfolio" },
  { name: "points", label: "Points" },
  { name: "wallet", label: "Wallet" },
] as const;

const YIELDS_INDEX = 0;

export default function YieldDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();
  const { wallets, activeWalletId } = useAuth();
  const activeWallet =
    wallets.find((w) => w.walletId === activeWalletId) ?? wallets[0] ?? null;

  const requestedType = (type as VaultType) ?? "syUSD";
  const vaultType: VaultType = VAULT_STATIC[requestedType]
    ? requestedType
    : "syUSD";
  const config = VAULT_STATIC[vaultType];

  const [apyMaWindow, setApyMaWindow] = useState<ApyMaWindow>("7d");
  const incentives = STATIC_INCENTIVES[vaultType];

  const {
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
  } = useVaultData(vaultType, apyMaWindow, activeWallet?.walletId ?? null);

  const detailTabs = tabsForVault(vaultType);
  const [activeTab, setActiveTab] = useState(detailTabs[0]);
  const [depositModal, setDepositModal] = useState(false);
  const [logoEgg, setLogoEgg] = useState(false);
  // Drives the one-time logo wiggle hint until the egg is first opened.
  const [eggDiscovered, setEggDiscovered] = useState(true);

  useEffect(() => {
    isSpinnerDiscovered().then((found) => setEggDiscovered(found));
  }, []);

  const openLogoEgg = () => {
    setLogoEgg(true);
    if (!eggDiscovered) {
      setEggDiscovered(true);
      markSpinnerDiscovered();
    }
  };

  // Tab indicator animation
  const [detailTabLayouts, setDetailTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const detailIndicatorX = useRef(new Animated.Value(0)).current;
  const detailIndicatorW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const layout = detailTabLayouts[activeTab];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(detailIndicatorX, { toValue: layout.x, damping: 20, stiffness: 200, useNativeDriver: false }),
      Animated.spring(detailIndicatorW, { toValue: layout.width, damping: 20, stiffness: 200, useNativeDriver: false }),
    ]).start();
  }, [activeTab, detailTabLayouts]);
  const [navWidth, setNavWidth] = useState(0);


  const navTabWidth = navWidth / NAV_TABS.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="#000000"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Image
          source={VAULT_TAG[vaultType].source}
          style={{
            width: VAULT_TAG[vaultType].width,
            height: VAULT_TAG[vaultType].height,
          }}
          contentFit="contain"
        />
      </View>

      {/* ── Hero Row ────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Logo tap → spinning-logo easter egg (wiggles until discovered) */}
        <TouchableOpacity activeOpacity={0.7} onPress={openLogoEgg}>
          <WiggleHint active={!eggDiscovered}>
            <Image
              source={config.icon}
              style={styles.vaultIcon}
              contentFit="contain"
            />
          </WiggleHint>
        </TouchableOpacity>
        <View style={styles.heroText}>
          <Text style={styles.vaultName}>{vaultName}</Text>
          <Text style={styles.vaultTicker}>{ticker}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setDepositModal(true)}
          activeOpacity={0.8}
        >
          <ImageBackground
            source={require("../assets/depositButtonBG.png")}
            style={styles.depositBtn}
            imageStyle={styles.depositBtnBg}
            resizeMode="cover"
          >
            <Text style={styles.depositBtnText}>Deposit</Text>
          </ImageBackground>
        </TouchableOpacity>
      </View>

      {/* ── Stats Card ──────────────────────────────────────────────────── */}
      <ImageBackground
        source={require("../assets/detailCardBG.png")}
        style={styles.statsCard}
        imageStyle={styles.statsCardBg}
        resizeMode="stretch"
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tvl}</Text>
          <Text style={styles.statLabel}>TVL</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{apy}</Text>
          <Text style={styles.statLabel}>APY</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{balance}</Text>
          <Text style={styles.statLabel}>Your Balance</Text>
        </View>
      </ImageBackground>

      {/* ── Title + Subtitle ────────────────────────────────────────────── */}
      <View style={styles.titleBlock}>
        <Text style={styles.titleText}>Transparency Dashboard</Text>
        <Text style={styles.subtitleText}>
          Maximize your investment returns and diversify your portfolio. Unlock
          higher earnings with smart yield strategies.
        </Text>
      </View>

      {/* ── Segmented Control ───────────────────────────────────────────── */}
      <View style={{ position: "relative", marginBottom: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          <Animated.View
            style={[
              styles.tabIndicator,
              { left: detailIndicatorX, width: detailIndicatorW },
            ]}
          />
          {detailTabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={1}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setDetailTabLayouts((prev) => ({ ...prev, [tab]: { x, width } }));
                }}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {SCROLLABLE_TABS.includes(activeTab) ? (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={[
            styles.tabScrollContent,
            { paddingBottom: insets.bottom + 94 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "Incentives" ? (
            <IncentivesGrid data={incentives} />
          ) : activeTab === "Details" ? (
            <DetailsTab details={vaultDetails} loading={detailsLoading} />
          ) : activeTab === "FAQ" ? (
            <FAQTab data={faqs} loading={detailsLoading} />
          ) : (
            <View style={styles.tabPlaceholder}>
              <Text style={styles.tabPlaceholderText}>{activeTab}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View
          style={[styles.tabContent, { paddingBottom: insets.bottom + 94 }]}
        >
          {activeTab === "TVL" ? (
            <TVLChart
              data={tvlHistory}
              loading={tvlLoading}
              baseCurrency={tvlBaseCurrency}
            />
          ) : activeTab === "APY" ? (
            <APYChart
              data={apyHistory}
              loading={apyLoading}
              maWindow={apyMaWindow}
              onMaWindowChange={setApyMaWindow}
            />
          ) : activeTab === "Allocations" ? (
            vaultType === "cyBTC" || vaultType === "cyETH" ? (
              <CarryAllocationsTab
                allocData={allocHistory}
                allocLoading={allocLoading}
                carryData={healthHistory}
                carryLoading={healthLoading}
              />
            ) : (
              <AllocationsChart data={allocHistory} loading={allocLoading} />
            )
          ) : activeTab === "Attribution" ? (
            <AttributionChart data={attrHistory} loading={attrLoading} />
          ) : activeTab === "Health Info" ? (
            <HealthInfoChart data={healthHistory} loading={healthLoading} />
          ) : (
            <View style={styles.tabPlaceholder}>
              <Text style={styles.tabPlaceholderText}>{activeTab}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <View style={[styles.navWrapper, { paddingBottom: insets.bottom + 8 }]}>
        <View
          style={styles.navContainer}
          onLayout={(e) => setNavWidth(e.nativeEvent.layout.width)}
        >
          <Image
            source={require("../assets/navBG.png")}
            style={[
              StyleSheet.absoluteFillObject,
              { width: "100%", height: "100%" },
            ]}
            contentFit="fill"
          />
          {navWidth > 0 && (
            <Image
              source={require("../assets/navSelector.png")}
              style={[
                styles.navSelector,
                {
                  left: YIELDS_INDEX * navTabWidth + 4 + 10,
                  width: navTabWidth - 8,
                },
              ]}
              contentFit="fill"
            />
          )}
          {NAV_TABS.map((tab, index) => {
            const active = tab.name === "yields";
            const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.navTab}
                activeOpacity={0.7}
                onPress={() => {
                  if (tab.name === "yields") {
                    router.replace("/(tabs)/yields");
                  } else if (tab.name === "wallet" && wallets.length === 0) {
                    router.replace("/login");
                  } else {
                    router.replace(`/(tabs)/${tab.name}`);
                  }
                }}
              >
                <View
                  style={[
                    styles.navTabInner,
                    index === 0 && { paddingLeft: 20 },
                    index === NAV_TABS.length - 1 && { paddingRight: 20 },
                  ]}
                >
                  {tab.name === "yields" && <YieldsIcon color={color} />}
                  {tab.name === "portfolio" && <PortfolioIcon color={color} />}
                  {tab.name === "points" && <PointsIcon color={color} />}
                  {tab.name === "wallet" && <WalletIcon color={color} />}
                  <Text style={[styles.navLabel, { color }]}>{tab.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Deposit Modal ───────────────────────────────────────────────── */}
      <Modal visible={depositModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Deposits are available on desktop
            </Text>
            <Text style={styles.modalBody}>
              You can track your deposits here. To add a new one, kindly open
              the link on your computer -{" "}
              <Text
                style={styles.modalLink}
                onPress={() => Linking.openURL("https://app.lucidly.finance")}
              >
                app.lucidly.finance
              </Text>
            </Text>
            <TouchableOpacity
              style={styles.modalGotItBtn}
              onPress={() => setDepositModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalGotItText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SpinningLogoEgg
        visible={logoEgg}
        icon={config.icon}
        accent={VAULT_ACCENT[vaultType]}
        onClose={() => setLogoEgg(false)}
      />
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
    paddingTop: 12,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  vaultIcon: {
    width: 44,
    height: 44,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  vaultName: {
    fontSize: 18,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  vaultTicker: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  depositBtn: {
    borderRadius: 100,
    overflow: "hidden",
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  depositBtnBg: {
    borderRadius: 100,
  },
  depositBtnText: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#7F56D9",
  },
  // Stats Card
  statsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 20,
    // Phone-sized on iPad: card caps at the same effective width an iPhone
    // Pro Max would render (430 screen − 32 horiz margin = 398). On smaller
    // iPhones the natural width is already below 398, so unchanged.
    maxWidth: 398,
    alignSelf: "center",
    width: "100%",
  },
  statsCardBg: {
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E0F5",
  },
  // Title + Subtitle
  titleBlock: {
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 16,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  titleText: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 18,
  },
  // Segmented Tabs
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 4,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#CBBAF1",
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#D6CFF0",
  },
  tabText: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#666666",
  },
  tabTextActive: {
    color: "#7F56D9",
  },
  tabDivider: {
    height: 1,
    backgroundColor: "#E5E0F5",
    marginHorizontal: 16,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabScrollContent: {
    paddingTop: 0,
  },
  tabPlaceholder: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  tabPlaceholderText: {
    fontSize: 16,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
  },
  // Bottom Nav
  navWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#F4F0FF",
  },
  navContainer: {
    height: 78,
    flexDirection: "row",
    alignItems: "center",
    // Same cap as the main bottom nav so this yield-detail copy stays
    // phone-sized on iPad (centered) instead of stretching.
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  navSelector: {
    position: "absolute",
    top: 12,
    bottom: 12,
    zIndex: 1,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 11,
    zIndex: 2,
  },
  navTabInner: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_500Medium",
  },
  // Deposit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E0F5",
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  modalBody: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 22,
  },
  modalLink: {
    color: "#7F56D9",
    fontFamily: "HankenGrotesk_500Medium",
    textDecorationLine: "underline",
  },
  modalGotItBtn: {
    backgroundColor: "#7F56D9",
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  modalGotItText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
});
