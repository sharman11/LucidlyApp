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
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  useEffect(() => {
    // Boot the app once fonts resolve — *or* once font loading errors. Without
    // the error branch, a font load failure would leave the native splash on
    // screen forever, which Apple's iPad reviewer flagged as a freeze.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <Stack screenOptions={{ headerShown: false, animation: "default" }}>
            <Stack.Screen name="index" options={{ animation: "none" }} />
            <Stack.Screen name="splash" options={{ animation: "fade" }} />
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
            <StatusBar style="auto" />
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
