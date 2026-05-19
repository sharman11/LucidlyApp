import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image, type ImageSource } from "expo-image";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

type Props = {
  visible: boolean;
  icon: ImageSource | number | null;
  accent?: string;
  onClose: () => void;
};

const DEFAULT_ACCENT = "#7F56D9";

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(127, 86, 217, ${alpha})`;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const WIDGET = 280;
const ICON = 64;
const BEARING_R = 34;
const BEARING_WELL_R = 28;
const PREVIEW_TILE = 52;
const PREVIEW_INNER = 36;

// ─── Persistence ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "@lucidly/spinner-design";
const DESIGNS = ["hex", "propeller", "gear", "rays"] as const;
type DesignId = (typeof DESIGNS)[number];
const DEFAULT_DESIGN: DesignId = "hex";
const DESIGN_LABELS: Record<DesignId, string> = {
  hex: "Hex",
  propeller: "Lobes",
  gear: "Gear",
  rays: "Rays",
};

function useDesignId(): [DesignId, (id: DesignId) => void] {
  const [id, setId] = useState<DesignId>(DEFAULT_DESIGN);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && (DESIGNS as readonly string[]).includes(stored)) {
          setId(stored as DesignId);
        }
      })
      .catch(() => {});
  }, []);

  const updateId = useCallback((newId: DesignId) => {
    setId(newId);
    AsyncStorage.setItem(STORAGE_KEY, newId).catch(() => {});
  }, []);

  return [id, updateId];
}

// ─── Personal-best persistence ───────────────────────────────────────────────
const STATS_KEY = "@lucidly/spinner-stats";
type SpinStats = { topRpm: number; longestMs: number };
const EMPTY_STATS: SpinStats = { topRpm: 0, longestMs: 0 };

async function loadStats(): Promise<SpinStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw);
    return {
      topRpm: Number(parsed?.topRpm) || 0,
      longestMs: Number(parsed?.longestMs) || 0,
    };
  } catch {
    return EMPTY_STATS;
  }
}

function saveStats(stats: SpinStats): void {
  AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats)).catch(() => {});
}

// ─── Geometry helpers ────────────────────────────────────────────────────────
function pointsAtAngles(
  cx: number,
  cy: number,
  r: number,
  count: number,
  startAngle = -Math.PI / 2,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const a = startAngle + (i * 2 * Math.PI) / count;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function regularPolygonPoints(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  startAngle = -Math.PI / 2,
): string {
  return pointsAtAngles(cx, cy, r, sides, startAngle)
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function gearPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  teeth: number,
): string {
  const pts: string[] = [];
  const n = teeth * 2;
  for (let i = 0; i < n; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI * 2) / n - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

// ─── Design bodies ───────────────────────────────────────────────────────────

type BodyProps = { accent: string };

function HexBody({ accent }: BodyProps) {
  const HEX_R = 82;
  const NODE_R = 9;
  const NODE_INNER_R = 4;
  const INNER_HEX_DIST = 40;
  const INNER_HEX_SIZE = 9;
  const vertices = pointsAtAngles(100, 100, HEX_R, 6);
  const hexPoints = vertices.map(([x, y]) => `${x},${y}`).join(" ");
  const innerCenters = pointsAtAngles(100, 100, INNER_HEX_DIST, 3);

  return (
    <>
      <Circle cx="100" cy="100" r={96} fill="rgba(0,0,0,0.12)" />
      {vertices.slice(0, 3).map(([vx, vy], i) => {
        const [ox, oy] = vertices[(i + 3) % 6];
        return (
          <Line
            key={`mesh-${i}`}
            x1={vx}
            y1={vy}
            x2={ox}
            y2={oy}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
          />
        );
      })}
      <Polygon
        points={hexPoints}
        fill="rgba(255,255,255,0.06)"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {vertices.map(([vx, vy], i) => (
        <Circle key={`node-${i}`} cx={vx} cy={vy} r={NODE_R} fill="#FFFFFF" />
      ))}
      {vertices.map(([vx, vy], i) => (
        <Circle
          key={`node-i-${i}`}
          cx={vx}
          cy={vy}
          r={NODE_INNER_R}
          fill={accent}
        />
      ))}
      {innerCenters.map(([cx, cy], i) => (
        <Polygon
          key={`mini-${i}`}
          points={regularPolygonPoints(cx, cy, INNER_HEX_SIZE, 6)}
          fill="rgba(255,255,255,0.85)"
          stroke={hexToRgba(accent, 0.55)}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

function PropellerBody({ accent }: BodyProps) {
  const LOBE_DIST = 60;
  const LOBE_R = 30;
  const ARM_W = 26;
  const lobes = pointsAtAngles(100, 100, LOBE_DIST, 3);

  return (
    <>
      <Circle cx="100" cy="100" r={92} fill="rgba(0,0,0,0.12)" />
      {lobes.map(([lx, ly], i) => (
        <Line
          key={`arm-${i}`}
          x1="100"
          y1="100"
          x2={lx}
          y2={ly}
          stroke="#FFFFFF"
          strokeWidth={ARM_W}
          strokeLinecap="round"
        />
      ))}
      {lobes.map(([lx, ly], i) => (
        <Circle key={`lobe-${i}`} cx={lx} cy={ly} r={LOBE_R} fill="#FFFFFF" />
      ))}
      {lobes.map(([lx, ly], i) => (
        <Circle
          key={`w-${i}`}
          cx={lx}
          cy={ly}
          r={11}
          fill={hexToRgba(accent, 0.22)}
        />
      ))}
      {lobes.map(([lx, ly], i) => (
        <Circle key={`w-i-${i}`} cx={lx} cy={ly} r={5} fill={accent} />
      ))}
    </>
  );
}

function GearBody({ accent }: BodyProps) {
  const OUTER_R = 84;
  const INNER_R = 72;
  const HUB_R = 46;
  const HUB_INNER_R = 38;
  const TEETH = 12;
  const spokes = pointsAtAngles(100, 100, INNER_R - 4, 4, -Math.PI / 4);

  return (
    <>
      <Circle cx="100" cy="100" r={94} fill="rgba(0,0,0,0.12)" />
      <Polygon
        points={gearPoints(100, 100, OUTER_R, INNER_R, TEETH)}
        fill="#FFFFFF"
        stroke={hexToRgba(accent, 0.4)}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Circle
        cx="100"
        cy="100"
        r={INNER_R - 8}
        fill={hexToRgba(accent, 0.16)}
      />
      {/* Spokes connecting hub to gear ring */}
      {spokes.map(([sx, sy], i) => (
        <Line
          key={`spoke-${i}`}
          x1={100}
          y1={100}
          x2={sx}
          y2={sy}
          stroke="#FFFFFF"
          strokeWidth={10}
          strokeLinecap="round"
        />
      ))}
      {/* Hub */}
      <Circle cx="100" cy="100" r={HUB_R} fill="#FFFFFF" />
      <Circle
        cx="100"
        cy="100"
        r={HUB_INNER_R}
        fill={hexToRgba(accent, 0.2)}
      />
    </>
  );
}

function RaysBody({ accent }: BodyProps) {
  const OUTER_R = 90;
  const INNER_R = 38;
  const HALF_W = 0.09; // half-angle (radians) at base of each ray
  const longCount = 8;

  // Long tapered rays
  const longRays: Array<{ tip: [number, number]; left: [number, number]; right: [number, number] }> = [];
  for (let i = 0; i < longCount; i++) {
    const a = (i * 2 * Math.PI) / longCount - Math.PI / 2;
    longRays.push({
      tip: [100 + OUTER_R * Math.cos(a), 100 + OUTER_R * Math.sin(a)],
      left: [
        100 + INNER_R * Math.cos(a - HALF_W),
        100 + INNER_R * Math.sin(a - HALF_W),
      ],
      right: [
        100 + INNER_R * Math.cos(a + HALF_W),
        100 + INNER_R * Math.sin(a + HALF_W),
      ],
    });
  }

  // Short rays offset 22.5° between long ones
  const shortRays: Array<{ tip: [number, number]; left: [number, number]; right: [number, number] }> = [];
  for (let i = 0; i < longCount; i++) {
    const a =
      (i * 2 * Math.PI) / longCount + Math.PI / longCount - Math.PI / 2;
    const shortOuter = OUTER_R - 22;
    const shortInner = INNER_R + 4;
    shortRays.push({
      tip: [100 + shortOuter * Math.cos(a), 100 + shortOuter * Math.sin(a)],
      left: [
        100 + shortInner * Math.cos(a - HALF_W * 0.7),
        100 + shortInner * Math.sin(a - HALF_W * 0.7),
      ],
      right: [
        100 + shortInner * Math.cos(a + HALF_W * 0.7),
        100 + shortInner * Math.sin(a + HALF_W * 0.7),
      ],
    });
  }

  return (
    <>
      <Circle cx="100" cy="100" r={96} fill="rgba(0,0,0,0.12)" />
      {longRays.map((r, i) => (
        <Polygon
          key={`long-${i}`}
          points={`${r.tip[0]},${r.tip[1]} ${r.left[0]},${r.left[1]} ${r.right[0]},${r.right[1]}`}
          fill="#FFFFFF"
        />
      ))}
      {shortRays.map((r, i) => (
        <Polygon
          key={`short-${i}`}
          points={`${r.tip[0]},${r.tip[1]} ${r.left[0]},${r.left[1]} ${r.right[0]},${r.right[1]}`}
          fill="rgba(255,255,255,0.6)"
        />
      ))}
      <Circle
        cx="100"
        cy="100"
        r={INNER_R - 2}
        fill={hexToRgba(accent, 0.12)}
      />
    </>
  );
}

// ─── Friction / spin constants ───────────────────────────────────────────────
const FRICTION_PER_SEC = 1.4;
const MIN_ANG_VEL = 0.05;
const INITIAL_FLICK_VEL = 5.5;

// ─── Feedback tuning ─────────────────────────────────────────────────────────
const SPEED_CAP = 250; // rad/s — hard ceiling (~2390 RPM); blocks glitch spikes
const GLOW_FULL_SPEED = 35; // rad/s at which the glow + smear hit full intensity
const HAPTIC_TICK_MS = 50; // min gap between ratchet haptic ticks
const RPM_UPDATE_MS = 90; // throttle for the live RPM readout

function radPerSecToRpm(radPerSec: number): number {
  return (radPerSec / (2 * Math.PI)) * 60;
}

// ─── Main component ──────────────────────────────────────────────────────────
export function SpinningLogoEgg({
  visible,
  icon,
  accent,
  onClose,
}: Props) {
  const [designId, setDesignId] = useDesignId();
  const accentColor = accent ?? DEFAULT_ACCENT;

  const rotationRad = useRef(0);
  const angVel = useRef(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  // Normalized 0..1 spin speed — drives the glow + motion-smear visuals.
  const speedAnim = useRef(new Animated.Value(0)).current;
  const rafRef = useRef<number | null>(null);
  const lastTime = useRef(0);
  const lastAngle = useRef(0);
  const widgetCenter = useRef({ x: WIDGET / 2, y: WIDGET / 2 });

  // Live RPM readout + personal-best tracking
  const [rpm, setRpm] = useState(0);
  const [stats, setStats] = useState<SpinStats>(EMPTY_STATS);
  const lastRpmUpdate = useRef(0);
  const lastTickRev = useRef(0);
  const lastTickTime = useRef(0);
  const spinStart = useRef(0);
  const spinPeakRpm = useRef(0);

  // Each animation frame: refresh speed visuals, fire ratchet haptics, and
  // throttle the RPM readout. Called from both the decay loop and dragging.
  const applyMotion = (now: number) => {
    const speed = Math.min(Math.abs(angVel.current), SPEED_CAP);
    speedAnim.setValue(Math.min(speed / GLOW_FULL_SPEED, 1));

    // Ratchet haptic — one throttled tick per full revolution.
    const rev = Math.floor(rotationRad.current / (2 * Math.PI));
    if (rev !== lastTickRev.current) {
      lastTickRev.current = rev;
      if (speed > MIN_ANG_VEL && now - lastTickTime.current > HAPTIC_TICK_MS) {
        lastTickTime.current = now;
        Haptics.selectionAsync().catch(() => {});
      }
    }

    const currentRpm = radPerSecToRpm(speed);
    if (currentRpm > spinPeakRpm.current) spinPeakRpm.current = currentRpm;
    if (now - lastRpmUpdate.current > RPM_UPDATE_MS) {
      lastRpmUpdate.current = now;
      setRpm(currentRpm);
    }
  };

  // Settle a finished spin into the personal-best record.
  const finalizeSpin = () => {
    const durationMs = Date.now() - spinStart.current;
    const peak = spinPeakRpm.current;
    setStats((prev) => {
      const next: SpinStats = {
        topRpm: Math.max(prev.topRpm, peak),
        longestMs: Math.max(prev.longestMs, durationMs),
      };
      if (next.topRpm !== prev.topRpm || next.longestMs !== prev.longestMs) {
        saveStats(next);
      }
      return next;
    });
    setRpm(0);
  };

  const cancelRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startDecay = () => {
    cancelRaf();
    lastTime.current = Date.now();
    spinStart.current = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime.current) / 1000, 0.05);
      lastTime.current = now;
      rotationRad.current += angVel.current * dt;
      angVel.current *= Math.exp(-FRICTION_PER_SEC * dt);
      rotationAnim.setValue(rotationRad.current);
      applyMotion(now);
      if (Math.abs(angVel.current) > MIN_ANG_VEL) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        angVel.current = 0;
        rafRef.current = null;
        speedAnim.setValue(0);
        finalizeSpin();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Load the saved personal best once.
  useEffect(() => {
    loadStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible) {
      scale.setValue(0);
      cancelRaf();
      angVel.current = 0;
      rotationRad.current = 0;
      rotationAnim.setValue(0);
      speedAnim.setValue(0);
      setRpm(0);
      return;
    }
    scale.setValue(0.4);
    Animated.spring(scale, {
      toValue: 1,
      damping: 12,
      stiffness: 140,
      useNativeDriver: true,
    }).start();
    spinPeakRpm.current = 0;
    angVel.current = INITIAL_FLICK_VEL;
    startDecay();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    return () => cancelRaf();
  }, [visible, scale, rotationAnim, speedAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        cancelRaf();
        const { locationX, locationY } = e.nativeEvent;
        lastAngle.current = Math.atan2(
          locationY - widgetCenter.current.y,
          locationX - widgetCenter.current.x,
        );
        lastTime.current = Date.now();
        angVel.current = 0;
        spinPeakRpm.current = 0;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const ang = Math.atan2(
          locationY - widgetCenter.current.y,
          locationX - widgetCenter.current.x,
        );
        let delta = ang - lastAngle.current;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        const now = Date.now();
        const dt = Math.max((now - lastTime.current) / 1000, 0.001);
        // Clamp to the hard ceiling so a jittery single sample can't spike.
        angVel.current = Math.max(-SPEED_CAP, Math.min(delta / dt, SPEED_CAP));
        rotationRad.current += delta;
        rotationAnim.setValue(rotationRad.current);
        applyMotion(now);
        lastAngle.current = ang;
        lastTime.current = now;
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        startDecay();
      },
      onPanResponderTerminate: () => startDecay(),
    }),
  ).current;

  const rotate = rotationAnim.interpolate({
    inputRange: [-Math.PI, Math.PI],
    outputRange: ["-180deg", "180deg"],
    extrapolate: "extend",
  });

  // Speed-reactive visuals — bloom + motion-smear that build with spin speed.
  const glowOpacity = speedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });
  // Starts at the main circle's size, grows outward as the spin speeds up.
  const glowScale = speedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });
  const smearOpacity = speedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.stack}>
          <Animated.View
            style={[styles.widget, { transform: [{ scale }] }]}
            onLayout={(e) => {
              widgetCenter.current = {
                x: e.nativeEvent.layout.width / 2,
                y: e.nativeEvent.layout.height / 2,
              };
            }}
          >
            {/* Speed glow — starts on the main circle, grows out as it spins */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  backgroundColor: accentColor,
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            <Animated.View
              style={[styles.body, { transform: [{ rotate }] }]}
              {...panResponder.panHandlers}
            >
              <Svg width={WIDGET} height={WIDGET} viewBox="0 0 200 200">
                {designId === "hex" && <HexBody accent={accentColor} />}
                {designId === "propeller" && (
                  <PropellerBody accent={accentColor} />
                )}
                {designId === "gear" && <GearBody accent={accentColor} />}
                {designId === "rays" && <RaysBody accent={accentColor} />}
                {/* Common center bearing (sits behind the static logo) */}
                <Circle cx="100" cy="100" r={BEARING_R} fill="#FFFFFF" />
                <Circle
                  cx="100"
                  cy="100"
                  r={BEARING_WELL_R}
                  fill={hexToRgba(accentColor, 0.12)}
                />
              </Svg>
            </Animated.View>

            {/* Motion-smear disc — the body blurs into a disc at speed */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.smear,
                { backgroundColor: "#FFFFFF", opacity: smearOpacity },
              ]}
            />

            <View pointerEvents="none" style={styles.iconWrap}>
              {icon ? (
                <Image source={icon} style={styles.icon} contentFit="contain" />
              ) : null}
            </View>
          </Animated.View>

          {/* Live RPM readout + personal best. Wrap in a noop Pressable so a
              tap here doesn't bubble up and dismiss the modal. */}
          <Pressable onPress={() => {}}>
            <View style={styles.stats}>
              <Text style={styles.rpmValue}>
                {Math.round(rpm).toLocaleString()}
                <Text style={styles.rpmUnit}>  RPM</Text>
              </Text>
              <Text style={styles.bestText}>
                {stats.topRpm > 0
                  ? `Best ${Math.round(stats.topRpm).toLocaleString()} RPM · ${(
                      stats.longestMs / 1000
                    ).toFixed(1)}s spin`
                  : "Flick or drag the spinner"}
              </Text>
            </View>
          </Pressable>

          {/* Design preview tiles — tap to switch. Wrap row in a noop
              Pressable so empty gaps don't bubble up and dismiss. */}
          <Pressable onPress={() => {}}>
            <View style={styles.previewRow}>
              {DESIGNS.map((d) => {
                const active = d === designId;
                return (
                  <Pressable
                    key={d}
                    hitSlop={6}
                    onPress={() => {
                      if (d === designId) return;
                      setDesignId(d);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${DESIGN_LABELS[d]} spinner`}
                    style={[
                      styles.previewTile,
                      active ? styles.previewTileActive : null,
                    ]}
                  >
                    <Svg
                      width={PREVIEW_INNER}
                      height={PREVIEW_INNER}
                      viewBox="0 0 200 200"
                    >
                      {d === "hex" && <HexBody accent={accentColor} />}
                      {d === "propeller" && (
                        <PropellerBody accent={accentColor} />
                      )}
                      {d === "gear" && <GearBody accent={accentColor} />}
                      {d === "rays" && <RaysBody accent={accentColor} />}
                    </Svg>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 12, 30, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  stack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  widget: {
    width: WIDGET,
    height: WIDGET,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    position: "absolute",
    width: WIDGET,
    height: WIDGET,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: WIDGET * 0.94,
    height: WIDGET * 0.94,
    borderRadius: (WIDGET * 0.94) / 2,
  },
  smear: {
    position: "absolute",
    width: WIDGET * 0.8,
    height: WIDGET * 0.8,
    borderRadius: (WIDGET * 0.8) / 2,
  },
  stats: {
    alignItems: "center",
    gap: 2,
  },
  rpmValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "HankenGrotesk_700Bold",
  },
  rpmUnit: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: "HankenGrotesk_600SemiBold",
  },
  bestText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "HankenGrotesk_500Medium",
  },
  iconWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: ICON,
    height: ICON,
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewTile: {
    width: PREVIEW_TILE,
    height: PREVIEW_TILE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  previewTileActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.85)",
  },
});
