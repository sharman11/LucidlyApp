import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { API_BASE } from "@/constants/api";

const KEY = "@lucidly/device_id";
const MIGRATED_KEY = "@lucidly/legacy_device_id_migrated";

let cached: string | null = null;
let inflight: Promise<string> | null = null;

function uuidV4(): string {
  // RFC 4122 v4 UUID using Math.random — adequate for an opaque device
  // identifier (uniqueness, not unpredictability, is what the backend needs).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * One-time migration for users who had wallets linked under the legacy shared
 * device_id (`lucidly-ios` / `lucidly-android`). The backend enforces a
 * device_id ↔ wallet_address binding on /portfolio, so without re-registering
 * existing wallets under the new per-install UUID, /portfolio returns 4xx.
 *
 * Idempotent — guarded by a stored flag so it only runs once. Failures per
 * wallet are silently swallowed; the next /portfolio call will surface them.
 */
export async function migrateLegacyWallets(
  wallets: { walletId: string; name: string }[],
): Promise<void> {
  if (wallets.length === 0) return;
  try {
    if ((await AsyncStorage.getItem(MIGRATED_KEY)) === "1") return;
  } catch {
    return;
  }

  const deviceId = await getDeviceId();
  await Promise.all(
    wallets.map((w) =>
      fetch(`${API_BASE}/mobile/user/wallet/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          wallet_address: w.walletId,
          wallet_name: w.name,
        }),
      }).catch(() => null),
    ),
  );

  try {
    await AsyncStorage.setItem(MIGRATED_KEY, "1");
  } catch {
    // If we can't persist the flag we'll retry next launch — harmless because
    // the backend treats re-connect as idempotent (returns 409, which is fine).
  }
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const existing = await AsyncStorage.getItem(KEY);
      if (existing) {
        cached = existing;
        return existing;
      }
      const fresh = `lucidly-${Platform.OS}-${uuidV4()}`;
      await AsyncStorage.setItem(KEY, fresh);
      cached = fresh;
      return fresh;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
