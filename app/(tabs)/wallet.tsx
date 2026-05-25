import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";
import { Image } from "expo-image";
import { useAuth } from "@/context/auth";
import { API_BASE } from "@/constants/api";
import { fetchJSON } from "@/lib/fetch";
import { getDeviceId } from "@/lib/device-id";
import { useQueries } from "@tanstack/react-query";

// ─── Wallet Avatar ───────────────────────────────────────────────────────────

function WalletAvatar({ address }: { address: string }) {
  const size = 40;
  const grid = 5;
  const cell = size / grid;
  const seed = address.toLowerCase().replace("0x", "");
  const color = `#${seed.slice(0, 6)}`;
  const bg = `#${seed.slice(6, 12)}`;
  const cells = Array.from({ length: grid * grid }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return charCode % 3 !== 0;
  });
  return (
    <View style={{ borderRadius: 12, overflow: "hidden" }}>
      <Svg width={size} height={size}>
        <Rect width={size} height={size} fill={bg} rx={8} />
        {cells.map((filled, i) => {
          if (!filled) return null;
          const col = i % grid;
          const row = Math.floor(i / grid);
          return (
            <Rect
              key={i}
              x={col * cell}
              y={row * cell}
              width={cell}
              height={cell}
              fill={color}
            />
          );
        })}
      </Svg>
    </View>
  );
}

function TrashIcon() {
  return (
    <Image
      source={require("../../assets/delete.svg")}
      style={{ width: 20, height: 20 }}
      contentFit="contain"
    />
  );
}

// ─── Swipeable Wallet Card ───────────────────────────────────────────────────

const SWIPE_THRESHOLD = -70;
const DELETE_ACTION_WIDTH = 70;

