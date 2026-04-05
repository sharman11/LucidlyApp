import { Image } from "expo-image";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function EnterAppScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Illustration — full width, height driven by SVG aspect ratio 375:481 */}
      <Image
        source={require("../assets/Enter.svg")}
        style={styles.illustration}
        contentFit="cover"
      />

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.heading}>{"Your Portfolio\nFully Transparent"}</Text>
        <Text style={styles.subheading}>
          View all deposits, yields, and wallet activity in one clear dashboard
        </Text>
      </View>

      <View style={styles.spacer} />

      {/* Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.buttonOuter}>
          <View style={[StyleSheet.absoluteFillObject, styles.buttonShadowDark]} />
          <View style={[StyleSheet.absoluteFillObject, styles.buttonShadowLight]} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(tabs)/yields")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonLabel}>Enter Lucidly App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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

  // box-shadow: 4px 4px 5px rgba(0,0,0,0.05), -4px -4px 5px #FFFFFF
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
