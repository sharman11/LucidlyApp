import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lucidly_wallets';
const ACTIVE_KEY = 'lucidly_active_wallet';

interface Wallet {
  walletId: string;
  name: string;
}

interface AuthContextType {
  wallets: Wallet[];
  activeWalletId: string | null;
  addWallet: (walletId: string, name: string) => void;
  removeWallet: (walletId: string) => void;
  setActiveWallet: (walletId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  wallets: [],
  activeWalletId: null,
  addWallet: () => {},
  removeWallet: () => {},
  setActiveWallet: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletId, setActiveWalletIdState] = useState<string | null>(null);

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
        }
      } catch {
        // silently ignore
      }
    }
    load();
  }, []);

  const persist = async (updated: Wallet[], activeId: string | null) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (activeId) await AsyncStorage.setItem(ACTIVE_KEY, activeId);
    } catch {
      // silently ignore
    }
  };

  const addWallet = (walletId: string, name: string) => {
    setWallets((prev) => {
      const exists = prev.some((w) => w.walletId === walletId);
      if (exists) return prev;
      const updated = [...prev, { walletId, name }];
      const newActive = prev.length === 0 ? walletId : activeWalletId;
      persist(updated, newActive);
      if (prev.length === 0) setActiveWalletIdState(walletId);
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
    <AuthContext.Provider value={{ wallets, activeWalletId, addWallet, removeWallet, setActiveWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
