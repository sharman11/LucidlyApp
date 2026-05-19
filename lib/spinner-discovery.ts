import AsyncStorage from "@react-native-async-storage/async-storage";

// Tracks whether the user has ever opened the spinning-logo easter egg.
// Used to drive a one-time discovery hint (a subtle logo wiggle).
const KEY = "@lucidly/spinner-discovered";

export async function isSpinnerDiscovered(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export function markSpinnerDiscovered(): void {
  AsyncStorage.setItem(KEY, "1").catch(() => {});
}
