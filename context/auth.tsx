import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { migrateLegacyWallets } from '@/lib/device-id';

const STORAGE_KEY = 'lucidly_wallets';
const ACTIVE_KEY = 'lucidly_active_wallet';

interface Wallet {
  walletId: string;
  name: string;
}

interface AuthContextType {
  wallets: Wallet[];
  activeWalletId: string | null;
  ready: boolean;
  addWallet: (walletId: string, name: string) => void;
  removeWallet: (walletId: string) => void;
  renameWallet: (walletId: string, name: string) => void;
  setActiveWallet: (walletId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  wallets: [],
  activeWalletId: null,
  ready: false,
  addWallet: () => {},
  removeWallet: () => {},
  renameWallet: () => {},
  setActiveWallet: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletId, setActiveWalletIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  // Load from storage on mount
  useEffect(() => {
    async function load() {
      try {
        const [storedWallets, storedActive] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_KEY),
        ]);
        if (storedWallets) {
          const parsed: Wallet[] = JSON.parse(storedWallets);
          setWallets(parsed);
          // Restore active, fallback to first wallet
          if (storedActive && parsed.some((w) => w.walletId === storedActive)) {
            setActiveWalletIdState(storedActive);
          } else if (parsed.length > 0) {
            setActiveWalletIdState(parsed[0].walletId);
          }
          // One-time migration: wallets linked under the legacy shared device_id
          // need to be re-registered under the new per-install UUID before
          // /portfolio will accept them. After migration succeeds, invalidate
          // portfolio caches so any already-errored queries auto-retry.
          migrateLegacyWallets(parsed).then(() => {
            queryClient.invalidateQueries({ queryKey: ["portfolio"] });
          });
        }
      } catch {
        // silently ignore
      } finally {
        setReady(true);
      }
    }
    load();
  }, [queryClient]);

  const persist = async (updated: Wallet[], activeId: string | null) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (activeId) {
        await AsyncStorage.setItem(ACTIVE_KEY, activeId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_KEY);
      }
    } catch {
      // silently ignore
    }
  };

  const addWallet = (walletId: string, name: string) => {
    setWallets((prev) => {
      const exists = prev.some((w) => w.walletId === walletId);
      if (exists) return prev;
      const updated = [...prev, { walletId, name }];
      // Always set the newly added wallet as active
      persist(updated, walletId);
      setActiveWalletIdState(walletId);
      return updated;
    });
  };

  const removeWallet = (walletId: string) => {
    setWallets((prev) => {
      const updated = prev.filter((w) => w.walletId !== walletId);
      const newActive =
        activeWalletId === walletId
          ? updated.length > 0 ? updated[0].walletId : null
          : activeWalletId;
      setActiveWalletIdState(newActive);
      persist(updated, newActive);
      return updated;
    });
  };

  const renameWallet = (walletId: string, name: string) => {
    setWallets((prev) => {
      const updated = prev.map((w) =>
        w.walletId === walletId ? { ...w, name } : w,
      );
      persist(updated, activeWalletId);
      return updated;
    });
  };

  const setActiveWallet = (walletId: string) => {
    setActiveWalletIdState(walletId);
    AsyncStorage.setItem(ACTIVE_KEY, walletId).catch(() => {});
  };

  const logout = async () => {
    setWallets([]);
    setActiveWalletIdState(null);
    await AsyncStorage.multiRemove([STORAGE_KEY, ACTIVE_KEY]);
  };

  return (
    <AuthContext.Provider value={{ wallets, activeWalletId, ready, addWallet, removeWallet, renameWallet, setActiveWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
