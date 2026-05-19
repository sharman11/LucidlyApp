import { useEffect, useRef } from "react";
import { Image } from "expo-image";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function EnterAppScreen() {
  const insets = useSafeAreaInsets();
  const { wallets } = useAuth();

  // Staggered entrance
  const illustrationY = useRef(new Animated.Value(-30)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(24)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(32)).current;

  // Floating bob for illustration
  const floatY = useRef(new Animated.Value(0)).current;
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Exit transition
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance: illustration → text → button
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(illustrationOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(illustrationY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Start floating bob after entrance
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      floatLoopRef.current = loop;
    });

    return () => {
      floatLoopRef.current?.stop();
    };
  }, []);

  const handleEnter = () => {
    const destination =
      wallets.length > 0 ? "/(tabs)/yields" : "/(tabs)/yields";

    // Exit: fade out + slide down
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenY, {
        toValue: 40,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace(destination);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ translateY: screenY }],
        },
      ]}
    >
      {/* Illustration — floating bob */}
      <Animated.View
        style={{
          opacity: illustrationOpacity,
          transform: [
            { translateY: Animated.add(illustrationY, floatY) },
          ],
        }}
      >
        <Image
          source={require("../assets/Enter.svg")}
          style={styles.illustration}
          contentFit="cover"
        />
      </Animated.View>

      {/* Text block */}
      <Animated.View
        style={[
          styles.textBlock,
          {
            opacity: textOpacity,
            transform: [{ translateY: textY }],
          },
        ]}
      >
        <Text style={styles.heading}>{"Your Portfolio\nFully Transparent"}</Text>
        <Text style={styles.subheading}>
          View all deposits, yields, and wallet activity in one clear dashboard
        </Text>
      </Animated.View>

      <View style={styles.spacer} />

      {/* Button */}
      <Animated.View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 24,
            opacity: buttonOpacity,
            transform: [{ translateY: buttonY }],
          },
        ]}
      >
        <View style={styles.buttonOuter}>
          <View style={[StyleSheet.absoluteFillObject, styles.buttonShadowDark]} />
          <View style={[StyleSheet.absoluteFillObject, styles.buttonShadowLight]} />
          <TouchableOpacity
            style={styles.button}
            onPress={handleEnter}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonLabel}>Enter Lucidly App</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },
  illustration: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (481 / 375),
  },
  textBlock: {
    paddingHorizontal: 16,
    paddingTop: 28,
    gap: 12,
  },
  heading: {
    fontSize: 30,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    textAlign: "center",
    lineHeight: 38,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    textAlign: "center",
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
  },
  buttonOuter: {
    borderRadius: 100,
  },
  buttonShadowDark: {
    borderRadius: 100,
    backgroundColor: "#E2D9F9",
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  buttonShadowLight: {
    borderRadius: 100,
    backgroundColor: "#E2D9F9",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  button: {
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
    letterSpacing: 0.2,
  },
});