function SwipeableCard({
  wallet,
  isActive,
  balance,
  onPress,
  onLongPress,
  onRequestDelete,
  entranceDelay,
}: {
  wallet: { walletId: string; name: string };
  isActive: boolean;
  balance: string | null;
  onPress: () => void;
  onLongPress: () => void;
  onRequestDelete: () => void;
  entranceDelay: number;
}) {
  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  // Active dot scale
  const dotScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(dotScale, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, entranceDelay);
    return () => clearTimeout(timer);
  }, [entranceDelay]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const target = isOpen.current ? g.dx - DELETE_ACTION_WIDTH : g.dx;
        const clamped = Math.min(0, Math.max(-DELETE_ACTION_WIDTH - 20, target));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const current = isOpen.current ? g.dx - DELETE_ACTION_WIDTH : g.dx;
        if (current < SWIPE_THRESHOLD) {
          isOpen.current = true;
          Animated.spring(translateX, {
            toValue: -DELETE_ACTION_WIDTH,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        } else {
          isOpen.current = false;
          Animated.spring(translateX, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const handleDelete = () => {
    // Snap closed, then ask parent to show confirmation
    isOpen.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
    onRequestDelete();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={cardStyles.swipeContainer}>
        {/* Delete action behind */}
        <TouchableOpacity
          style={cardStyles.deleteAction}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <TrashIcon />
        </TouchableOpacity>

        {/* Card on top */}
        <Animated.View
          style={{ transform: [{ translateX }] }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity activeOpacity={0.8} onPress={onPress} onLongPress={onLongPress}>
            <ImageBackground
              source={require("../../assets/walletBG.png")}
              style={cardStyles.card}
              imageStyle={cardStyles.cardImage}
              resizeMode="stretch"
            >
              <View style={cardStyles.avatarWrapper}>
                <WalletAvatar address={wallet.walletId} />
                <Animated.View
                  style={[
                    cardStyles.activeDot,
                    {
                      transform: [{ scale: dotScale }],
                      opacity: dotScale,
                    },
                  ]}
                />
              </View>
              <View style={cardStyles.cardInfo}>
                <Text style={cardStyles.cardName}>{wallet.name}</Text>
                <Text style={cardStyles.cardAddress}>
                  {wallet.walletId.slice(0, 6)}...{wallet.walletId.slice(-4)}
                </Text>
              </View>
              {balance != null && (
                <Text style={cardStyles.cardBalance}>{balance}</Text>
              )}
            </ImageBackground>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "#F4F0FF",
  },
  cardImage: {
    borderRadius: 16,
  },
  avatarWrapper: {
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#000000",
  },
  cardAddress: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  cardBalance: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#000000",
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { wallets, activeWalletId, setActiveWallet, removeWallet, renameWallet } = useAuth();

  // Per-wallet balance queries — same key as portfolio.tsx so cache is shared.
  const balanceQueries = useQueries({
    queries: wallets.map((w) => ({
      queryKey: ["portfolio", w.walletId] as const,
      queryFn: async ({ signal }: { signal?: AbortSignal }) => {
        const deviceId = await getDeviceId();
        const json = await fetchJSON<{
          portfolio?: { ticker: string; balance: number }[];
        }>(
          `${API_BASE}/mobile/user/wallet/portfolio?device_id=${deviceId}&wallet_address=${w.walletId}`,
          { signal },
        );
        return json?.portfolio ?? [];
      },
    })),
  });

  const balances: Record<string, number> = {};
  wallets.forEach((w, i) => {
    const entries = balanceQueries[i]?.data;
    const all = entries?.find((p) => p.ticker === "all");
    if (all) balances[w.walletId] = all.balance;
  });

  // Bottom sheet confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ walletId: string; name: string } | null>(null);
  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;

  const openDeleteSheet = (wallet: { walletId: string; name: string }) => {
    setDeleteTarget(wallet);
    sheetY.setValue(300);
    sheetBackdrop.setValue(0);
    Animated.parallel([
      Animated.spring(sheetY, { toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true }),
      Animated.timing(sheetBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDeleteSheet = () => {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 300, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(sheetBackdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDeleteTarget(null));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.walletId;
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 300, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(sheetBackdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setDeleteTarget(null);
      removeWallet(id);
    });
  };

  // Rename bottom sheet
  const [renameTarget, setRenameTarget] = useState<{ walletId: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const renameY = useRef(new Animated.Value(300)).current;
  const renameBackdrop = useRef(new Animated.Value(0)).current;

  const openRenameSheet = (wallet: { walletId: string; name: string }) => {
    setRenameTarget(wallet);
    setRenameName(wallet.name);
    renameY.setValue(300);
    renameBackdrop.setValue(0);
    Animated.parallel([
      Animated.spring(renameY, { toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true }),
      Animated.timing(renameBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeRenameSheet = () => {
    Animated.parallel([
      Animated.timing(renameY, { toValue: 300, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(renameBackdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setRenameTarget(null));
  };

  const confirmRename = () => {
    if (!renameTarget || !renameName.trim()) return;
    renameWallet(renameTarget.walletId, renameName.trim());
    closeRenameSheet();
  };

  const formatBalance = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your wallets</Text>
        <TouchableOpacity
          onPress={() => router.navigate("/login")}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Add Wallet</Text>
        </TouchableOpacity>
      </View>

      {wallets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No wallets added</Text>
          <Text style={styles.emptySubtitle}>
            Add a wallet to track your deposits and yields.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.navigate("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Add Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {wallets.map((wallet, index) => {
            const isActive = wallet.walletId === activeWalletId;
            const bal = balances[wallet.walletId];
            return (
              <SwipeableCard
                key={wallet.walletId}
                wallet={wallet}
                isActive={isActive}
                balance={bal != null ? formatBalance(bal) : null}
                onPress={() => setActiveWallet(wallet.walletId)}
                onLongPress={() => openRenameSheet(wallet)}
                onRequestDelete={() => openDeleteSheet(wallet)}
                entranceDelay={index * 100}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Delete Confirmation Bottom Sheet */}
      <Modal
        visible={deleteTarget != null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeDeleteSheet}
      >
        <TouchableWithoutFeedback onPress={closeDeleteSheet}>
          <Animated.View style={[sheetStyles.backdrop, { opacity: sheetBackdrop }]} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            sheetStyles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 16, transform: [{ translateY: sheetY }] },
          ]}
        >
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.title}>Remove Wallet</Text>
          <Text style={sheetStyles.body}>
            Remove “{deleteTarget?.name}” from your wallets? You can always add it back later.
          </Text>
          {deleteTarget && (
            <View style={sheetStyles.walletPreview}>
              <WalletAvatar address={deleteTarget.walletId} />
              <View style={sheetStyles.walletPreviewInfo}>
                <Text style={sheetStyles.walletPreviewName}>{deleteTarget.name}</Text>
                <Text style={sheetStyles.walletPreviewAddr}>
                  {deleteTarget.walletId.slice(0, 6)}...{deleteTarget.walletId.slice(-4)}
                </Text>
              </View>
            </View>
          )}
          <View style={sheetStyles.actions}>
            <TouchableOpacity style={sheetStyles.cancelBtn} onPress={closeDeleteSheet} activeOpacity={0.8}>
              <Text style={sheetStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheetStyles.removeBtn} onPress={confirmDelete} activeOpacity={0.8}>
              <Text style={sheetStyles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* Rename Bottom Sheet */}
      <Modal
        visible={renameTarget != null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeRenameSheet}
      >
        <TouchableWithoutFeedback onPress={closeRenameSheet}>
          <Animated.View style={[sheetStyles.backdrop, { opacity: renameBackdrop }]} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ justifyContent: "flex-end" }}
        >
          <Animated.View
            style={[
              sheetStyles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 16, transform: [{ translateY: renameY }] },
            ]}
          >
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Rename Wallet</Text>
            <TextInput
              style={sheetStyles.renameInput}
              value={renameName}
              onChangeText={setRenameName}
              placeholder="Wallet nickname"
              placeholderTextColor="#7A7880"
              autoFocus
            />
            <View style={sheetStyles.actions}>
              <TouchableOpacity style={sheetStyles.cancelBtn} onPress={closeRenameSheet} activeOpacity={0.8}>
                <Text style={sheetStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sheetStyles.saveBtn, !renameName.trim() && { opacity: 0.5 }]}
                onPress={confirmRename}
                activeOpacity={0.8}
                disabled={!renameName.trim()}
              >
                <Text style={sheetStyles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#7F56D9",
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 120,
    width: "100%",
    maxWidth: 398,
    alignSelf: "center",
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
    marginBottom: 4,
  },
  emptyButton: {
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D6CFF0",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 20,
    marginBottom: 16,
  },
  walletPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F0FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2D9F9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  walletPreviewInfo: {
    flex: 1,
    gap: 1,
  },
  walletPreviewName: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#000000",
  },
  walletPreviewAddr: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
  },
  removeBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
  },
  removeText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
  renameInput: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#000000",
    backgroundColor: "#F4F0FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2D9F9",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#7F56D9",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
});
