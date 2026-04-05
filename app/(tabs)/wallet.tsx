import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";
import { Image } from "expo-image";
import { ImageBackground } from "react-native";
import { useAuth } from "@/context/auth";

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

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { wallets, activeWalletId, setActiveWallet, removeWallet } = useAuth();

  const handleDelete = (walletId: string, name: string) => {
    Alert.alert("Remove Wallet", `Remove "${name}" from your wallets?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeWallet(walletId),
      },
    ]);
  };

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

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {wallets.map((wallet) => {
          const isActive = wallet.walletId === activeWalletId;
          return (
            <TouchableOpacity
              key={wallet.walletId}
              activeOpacity={0.8}
              onPress={() => setActiveWallet(wallet.walletId)}
            >
              <ImageBackground
                source={require("../../assets/walletBG.png")}
                style={styles.card}
                imageStyle={styles.cardImage}
                resizeMode="stretch"
              >
                <View style={styles.avatarWrapper}>
                  <WalletAvatar address={wallet.walletId} />
                  {isActive && <View style={styles.activeDot} />}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{wallet.name}</Text>
                  <Text style={styles.cardAddress}>
                    {wallet.walletId.slice(0, 6)}...{wallet.walletId.slice(-4)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(wallet.walletId, wallet.name)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <TrashIcon />
                </TouchableOpacity>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
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
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    overflow: "hidden",
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
  deleteBtn: {
    padding: 4,
  },
});
