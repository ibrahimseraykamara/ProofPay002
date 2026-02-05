import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import Button from "../components/Button";

export default function DebugScreen() {
  const { customerInfo, isPro, profile, refreshCustomerInfo } = useApp();
  const entitlements = customerInfo?.entitlements?.active ?? {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>RevenueCat Debug</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Current plan</Text>
        <Text style={styles.value}>{isPro ? "pro" : profile?.plan ?? "free"}</Text>
        <Button label="Refresh customer info" onPress={refreshCustomerInfo} />
        <Text style={styles.label}>Active entitlements</Text>
        <Text style={styles.mono}>{JSON.stringify(entitlements, null, 2)}</Text>
        <Text style={styles.label}>Customer info</Text>
        <Text style={styles.mono}>{JSON.stringify(customerInfo, null, 2)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  label: {
    color: colors.textMuted,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 12,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
    marginTop: 4,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
