import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CheckIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="24" fill="#E2D9F9" />
      <Path
        d="M14 24L21 31L34 17"
        stroke="#7F56D9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function WalletSuccessScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 },
      ]}
    >
      <View style={styles.content}>
        <CheckIcon />
        <Text style={styles.title}>Wallet Connected</Text>
        <Text style={styles.subtitle}>
          Your wallet has been successfully linked to Lucidly.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)/portfolio')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F0FF',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'HankenGrotesk_700Bold',
    color: '#000000',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'HankenGrotesk_400Regular',
    color: '#626066',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: '#E2D9F9',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'HankenGrotesk_600SemiBold',
    color: '#7F56D9',
    letterSpacing: 0.2,
  },
});
