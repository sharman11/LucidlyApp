import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const slideY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable` can be null on first emit; treat as connected
      // until we have a definite false.
      const reachable =
        state.isInternetReachable === null ? true : state.isInternetReachable;
      setOffline(!(state.isConnected && reachable));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(slideY, {
      toValue: offline ? 0 : -80,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [offline, slideY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top + 8, transform: [{ translateY: slideY }] },
      ]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EF4444",
    paddingBottom: 8,
    alignItems: "center",
    zIndex: 999,
  },
  text: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
});
