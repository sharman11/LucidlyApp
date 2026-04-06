import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Modal,
  Pressable,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/context/auth";

// ─── Icons ────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <Image
      source={require("../../assets/info.svg")}
      style={{ width: 14, height: 14 }}
      contentFit="contain"
    />
  );
}

function ShareIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
        stroke="#626066"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CopyIcon() {
  return (
    <Image
      source={require("../../assets/copyIcon.png")}
      style={{ width: 14, height: 14 }}
      contentFit="contain"
    />
  );
}

function XIcon() {
  return (
    <Image
      source={require("../../assets/xIcon.png")}
      style={{ width: 14, height: 14 }}
      contentFit="contain"
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPoints(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(2);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type PointsResult = {
  total_points: string;
  drops_tier: string;
  tier_multiplier: string;
  referral_bonus: string;
  deposit_exposure: string;
};

export default function PointsScreen() {
  const insets = useSafeAreaInsets();
  const { wallets, activeWalletId } = useAuth();
  const activeWallet =
    wallets.find((w) => w.walletId === activeWalletId) ?? wallets[0] ?? null;

  const [data, setData] = useState<PointsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tierInfoVisible, setTierInfoVisible] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWallet) return;
    setData(null);
    setLoading(true);
    fetch(
      `https://api.lucidly.finance/services/user/points?userAddress=${activeWallet.walletId}`,
    )
      .then((r) => r.json())
      .then((json) => setData(json?.result ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWallet?.walletId]);

  useEffect(() => {
    if (!activeWallet) return;
    setReferralCode(null);
    fetch(
      `https://api.lucidly.finance/services/user/referral/code?wallet_address=${activeWallet.walletId}`,
    )
      .then((r) => r.json())
      .then((json) => setReferralCode(json?.result?.ref_code ?? null))
      .catch(() => {});
  }, [activeWallet?.walletId]);

  const totalPoints = data ? parseFloat(data.total_points) : null;
  const dropsTier = data ? parseFloat(data.drops_tier) : null;

  const handleCopy = async () => {
    if (referralCode) await Clipboard.setStringAsync(referralCode);
  };

  const handleShareX = () => {
    if (!referralCode) return;
    const text = encodeURIComponent(
      `Use my referral code ${referralCode} to join Lucidly! https://lucidly.finance`,
    );
    Linking.openURL(`https://twitter.com/intent/tweet?text=${text}`);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: 94 + insets.bottom },
      ]}
    >
      <View style={styles.scroll}>
        {/* ── Phase 1 ── */}
        <ImageBackground
          source={require("../../assets/phasePoint.png")}
          style={[
            styles.card,
            { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },
          ]}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="stretch"
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Phase 1</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.twoCol}>
            <View>
              <Text style={styles.metaLabel}>Starts</Text>
              <Text style={styles.metaValue}>01 Feb 2026</Text>
            </View>
            <View style={styles.colRight}>
              <Text style={styles.metaLabel}>Ends</Text>
              <Text style={styles.metaValue}>28 Feb 2026</Text>
            </View>
          </View>
        </ImageBackground>

        {/* ── Drops Tier ── */}
        <ImageBackground
          source={require("../../assets/tierPoint.png")}
          style={[styles.card, styles.tierCard, { padding: 20 }]}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="stretch"
        >
          <View style={styles.tierRow}>
            <View style={styles.tierLabelRow}>
              <Text style={styles.tierLabel}>Drops Tier</Text>
              <TouchableOpacity
                onPress={() => setTierInfoVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <InfoIcon />
              </TouchableOpacity>
            </View>
            <Text style={styles.tierValue}>
              {dropsTier != null ? `${dropsTier}x` : "--"}
            </Text>
          </View>
        </ImageBackground>

        {/* ── Your Drops ── */}
        <ImageBackground
          source={require("../../assets/dropsPoints.png")}
          style={[styles.card, { padding: 20 }]}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="stretch"
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Drops</Text>
          </View>
          <View style={styles.twoCol}>
            <View>
              <Text style={styles.metaLabel}>Current Phase</Text>
              <Text style={styles.statValue}>
                {totalPoints != null
                  ? formatPoints(totalPoints)
                  : loading
                    ? "..."
                    : "--"}
              </Text>
            </View>
            <View style={styles.colRight}>
              <Text style={styles.metaLabel}>Your Rank</Text>
              <Text style={styles.statValue}>#--</Text>
            </View>
          </View>
          <Text style={styles.lastUpdated}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </ImageBackground>

        {/* ── Drops Stats ── */}
        <ImageBackground
          source={require("../../assets/dropsPoints.png")}
          style={[styles.card, { padding: 20 }]}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="stretch"
        >
          <Text style={styles.cardTitle}>Drops Stats</Text>
          <View style={[styles.twoCol, { marginTop: 8 }]}>
            <View>
              <Text style={styles.metaLabel}>Total Drops</Text>
              <Text style={styles.statValue}>--</Text>
            </View>
            <View style={styles.colRight}>
              <Text style={styles.metaLabel}>Active Users</Text>
              <Text style={styles.statValue}>--</Text>
            </View>
          </View>
          <Text style={styles.lastUpdated}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </ImageBackground>

        {/* ── Referrals ── */}
        <ImageBackground
          source={require("../../assets/referralPoint.png")}
          style={[styles.card, styles.referralCard, { padding: 20 }]}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="stretch"
        >
          <Text style={styles.cardTitle}>Referrals</Text>
          <Text style={styles.referralSubtitle}>
            Earn 20% bonus drops by inviting your friends
          </Text>
          <View style={styles.referralRow}>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>
                {referralCode ?? "..."}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <CopyIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, styles.iconBtnDark]}
              onPress={handleShareX}
              activeOpacity={0.7}
            >
              <XIcon />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* ── Drops Tier Info Modal ── */}
      <Modal
        visible={tierInfoVisible}
        transparent
        animationType="none"
        onRequestClose={() => setTierInfoVisible(false)}
      >
        <Pressable
          style={modalStyles.backdrop}
          onPress={() => setTierInfoVisible(false)}
        />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>What is Drops Tier?</Text>
          <Text style={modalStyles.body}>
            Your Drops Tier is a multiplier applied to the drops you earn based
            on your deposit amount and holding duration.
          </Text>
          <Text style={modalStyles.body}>
            A higher tier means more drops per dollar deposited. Keep your
            assets in the protocol longer to unlock higher tiers.
          </Text>
          <View style={modalStyles.tierRow}>
            <View style={modalStyles.tierBadge}>
              <Text style={modalStyles.tierBadgeLabel}>Current Tier</Text>
              <Text style={modalStyles.tierBadgeValue}>
                {dropsTier != null ? `${dropsTier}x` : "--"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={modalStyles.closeBtn}
            onPress={() => setTierInfoVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
  },

  // Card base
  card: {
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },

  // Active badge
  activeBadge: {
    backgroundColor: "#EDE8FB",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activeBadgeText: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#7F56D9",
  },

  // Two column layout
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  colRight: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#000000",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  lastUpdated: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
    marginTop: 8,
  },

  // Drops Tier card
  tierCard: {
    paddingVertical: 14,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tierLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierLabel: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#000000",
  },
  tierValue: {
    fontSize: 16,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#7F56D9",
  },

  // Referrals card

  referralSubtitle: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    marginTop: 3,
    marginBottom: 12,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  linkText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDark: {
    backgroundColor: "#FFFFFF",
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D6CFF0",
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  body: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 20,
  },
  tierRow: {
    alignItems: "flex-start",
    marginTop: 4,
  },
  tierBadge: {
    backgroundColor: "#EDE8FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  tierBadgeLabel: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#9B97A6",
  },
  tierBadgeValue: {
    fontSize: 22,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#7F56D9",
  },
  closeBtn: {
    backgroundColor: "#7F56D9",
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
});
