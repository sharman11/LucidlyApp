import React, { useState } from "react";
import { useAuth } from "@/context/auth";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Svg, { Path } from "react-native-svg";

const ACTIVE = "#7F56D9";
const INACTIVE = "#353140";

function YieldsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 7L14.1314 14.8686C13.7354 15.2646 13.5373 15.4627 13.309 15.5368C13.1082 15.6021 12.8918 15.6021 12.691 15.5368C12.4627 15.4627 12.2646 15.2646 11.8686 14.8686L9.13137 12.1314C8.73535 11.7354 8.53735 11.5373 8.30902 11.4632C8.10817 11.3979 7.89183 11.3979 7.69098 11.4632C7.46265 11.5373 7.26465 11.7354 6.86863 12.1314L2 17M22 7H15M22 7V14"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PortfolioIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.9474 3.89474H15.7053C17.2086 3.89474 17.9602 3.89474 18.5344 4.1873C19.0395 4.44464 19.4501 4.85527 19.7074 5.36034C20 5.93453 20 6.68617 20 8.18947V15.7053C20 17.2086 20 17.9602 19.7074 18.5344C19.4501 19.0395 19.0395 19.4501 18.5344 19.7074C17.9602 20 17.2086 20 15.7053 20H8.18947C6.68617 20 5.93453 20 5.36034 19.7074C4.85527 19.4501 4.44464 19.0395 4.1873 18.5344C3.89474 17.9602 3.89474 17.2086 3.89474 15.7053V11.9474M8.36842 12.8421V16.4211M15.5263 11.0526V16.4211M11.9474 7.47368V16.4211M3 5.68421L5.68421 3M5.68421 3L8.36842 5.68421M5.68421 3L5.68421 8.36842"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PointsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 13.7778H16.51M3 5.77778V18.2222C3 19.2041 3.89543 20 5 20H19C20.1046 20 21 19.2041 21 18.2222V9.33333C21 8.35149 20.1046 7.55556 19 7.55556L5 7.55556C3.89543 7.55556 3 6.75962 3 5.77778ZM3 5.77778C3 4.79594 3.89543 4 5 4H17M17 13.7778C17 14.0232 16.7761 14.2222 16.5 14.2222C16.2239 14.2222 16 14.0232 16 13.7778C16 13.5323 16.2239 13.3333 16.5 13.3333C16.7761 13.3333 17 13.5323 17 13.7778Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const LABELS: Record<string, string> = {
  yields: "Yields",
  portfolio: "Portfolio",
  points: "Points",
  wallet: "Wallet",
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { wallets } = useAuth();
  const [containerWidth, setContainerWidth] = useState(0);

  const tabWidth = containerWidth / state.routes.length;
  const extraLeft = state.index === 0 ? 20 : 0;
  const extraRight = state.index === state.routes.length - 1 ? 20 : 0;

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View
        style={styles.container}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Image
          source={require("../../assets/navBG.png")}
          style={[
            StyleSheet.absoluteFillObject,
            { width: "100%", height: "100%" },
          ]}
          contentFit="fill"
          contentPosition="center"
        />
        {containerWidth > 0 && (
          <Image
            source={require("../../assets/navSelector.png")}
            style={[
              styles.selector,
              {
                left: state.index * tabWidth + 4 + extraLeft / 2 - extraRight / 2,
                width: tabWidth - 8,
              },
            ]}
            contentFit="fill"
          />
        )}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE : INACTIVE;

          const onPress = () => {
            if (route.name === "wallet") {
              if (wallets.length === 0) {
                router.navigate("/login");
              } else {
                navigation.navigate(route.name);
              }
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabInner,
                index === 0 && { paddingLeft: 20 },
                index === state.routes.length - 1 && { paddingRight: 20 },
              ]}>
                {route.name === "yields" && <YieldsIcon color={color} />}
                {route.name === "portfolio" && <PortfolioIcon color={color} />}
                {route.name === "points" && <PointsIcon color={color} />}
                {route.name === "wallet" && <WalletIcon color={color} />}
                <Text style={[styles.label, { color }]}>
                  {LABELS[route.name] ?? route.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#F4F0FF",
  },
  container: {
    height: 78,
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 11,
    zIndex: 2,
  },
  tabInner: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  selector: {
    position: "absolute",
    top: 12,
    bottom: 12,
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_500Medium",
  },
});
