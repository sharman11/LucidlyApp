import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AUTO_DISMISS_MS } from "@/constants/api";

function CheckIcon() {
  return (
    <Svg width="44" height="44" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="24" fill="#D1FAE5" />
      <Path
        d="M14 24L21 31L34 17"
        stroke="#22C55E"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function WalletSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { address, name } = useLocalSearchParams<{
    address: string;
    name: string;
  }>();

  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // Slide-up animation
  const slideY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const hasNavigated = useRef(false);

  const dismiss = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 300,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace("/(tabs)/portfolio");
    });
  };

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        damping: 20,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.content}>
          <CheckIcon />
          <Text style={styles.title}>Wallet Added</Text>
          <Text style={styles.subtitle}>
            Your wallet has been successfully linked to Lucidly.
          </Text>

          {/* Wallet summary */}
          {address ? (
            <View style={styles.walletSummary}>
              <View style={styles.walletDot} />
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{name ?? "Wallet"}</Text>
                <Text style={styles.walletAddress}>{truncated}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={dismiss}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Go to Portfolio</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
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
  content: {
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    textAlign: "center",
    lineHeight: 20,
  },

  // Wallet summary card
  walletSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F0FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2D9F9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    alignSelf: "stretch",
    marginTop: 6,
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  walletInfo: {
    flex: 1,
    gap: 1,
  },
  walletName: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#000000",
  },
  walletAddress: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
  },

  // Button
  button: {
    backgroundColor: "#7F56D9",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
});
