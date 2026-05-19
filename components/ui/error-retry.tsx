import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export function ErrorRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.7}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  message: {
    fontSize: 13,
    fontFamily: "HankenGrotesk_500Medium",
    color: "#9B97A6",
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#E2D9F9",
  },
  buttonText: {
    fontSize: 12,
    fontFamily: "HankenGrotesk_600SemiBold",
    color: "#7F56D9",
  },
});
