import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { API_BASE } from "@/constants/api";
import { getDeviceId } from "@/lib/device-id";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

// ─── Icons ───────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path
        d="M15 5L5 15M5 5L15 15"
        stroke="#626066"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </Svg>
  );
}

function QuestionIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Defs>
        <ClipPath id="q_clip">
          <Rect width="20" height="20" fill="white" />
        </ClipPath>
      </Defs>
      <G opacity="0.6" clipPath="url(#q_clip)">
        <Path
          d="M7.57496 7.49999C7.77088 6.94305 8.15759 6.47341 8.66659 6.17427C9.17559 5.87512 9.77404 5.76577 10.3559 5.86558C10.9378 5.96539 11.4656 6.26793 11.8459 6.7196C12.2261 7.17127 12.4342 7.74292 12.4333 8.33332C12.4333 9.99999 9.93329 10.8333 9.93329 10.8333M9.99996 14.1667H10.0083M18.3333 9.99999C18.3333 14.6024 14.6023 18.3333 9.99996 18.3333C5.39759 18.3333 1.66663 14.6024 1.66663 9.99999C1.66663 5.39762 5.39759 1.66666 9.99996 1.66666C14.6023 1.66666 18.3333 5.39762 18.3333 9.99999Z"
          stroke="#626066"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Defs>
        <ClipPath id="shield_clip">
          <Rect width="12" height="12" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#shield_clip)">
        <Path
          d="M11.0008 1C8.66748 0 6.00081 0 6.00081 0C6.00081 0 3.33415 0 1.00081 1C0.000813006 6 1.00081 10.3333 6.00081 12C11.0008 10.3333 12.0008 6 11.0008 1Z"
          fill="#CCD6DD"
        />
        <Path
          d="M6.00016 11.294C2.1375 9.90901 0.65383 6.60968 1.58683 1.48068C3.68783 0.675682 5.97616 0.666016 6.00016 0.666016C6.02383 0.666016 8.3195 0.679349 10.4135 1.48068C11.3465 6.60968 9.86283 9.90901 6.00016 11.294Z"
          fill="#55ACEE"
        />
        <Path
          d="M10.4133 1.48068C8.31933 0.679349 6.02367 0.666016 6 0.666016V11.294C9.86267 9.90901 11.3463 6.60968 10.4133 1.48068Z"
          fill="#226699"
        />
      </G>
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Defs>
        <ClipPath id="star_clip">
          <Rect width="12" height="12" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#star_clip)">
        <Path
          d="M11.4483 5.63035L8.48198 4.53235L7.37431 0.902016C7.33165 0.762016 7.20198 0.666016 7.05565 0.666016C6.90931 0.666016 6.77965 0.762016 6.73698 0.902016L5.62965 4.53235L2.66298 5.63035C2.53198 5.67902 2.44531 5.80335 2.44531 5.94302C2.44531 6.08235 2.53198 6.20735 2.66298 6.25568L5.62798 7.35335L6.73598 11.0943C6.77798 11.2357 6.90798 11.3327 7.05565 11.3327C7.20298 11.3327 7.33331 11.2357 7.37531 11.094L8.48331 7.35302L11.4486 6.25535C11.579 6.20735 11.666 6.08268 11.666 5.94302C11.666 5.80368 11.579 5.67902 11.4483 5.63035Z"
          fill="#FFAC33"
        />
        <Path
          d="M4.78298 9.29796L4.01165 9.01263L3.71165 7.91263C3.67232 7.7673 3.54065 7.66663 3.39032 7.66663C3.23998 7.66663 3.10832 7.7673 3.06865 7.9123L2.76865 9.0123L1.99765 9.29763C1.86665 9.34596 1.77998 9.47096 1.77998 9.6103C1.77998 9.74963 1.86665 9.87463 1.99765 9.92296L2.76465 10.2073L3.06698 11.4146C3.10432 11.5626 3.23732 11.6666 3.39032 11.6666C3.54332 11.6666 3.67632 11.5626 3.71365 11.4143L4.01598 10.207L4.78298 9.92263C4.91398 9.87463 5.00065 9.74963 5.00065 9.6103C5.00065 9.47096 4.91398 9.34596 4.78298 9.29796ZM3.33698 2.07696L2.54898 1.7853L2.25698 0.996964C2.20865 0.865964 2.08398 0.779297 1.94432 0.779297C1.80498 0.779297 1.68032 0.865964 1.63165 0.996964L1.33998 1.7853L0.551651 2.07696C0.420651 2.12563 0.333984 2.2503 0.333984 2.38963C0.333984 2.52896 0.420651 2.65396 0.551651 2.7023L1.33998 2.99396L1.63165 3.7823C1.68032 3.9133 1.80498 3.99996 1.94432 3.99996C2.08365 3.99996 2.20832 3.9133 2.25698 3.7823L2.54865 2.99396L3.33698 2.7023C3.46798 2.65363 3.55465 2.52896 3.55465 2.38963C3.55465 2.2503 3.46798 2.12563 3.33698 2.07696Z"
          fill="#FFCC4D"
        />
      </G>
    </Svg>
  );
}

function ClearIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1.33334C4.31999 1.33334 1.33334 4.31999 1.33334 8C1.33334 11.68 4.31999 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8C14.6667 4.31999 11.68 1.33334 8 1.33334Z"
        fill="#D6CFF0"
      />
      <Path
        d="M10 6L6 10M6 6L10 10"
        stroke="#7A7880"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1.33334C4.31999 1.33334 1.33334 4.31999 1.33334 8C1.33334 11.68 4.31999 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8C14.6667 4.31999 11.68 1.33334 8 1.33334Z"
        fill="#D1FAE5"
      />
      <Path
        d="M5.33334 8L7.33334 10L10.6667 6"
        stroke="#22C55E"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PasteIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Path
        d="M8 1.5H9C9.55228 1.5 10 1.94772 10 2.5V10C10 10.5523 9.55228 11 9 11H3C2.44772 11 2 10.5523 2 10V2.5C2 1.94772 2.44772 1.5 3 1.5H4M4.5 1H7.5C7.77614 1 8 1.22386 8 1.5V2C8 2.27614 7.77614 2.5 7.5 2.5H4.5C4.22386 2.5 4 2.27614 4 2V1.5C4 1.22386 4.22386 1 4.5 1Z"
        stroke="#7F56D9"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Help Bottom Sheet ────────────────────────────────────────────────────────

function HelpModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={sheet.backdrop} />
      </TouchableWithoutFeedback>
      <View style={[sheet.container, { paddingBottom: 24 + insets.bottom }]}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>Wallet Linking on Lucidly</Text>
        <Text style={sheet.body}>
          Lucidly uses your public address to track deposits and performance
          across Lucidly strategies. Your funds always remain in your wallet.
        </Text>
        <TouchableOpacity
          style={sheet.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={sheet.closeBtnText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D6CFF0",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 20,
    marginBottom: 16,
  },
  closeBtn: {
    backgroundColor: "#7F56D9",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#FFFFFF",
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { addWallet, wallets } = useAuth();
  const [walletId, setWalletId] = useState("");
  const [walletName, setWalletName] = useState("");
  const [loading, setLoading] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "walletId" | "walletName" | null
  >(null);

  // Inline error state (replaces Alerts)
  const [addressError, setAddressError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Track whether user has interacted with fields (for live validation)
  const [addressTouched, setAddressTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const insets = useSafeAreaInsets();

  // Derived validation
  const trimmedId = walletId.trim();
  const trimmedName = walletName.trim();
  const isAddressValid = WALLET_REGEX.test(trimmedId);
  const isAddressPartial = trimmedId.length > 0 && !isAddressValid;
  const isNameValid = trimmedName.length > 0;
  const isFormValid = isAddressValid && isNameValid;

  // Live validation errors (only after field has been touched/blurred)
  const liveAddressError =
    addressTouched && isAddressPartial
      ? "Enter a valid Ethereum address (0x + 40 hex characters)"
      : null;
  const liveNameError =
    nameTouched && !isNameValid ? "Give this wallet a nickname" : null;

  const clearErrors = () => {
    setAddressError(null);
    setNameError(null);
    setBannerError(null);
  };

  const showSuccess = (address: string, name: string) => {
    router.push({
      pathname: "/wallet-success",
      params: { address, name },
    });
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setWalletId(text.trim());
      setAddressTouched(true);
      clearErrors();
    }
  };

  const handleConnect = async () => {
    clearErrors();

    if (!isAddressValid) {
      setAddressError(
        "That doesn't look like a valid Ethereum address. Make sure it starts with 0x and is 42 characters long.",
      );
      setAddressTouched(true);
      return;
    }

    if (!isNameValid) {
      setNameError("Please give this wallet a nickname before continuing.");
      setNameTouched(true);
      return;
    }

    // Already added locally
    const alreadyAdded = wallets.some(
      (w) => w.walletId.toLowerCase() === trimmedId.toLowerCase(),
    );
    if (alreadyAdded) {
      setBannerError("This wallet address is already linked to your account.");
      return;
    }

    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      // Step 1: Check if wallet exists on this device via GET
      const getRes = await fetch(
        `${API_BASE}/mobile/user/wallets/${deviceId}`,
      );
      if (getRes.ok) {
        const getJson = await getRes.json();
        const serverWallets: { wallet_address: string; wallet_name: string }[] =
          getJson?.wallets ?? [];
        const match = serverWallets.find(
          (w) => w.wallet_address.toLowerCase() === trimmedId.toLowerCase(),
        );
        if (match) {
          addWallet(match.wallet_address, trimmedName);
          showSuccess(match.wallet_address, trimmedName);
          return;
        }
      }

      // Step 2: Not found on server — try to connect
      const res = await fetch(
        `${API_BASE}/mobile/user/wallet/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: deviceId,
            wallet_address: trimmedId,
            wallet_name: trimmedName,
          }),
        },
      );

      if (res.ok) {
        addWallet(trimmedId, trimmedName);
        showSuccess(trimmedId, trimmedName);
        return;
      }

      if (res.status === 409) {
        addWallet(trimmedId, trimmedName);
        showSuccess(trimmedId, trimmedName);
        return;
      }

      setBannerError(
        "This wallet doesn't appear to be associated with a Lucidly account. Please check the address.",
      );
    } catch {
      setBannerError(
        "We couldn't reach the server. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine address field border color
  const addressBorderColor =
    addressError || liveAddressError
      ? "#EF4444"
      : focusedField === "walletId"
        ? "#7F56D9"
        : isAddressValid && addressTouched
          ? "#22C55E"
          : "#E2D9F9";

  const nameBorderColor =
    nameError || liveNameError
      ? "#EF4444"
      : focusedField === "walletName"
        ? "#7F56D9"
        : "#E2D9F9";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <CloseIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setHelpVisible(true)}
            activeOpacity={0.7}
          >
            <QuestionIcon />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title}>Add Your Wallet</Text>
          <Text style={styles.subtitle}>
            Securely track your Lucidly deposits and yields by linking your
            wallet address.
          </Text>

          {/* Banner error (network / duplicate / not recognised) */}
          {bannerError != null && (
            <TouchableOpacity
              style={styles.errorBanner}
              onPress={() => setBannerError(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.errorBannerText}>{bannerError}</Text>
              <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <Path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="#EF4444"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          )}

          {/* Wallet Address Input */}
          <View style={styles.fieldGroup}>
            <View
              style={[styles.inputRow, { borderColor: addressBorderColor }]}
            >
              <TextInput
                style={styles.inputText}
                placeholder="0x... add your address"
                placeholderTextColor="#7A7880"
                value={walletId}
                onChangeText={(t) => {
                  setWalletId(t);
                  setAddressError(null);
                  setBannerError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                editable={!loading}
                onFocus={() => setFocusedField("walletId")}
                onBlur={() => {
                  setFocusedField(null);
                  setAddressTouched(true);
                }}
              />
              {/* Right side actions */}
              {walletId.length > 0 ? (
                <View style={styles.inputActions}>
                  {isAddressValid && <CheckIcon />}
                  <TouchableOpacity
                    onPress={() => {
                      setWalletId("");
                      setAddressError(null);
                      setAddressTouched(false);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ClearIcon />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pastePill}
                  onPress={handlePaste}
                  activeOpacity={0.7}
                >
                  <PasteIcon />
                  <Text style={styles.pastePillText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Inline error or hint */}
            {addressError != null || liveAddressError != null ? (
              <Text style={styles.fieldError}>
                {addressError ?? liveAddressError}
              </Text>
            ) : (
              <View style={styles.hint}>
                <ShieldIcon />
                <Text style={styles.hintText}>
                  This is your public address — never share your private key.
                </Text>
              </View>
            )}
          </View>

          {/* Wallet Name Input */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, { borderColor: nameBorderColor }]}>
              <TextInput
                style={styles.inputText}
                placeholder="Wallet nickname"
                placeholderTextColor="#7A7880"
                value={walletName}
                onChangeText={(t) => {
                  setWalletName(t);
                  setNameError(null);
                  setBannerError(null);
                }}
                autoCorrect={false}
                editable={!loading}
                onFocus={() => setFocusedField("walletName")}
                onBlur={() => {
                  setFocusedField(null);
                  setNameTouched(true);
                }}
              />
              {walletName.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setWalletName("");
                    setNameError(null);
                    setNameTouched(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ClearIcon />
                </TouchableOpacity>
              )}
            </View>
            {nameError != null || liveNameError != null ? (
              <Text style={styles.fieldError}>
                {nameError ?? liveNameError}
              </Text>
            ) : (
              <View style={styles.hint}>
                <StarIcon />
                <Text style={styles.hintText}>
                  Helps you identify this wallet later.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.flex} />

        {/* Add Wallet Button */}
        <View style={[styles.footer, { paddingBottom: SCREEN_HEIGHT * 0.06 }]}>
          <View style={styles.buttonOuter}>
            <View
              style={[StyleSheet.absoluteFillObject, styles.buttonShadowDark]}
            />
            <View
              style={[StyleSheet.absoluteFillObject, styles.buttonShadowLight]}
            />
            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
                isFormValid && !loading && styles.buttonReady,
              ]}
              onPress={handleConnect}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonLabel,
                  isFormValid && !loading && styles.buttonLabelReady,
                ]}
              >
                {loading ? "Adding..." : "Add Wallet"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: "HankenGrotesk_700Bold",
    color: "#000000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    lineHeight: 20,
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },

  // Input row — wraps TextInput + actions in a single bordered container
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    backgroundColor: "#F4F0FF",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#000000",
    paddingVertical: 16,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // Paste pill
  pastePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pastePillText: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
  },

  // Hints & errors
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 10,
    fontFamily: "HankenGrotesk_400Regular",
    color: "#626066",
    flex: 1,
    lineHeight: 17,
  },
  fieldError: {
    fontSize: 11,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#EF4444",
    marginTop: 6,
    paddingHorizontal: 4,
    lineHeight: 16,
  },

  // Banner error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#B91C1C",
    lineHeight: 18,
  },

  // Button
  footer: {
    paddingHorizontal: 20,
  },
  buttonOuter: {
    borderRadius: 100,
  },
  buttonShadowDark: {
    borderRadius: 100,
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: "#F4F0FF",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  buttonShadowLight: {
    borderRadius: 100,
    top: -4,
    left: -4,
    right: 4,
    bottom: 4,
    backgroundColor: "#F4F0FF",
    shadowColor: "#FFF",
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  button: {
    backgroundColor: "#E2D9F9",
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonReady: {
    backgroundColor: "#7F56D9",
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
    letterSpacing: 0.2,
  },
  buttonLabelReady: {
    color: "#FFFFFF",
  },
});
