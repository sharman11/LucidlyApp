import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  baseColor?: string;
  highlightColor?: string;
  /** Pause the shimmer (e.g. when the parent is not visible). Defaults false. */
  paused?: boolean;
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
  baseColor = "#D6CFF0",
  highlightColor = "rgba(255,255,255,0.7)",
  paused = false,
}: Props) {
  const translate = useRef(new Animated.Value(0)).current;
  const [boxW, setBoxW] = useState<number>(typeof width === "number" ? width : 0);

  useEffect(() => {
    if (paused) return;
    translate.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [paused, translate]);

  const shimmerWidth = Math.max(boxW * 0.7, 60);
  const translateX = translate.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth, boxW],
  });

  return (
    <View
      onLayout={(e) => {
        if (typeof width !== "number") {
          setBoxW(e.nativeEvent.layout.width);
        }
      }}
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {boxW > 0 ? (
        <AnimatedLinearGradient
          colors={["transparent", highlightColor, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            StyleSheet.absoluteFillObject,
            {
              width: shimmerWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}
