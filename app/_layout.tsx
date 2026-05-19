import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";

import { AuthProvider } from "@/context/auth";
import { DataProvider } from "@/context/data";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <Stack screenOptions={{ headerShown: false, animation: "default" }}>
            <Stack.Screen name="index" options={{ animation: "none" }} />
            <Stack.Screen name="splash" options={{ animation: "fade" }} />
            <Stack.Screen
              name="enter-app"
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="login"
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen
              name="wallet-success"
              options={{
                presentation: "transparentModal",
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="yield-detail"
              options={{ animation: "slide_from_right" }}
            />
          </Stack>
        <OfflineBanner />
        <StatusBar style="dark" />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
