import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      router.replace("/enter-app");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        <Svg width={72} height={72} viewBox="0 0 74 74" fill="none">
          <Path
            d="M67.6113 57.7871C60.9535 67.5725 49.7279 74 37 74C24.2721 74 13.0465 67.5725 6.38867 57.7871H67.6113ZM72.3057 25.9004C73.4062 29.4044 74 33.1328 74 37C74 41.1921 73.3013 45.2208 72.0166 48.9775H1.9834C0.698707 45.2208 0 41.1921 0 37C3.90158e-07 33.1328 0.593822 29.4044 1.69434 25.9004H72.3057ZM37 0C50.1054 7.93319e-06 61.6189 6.81384 68.1924 17.0918H5.80762C12.3811 6.81384 23.8946 0 37 0Z"
            fill="black"
          />
        </Svg>
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
});
