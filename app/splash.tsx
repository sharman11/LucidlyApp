import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useAuth } from "@/context/auth";
import { MIN_SPLASH_MS, MAX_SPLASH_MS } from "@/constants/api";

// Frame 0 is the base Lucidly logo (always shown first); 1-19 are the
// stylized "morphism" variants, cross-faded in a random-start loop.
const LOGO_FRAMES = [
  require("../assets/sequence/Base.png"),
  require("../assets/sequence/Logo-01.png"),
  require("../assets/sequence/Logo-02.png"),
  require("../assets/sequence/Logo-03.png"),
  require("../assets/sequence/Logo-04.png"),
  require("../assets/sequence/Logo-05.png"),
  require("../assets/sequence/Logo-06.png"),
  require("../assets/sequence/Logo-07.png"),
  require("../assets/sequence/Logo-08.png"),
  require("../assets/sequence/Logo-09.png"),
  require("../assets/sequence/Logo-10.png"),
  require("../assets/sequence/Logo-11.png"),
  require("../assets/sequence/Logo-12.png"),
  require("../assets/sequence/Logo-13.png"),
  require("../assets/sequence/Logo-14.png"),
  require("../assets/sequence/Logo-15.png"),
  require("../assets/sequence/Logo-16.png"),
  require("../assets/sequence/Logo-17.png"),
  require("../assets/sequence/Logo-18.png"),
  require("../assets/sequence/Logo-19.png"),
];

const LOGO_SIZE = 150;
const HOLD_MS = 400; // time each style holds before cross-fading
const FADE_MS = 220; // cross-fade duration

// Cycles the logo styles. Always opens on the base logo (index 0), then
// cross-fades through the 19 styles in a fresh random order — a shuffled
// "bag" so every style shows once per pass with no repeats, reshuffled each
// pass — never returning to the base.
function LogoCycler() {
  const opacities = useRef(
    LOGO_FRAMES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let current = 0;
    const lastStyle = LOGO_FRAMES.length - 1; // 19

    // Shuffled bag of style indices (1-19): every style plays once per pass,
    // in a fresh random order each pass.
    let bag: number[] = [];
    const shuffledBag = () => {
      const arr = Array.from({ length: lastStyle }, (_, i) => i + 1);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const pickNext = (cur: number) => {
      if (bag.length === 0) {
        bag = shuffledBag();
        // Avoid repeating the style just shown across a reshuffle.
        if (bag[0] === cur && bag.length > 1) {
          [bag[0], bag[1]] = [bag[1], bag[0]];
        }
      }
      return bag.shift() as number;
    };

    const step = () => {
      if (cancelled) return;
      const next = pickNext(current);
      Animated.parallel([
        Animated.timing(opacities[current], {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacities[next], {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      current = next;
      timer = setTimeout(step, HOLD_MS);
    };

    timer = setTimeout(step, HOLD_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [opacities]);

  return (
    <View style={styles.logoBox}>
      {LOGO_FRAMES.map((src, i) => (
        <Animated.View
          key={i}
          style={[StyleSheet.absoluteFill, { opacity: opacities[i] }]}
        >
          <Image source={src} style={styles.logoImage} contentFit="contain" />
        </Animated.View>
      ))}
    </View>
  );
}

export default function SplashScreen() {
  const { ready } = useAuth();

  // Entrance animations
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  // Exit burst
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  const mountedAt = useRef(Date.now()).current;
  const hasNavigated = useRef(false);

  // Entrance: fade + scale in
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigate when auth is ready (or after max timeout)
  useEffect(() => {
    if (hasNavigated.current) return;

    const navigate = () => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      // Always land on the main Yields screen. The bottom-nav Wallet tab
      // funnels users without a linked wallet to /login on demand.
      Animated.parallel([
        Animated.timing(exitScale, {
          toValue: 1.6,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace("/(tabs)/yields");
      });
    };

    // If auth loaded, wait until at least MIN_SPLASH_MS has passed
    if (ready) {
      const elapsed = Date.now() - mountedAt;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      const timer = setTimeout(navigate, remaining);
      return () => clearTimeout(timer);
    }

    // Safety: don't wait forever — navigate after MAX_SPLASH_MS
    const fallback = setTimeout(navigate, MAX_SPLASH_MS);
    return () => clearTimeout(fallback);
  }, [ready]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: Animated.multiply(opacity, exitOpacity),
          transform: [{ scale: Animated.multiply(scale, exitScale) }],
        }}
      >
        <LogoCycler />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
