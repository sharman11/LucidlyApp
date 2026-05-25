import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE, VAULTS as VAULT_DATA } from "@/constants/api";
import { fetchJSON } from "@/lib/fetch";
import { SpinningLogoEgg } from "@/components/ui/spinning-logo-egg";
import { Skeleton } from "@/components/ui/skeleton";
import { markSpinnerDiscovered } from "@/lib/spinner-discovery";

// ─── Counting Number ─────────────────────────────────────────────────────────

function CountingTVL({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const animRef = useRef<number | null>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    if (from === to) return;

    const duration = 800;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        prevValue.current = to;
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  const formatted = `$${display.toLocaleString("en-US")}`;

  return (
    <Text style={countStyles.text}>{formatted}</Text>
  );
}

const countStyles = StyleSheet.create({
  text: {
    fontSize: 36,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    textAlign: "center",
    lineHeight: 48,
  },
});

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All", icon: require("../../assets/all.svg") },
  {
    key: "flagship",
    label: "Flagship",
    icon: require("../../assets/flagship.svg"),
  },
  {
    key: "loop",
    label: "Leverage Looping",
    icon: require("../../assets/loop.svg"),
  },
  {
    key: "tranches",
    label: "Tranches",
    icon: require("../../assets/tranches.svg"),
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    icon: require("../../assets/subscription.svg"),
  },
  {
    key: "delta",
    label: "Delta Neutral",
    icon: require("../../assets/delta.svg"),
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const VAULT_BG: Record<string, number> = {
  syUSD: require("../../assets/syUSD-BG.png"),
  cyBTC: require("../../assets/cyBTC-BG.png"),
  cyETH: require("../../assets/cyETH-BG.png"),
  jrRoyUSDC: require("../../assets/jrRoyUSDC-BG.png"),
};

const VAULT_ICON: Record<string, number> = {
  syUSD: require("../../assets/syusdIcon.svg"),
  cyBTC: require("../../assets/cyBTCIcon.svg"),
  cyETH: require("../../assets/cyETHIcon.svg"),
  jrRoyUSDC: require("../../assets/jrRoyIcon.svg"),
};

const VAULTS = VAULT_DATA.map((v) => ({
  ...v,
  bg: VAULT_BG[v.type],
  icon: VAULT_ICON[v.type],
}));

// ─── Screen ──────────────────────────────────────────────────────────────────

// ─── Card sizing ─────────────────────────────────────────────────────────────
// Design baseline: card 163×127 with shadow padding of 8 px on each side
// (full SVG/PNG canvas 179×143). On smaller phones we scale the whole
// card proportionally to keep two columns + 16 px edges + 16 px col gap.

const CARD_BASE_W = 163;
const CARD_BASE_H = 127;
const CARD_BG_W = 179;
const CARD_BG_H = 143;
const SCREEN_EDGE = 16;
const COL_GAP = 16;
const ROW_GAP = 16;

function useCardSize() {
  const { width: screenW } = useWindowDimensions();
  // Cap at iPhone-Pro-Max width so cards stay phone-sized on iPad instead
  // of scaling up to fill the tablet screen.
  const effectiveW = Math.min(screenW, 398);
  // Flex treats each wrapper as the visible-card size so two cards + 16 px
  // edges + 16 px column gap exactly fit the (capped) width. The wrapper
  // itself renders bigger (full SVG/PNG canvas) via negative margins, so the
  // shadow extends into the screen-edge and column-gap area without
  // overflowing.
  const visibleW = Math.floor(
    (effectiveW - SCREEN_EDGE * 2 - COL_GAP) / 2,
  );
  const visibleH = Math.round((visibleW * CARD_BASE_H) / CARD_BASE_W);
  const wrapperW = Math.round((visibleW * CARD_BG_W) / CARD_BASE_W);
  const wrapperH = Math.round((visibleH * CARD_BG_H) / CARD_BASE_H);
  const shadowX = Math.round((wrapperW - visibleW) / 2);
  const shadowY = Math.round((wrapperH - visibleH) / 2);
  const contentInset = Math.round((visibleW * 12) / CARD_BASE_W);
  return {
    wrapperW,
    wrapperH,
    shadowX,
    shadowY,
    visibleW,
    visibleH,
    contentInset,
  };
}

export default function YieldsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const cardSize = useCardSize();
  const [easterEgg, setEasterEgg] = useState<{
    icon: number;
    accent: string;
  } | null>(null);

  // Data
  const [tvlValue, setTvlValue] = useState(0);
  const [loadingTVL, setLoadingTVL] = useState(true);
  const [tvlError, setTvlError] = useState(false);
  const [apys, setApys] = useState<Record<string, string>>({});
  const [apyLoading, setApyLoading] = useState(true);
  const [apyErrors, setApyErrors] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Card entrance animations
  const cardAnims = useRef(VAULTS.map(() => new Animated.Value(0))).current;

  const animateCards = () => {
    cardAnims.forEach((a) => a.setValue(0));
    Animated.stagger(
      100,
      cardAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  };

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

  // ── Fetchers ──

  const fetchTVL = useCallback(async () => {
    setTvlError(false);
    setLoadingTVL(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - 7 * 86400;
      const data = await fetchJSON<{ result?: Array<{ tvl: string }> } | Array<{ tvl: string }>>(
        `${API_BASE}/vault/daily_total_tvl?start=${start}&end=${now}`,
      );
      const arr = Array.isArray(data) ? data : data?.result;
      const latest =
        Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : null;
      const value = parseFloat(latest?.tvl ?? "0") || 0;
      setTvlValue(value);
    } catch {
      setTvlError(true);
    } finally {
      setLoadingTVL(false);
    }
  }, []);

  const fetchAPYs = useCallback(async () => {
    setApyLoading(true);
    const errors: Record<string, boolean> = {};
    await Promise.all(
      VAULTS.map(async (v) => {
        if (!v.address) return;
        try {
          const json = await fetchJSON<{ result?: { trailing_total_APY?: number } }>(
            `${API_BASE}/vault/apy?vaultAddress=${v.address}&duration=30d`,
          );
          const raw = json?.result?.trailing_total_APY;
          if (raw != null) {
            // A negative APY usually reflects a transient mark on the
            // strategy — show a dash rather than a number that would alarm
            // depositors.
            const display =
              Number(raw) < 0 ? "—" : Number(raw).toFixed(2) + "%";
            setApys((prev) => ({
              ...prev,
              [v.type]: display,
            }));
          } else {
            errors[v.type] = true;
          }
        } catch {
          errors[v.type] = true;
        }
      }),
    );
    setApyErrors(errors);
    setApyLoading(false);
  }, []);

  // Fetch once on mount — skip if already loaded
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchTVL();
    fetchAPYs().then(() => animateCards());
  }, [fetchTVL, fetchAPYs]);

  // Pull-to-refresh reloads everything
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTVL(), fetchAPYs()]);
    animateCards();
    setRefreshing(false);
  }, [fetchTVL, fetchAPYs]);

  // Tap TVL to refresh only TVL
  const handleTVLTap = () => {
    if (!loadingTVL) fetchTVL();
  };

  const visibleVaults =
    activeTab === "all"
      ? VAULTS
      : VAULTS.filter((v) => v.category === activeTab);
  const showCards = visibleVaults.length > 0;
  const showComingSoon = !showCards;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tvlLabel}>Total Value Locked</Text>
        <TouchableOpacity onPress={handleTVLTap} activeOpacity={0.7}>
          {loadingTVL ? (
            <View style={styles.tvlSkeletonWrap}>
              <Skeleton width={180} height={36} borderRadius={10} />
            </View>
          ) : tvlError ? (
            <Text style={styles.tvlErrorText}>Unable to load TVL. Tap to retry.</Text>
          ) : (
            <CountingTVL value={Math.floor(tvlValue)} />
          )}
        </TouchableOpacity>
      </View>

      {/* Segment Control with animated indicator */}
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
              },
            ]}
          />
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  if (tab.key !== activeTab) {
                    setActiveTab(tab.key);
                    animateCards();
                  }
                }}
                activeOpacity={1}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setTabLayouts((prev) => ({
                    ...prev,
                    [tab.key]: { x, width },
                  }));
                }}
              >
                <Image
                  source={tab.icon}
                  style={[styles.tabIcon, { opacity: active ? 1 : 0.6 }]}
                  contentFit="contain"
                  tintColor={active ? "#7F56D9" : undefined}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: SCREEN_EDGE - cardSize.shadowX },
        ]}
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
        {showCards && apyLoading && (
          <View
            style={[
              styles.grid,
              {
                paddingHorizontal: cardSize.shadowX,
                paddingVertical: cardSize.shadowY,
              },
            ]}
          >
            {visibleVaults.map((vault) => (
              <View
                key={vault.type}
                style={[
                  styles.cardWrapper,
                  {
                    width: cardSize.wrapperW,
                    height: cardSize.wrapperH,
                    marginHorizontal: -cardSize.shadowX,
                    marginVertical: -cardSize.shadowY,
                  },
                ]}
              >
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      top: cardSize.shadowY,
                      bottom: cardSize.shadowY,
                      left: cardSize.shadowX,
                      right: cardSize.shadowX,
                      backgroundColor: "#E8E2F4",
                      borderRadius: 16,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cardContent,
                    {
                      top: cardSize.shadowY,
                      left: cardSize.shadowX,
                      width: cardSize.visibleW,
                      height: cardSize.visibleH,
                      padding: cardSize.contentInset,
                    },
                  ]}
                >
                  <View style={styles.cardApyBlock}>
                    <Skeleton width={56} height={22} borderRadius={6} />
                    <Skeleton width={28} height={10} borderRadius={4} style={{ marginTop: 4 }} />
                  </View>
                  <View style={styles.cardBottom}>
                    <Skeleton width={90} height={12} borderRadius={4} />
                    <Skeleton width={40} height={10} borderRadius={4} style={{ marginTop: 4 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {showCards && !apyLoading && (
          <View
            style={[
              styles.grid,
              {
                paddingHorizontal: cardSize.shadowX,
                paddingVertical: cardSize.shadowY,
              },
            ]}
          >
            {visibleVaults.map((vault, index) => {
              const anim = cardAnims[index] ?? cardAnims[0];
              const opacity = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              });

              const hasAddress = Boolean(vault.address);
              const hasApyError = hasAddress && apyErrors[vault.type];
              const apyValue = apys[vault.type];

              return (
                <Animated.View
                  key={vault.type}
                  style={[
                    styles.cardWrapper,
                    {
                      width: cardSize.wrapperW,
                      height: cardSize.wrapperH,
                      marginHorizontal: -cardSize.shadowX,
                      marginVertical: -cardSize.shadowY,
                      opacity,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  {vault.bg ? (
                    <Image
                      source={vault.bg}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="fill"
                    />
                  ) : (
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          top: cardSize.shadowY,
                          bottom: cardSize.shadowY,
                          left: cardSize.shadowX,
                          right: cardSize.shadowX,
                          backgroundColor: "#E8E2F4",
                          borderRadius: 16,
                        },
                      ]}
                    />
                  )}

                  {/* Visible-card tap → navigate (excludes shadow/gap area) */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                      position: "absolute",
                      top: cardSize.shadowY,
                      left: cardSize.shadowX,
                      width: cardSize.visibleW,
                      height: cardSize.visibleH,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/yield-detail",
                        params: { type: vault.type },
                      })
                    }
                  />

                  {/* Logo tap → easter egg (overlays nav in logo area) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (vault.icon) {
                        setEasterEgg({
                          icon: vault.icon,
                          accent: vault.nameColor,
                        });
                        markSpinnerDiscovered();
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: cardSize.shadowY,
                      left: cardSize.shadowX,
                      width: Math.round(cardSize.visibleW * 0.5),
                      height: Math.round(cardSize.visibleH * 0.55),
                    }}
                  />

                  {/* Text overlay — non-interactive */}
                  <View
                    pointerEvents="none"
                    style={[
                      styles.cardContent,
                      {
                        top: cardSize.shadowY,
                        left: cardSize.shadowX,
                        width: cardSize.visibleW,
                        height: cardSize.visibleH,
                        padding: cardSize.contentInset,
                      },
                    ]}
                  >
                    <View style={styles.cardApyBlock}>
                      {hasApyError ? (
                        <Text style={[styles.cardApyValue, { color: "#EF4444", fontSize: 12 }]}>
                          Tap to retry
                        </Text>
                      ) : (
                        <Text style={styles.cardApyValue}>
                          {hasAddress ? (apyValue ?? "—") : "TBA"}
                        </Text>
                      )}
                      <Text style={styles.cardApyLabel}>APY</Text>
                    </View>
                    <View style={styles.cardBottom}>
                      <Text style={[styles.cardName, { color: vault.nameColor }]}>
                        {vault.name}
                      </Text>
                      <Text style={styles.cardTicker}>{vault.ticker}</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {showComingSoon && (
          <View style={styles.comingSoonContainer}>
            <Image
              source={require("../../assets/comingSoon.svg")}
              style={styles.comingSoonIcon}
              contentFit="contain"
            />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonSubtitle}>
              Vaults for this category are currently in progress and will go
              live soon.
            </Text>
          </View>
        )}
      </ScrollView>

      <SpinningLogoEgg
        visible={easterEgg !== null}
        icon={easterEgg?.icon ?? null}
        accent={easterEgg?.accent}
        onClose={() => setEasterEgg(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
    overflow: "visible",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
    gap: 4,
  },
  tvlLabel: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  tvlSkeletonWrap: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  tvlErrorText: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#EF4444",
    paddingVertical: 12,
  },

  // Tabs
  tabsWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  tabsScroll: {
    flexGrow: 0,
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
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#D6CFF0",
  },
  tabActive: {
    borderColor: "transparent",
  },
  tabIcon: {
    width: 20,
    height: 20,
    opacity: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#666666",
    opacity: 1,
  },
  tabLabelActive: {
    color: "#7F56D9",
    opacity: 1,
  },

  // Content
  scroll: {
    overflow: "visible",
  },
  content: {
    paddingBottom: 120,
    overflow: "visible",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    columnGap: COL_GAP,
    rowGap: ROW_GAP,
    overflow: "visible",
    // Cap at phone width so the 2-column grid stays phone-sized on iPad
    // (centered) instead of letting cards drift apart across the screen.
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  cardWrapper: {
    position: "relative",
    overflow: "visible",
    // Overridden inline with marginHorizontal: -shadowX, marginVertical: -shadowY
  },
  card: {
    flex: 1,
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: "absolute",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardApyBlock: {
    alignItems: "flex-end",
  },
  cardApyValue: {
    fontSize: 20,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#1A1A2E",
  },
  cardApyLabel: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  cardBottom: {
    alignSelf: "flex-start",
    gap: 1,
  },
  cardName: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  cardTicker: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  comingSoonContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 16,
    paddingHorizontal: 24,
  },
  comingSoonIcon: {
    width: 120,
    height: 120,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  comingSoonSubtitle: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    textAlign: "center",
    lineHeight: 22,
  },
});
