import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: "#F4F0FF" } }}
      initialRouteName="yields"
    >
      <Tabs.Screen name="yields" options={{ title: "Yields" }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfolio" }} />
      <Tabs.Screen name="points" options={{ title: "Points" }} />
      <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
    </Tabs>
  );
}
