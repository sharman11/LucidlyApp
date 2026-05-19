import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

type Props = {
  // When true, the children periodically wiggle to invite a tap.
  active: boolean;
  children: React.ReactNode;
};

const WIGGLE_ANGLE = 9; // degrees
const STEP_MS = 80;
const PAUSE_MS = 2800;

// Wraps a tappable element and gives it a recurring, subtle wiggle while
// `active` — a low-key discovery hint. Stops cleanly the moment `active`
// turns false (e.g. once the user discovers the feature).
export function WiggleHint({ active, children }: Props) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rot.stopAnimation();
      rot.setValue(0);
      return;
    }

    let cancelled = false;
    const step = (toValue: number) =>
      Animated.timing(rot, {
        toValue,
        duration: STEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    const loop = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.delay(PAUSE_MS),
        step(1),
        step(-1),
        step(1),
        step(0),
      ]).start(({ finished }) => {
        if (finished && !cancelled) loop();
      });
    };
    loop();

    return () => {
      cancelled = true;
      rot.stopAnimation();
      rot.setValue(0);
    };
  }, [active, rot]);

  const rotate = rot.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${WIGGLE_ANGLE}deg`, `${WIGGLE_ANGLE}deg`],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      {children}
    </Animated.View>
  );
}
