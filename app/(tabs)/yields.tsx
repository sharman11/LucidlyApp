import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

const TABS = [
  {
    key: "flagship",
    label: "Flagship",
    icon: require("../../assets/flagship.svg"),
  },
  {
    key: "delta",
    label: "Delta Neutral",
    icon: require("../../assets/delta.svg"),
  },
  {
    key: "loop",
    label: "Leverage Looping",
    icon: require("../../assets/loop.svg"),
  },
  { key: "all", label: "All", icon: require("../../assets/all.svg") },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const VAULTS = [
  {
    type: "syUSD",
    name: "Stable Yield USD",
    ticker: "syUSD",
    nameColor: "#2775CA",
    address: "0x279CAD277447965AF3d24a78197aad1B02a2c589",
    bg: require("../../assets/syusdBG.svg"),
  },
  {
    type: "syETH",
    name: "Stable Yield ETH",
    ticker: "syETH",
    nameColor: "#6F89EC",
    address: "0xEa96252EaBE2F2A0EA20ff42779CD985Ba596657",
    bg: require("../../assets/syethBG.svg"),
  },
  {
    type: "syBTC",
    name: "Stable Yield BTC",
    ticker: "syBTC",
    nameColor: "#E07A1F",
    address: "0xC0D48269f8d6E427B0637F5e0695De11C8E75F6c",
    bg: require("../../assets/sybtcBG.svg"),
  },
] as const;

function formatTVL(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

function formatAPY(value: number): string {
  return value.toFixed(2) + "%";
}

export default function YieldsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>("flagship");
  const [tvl, setTvl] = useState("$0");
  const [loadingTVL, setLoadingTVL] = useState(true);
  const [apys, setApys] = useState<Record<string, string>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loadingTVL) return;
    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * 10000000);
      setTvl(`$${random.toLocaleString("en-US")}`);
    }, 80);
    return () => clearInterval(interval);
  }, [loadingTVL]);

  const fetchTVL = async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - 7 * 86400;

      const res = await fetch(
        `https://api.lucidly.finance/services/vault/daily_total_tvl?start=${start}&end=${now}`,
      );

      const data = await res.json();

      // API returns { result: [...] } — pick last entry
      const arr = Array.isArray(data) ? data : data?.result;
      const latest =
        Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : null;

      const value = parseFloat(latest?.tvl) || 0;

      setTvl(`$${Math.floor(value).toLocaleString("en-US")}`);
    } catch (e) {
      setTvl("$0");
    } finally {
      setLoadingTVL(false);
    }
  };

  async function fetchAPYs() {
    await Promise.all(
      VAULTS.map(async (v) => {
        try {
          const res = await fetch(
            `https://api.lucidly.finance/services/vault/7d-ma?vaultAddress=${v.address}`,
          );
          const json = await res.json();
          const raw = json?.result?.trailing_total_APY;
          if (raw != null) {
            setApys((prev) => ({
              ...prev,
              [v.type]: Number(raw).toFixed(2) + "%",
            }));
          }
        } catch {
          // silently ignore
        }
      }),
    );
  }

  useEffect(() => {
    fetchTVL();
    fetchAPYs();
    intervalRef.current = setInterval(() => {
      fetchTVL();
      fetchAPYs();
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const showCards = activeTab === "flagship" || activeTab === "all";
  const showComingSoon = activeTab === "delta" || activeTab === "loop";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tvlLabel}>Total Value Locked</Text>
        <Svg width="100%" height={48}>
          <Defs>
            <SvgLinearGradient id="tvlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#595959" />
              <Stop offset="100%" stopColor="#000000" />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill="url(#tvlGrad)"
            fontSize={36}
            fontFamily="HankenGrotesk_700Bold"
            x="50%"
            textAnchor="middle"
            y={40}
          >
            {tvl}
          </SvgText>
        </Svg>
      </View>

      {/* Segment Control */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScroll}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={1}
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

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showCards && (
          <View style={styles.grid}>
            {VAULTS.map((vault) => (
              <TouchableOpacity
                key={vault.type}
                style={styles.cardWrapper}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/yield-detail",
                    params: { type: vault.type },
                  })
                }
              >
                <View style={styles.card}>
                  <Image
                    source={vault.bg}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                  <View style={styles.cardContent}>
                    {/* Top-right: APY */}
                    <View style={styles.cardApyBlock}>
                      <Text style={styles.cardApyValue}>
                        {apys[vault.type] ?? "—"}
                      </Text>
                      <Text style={styles.cardApyLabel}>APY</Text>
                    </View>
                    {/* Bottom-left: name + ticker */}
                    <View style={styles.cardBottom}>
                      <Text
                        style={[styles.cardName, { color: vault.nameColor }]}
                      >
                        {vault.name}
                      </Text>
                      <Text style={styles.cardTicker}>{vault.ticker}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    gap: 4,
  },
  tvlLabel: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  tvlValue: {
    fontSize: 36,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
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
    backgroundColor: "#E2D9F9",
    borderColor: "#CBBAF1",
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  cardWrapper: {
    width: "48%",
  },
  card: {
    height: 127,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    padding: 12,
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
