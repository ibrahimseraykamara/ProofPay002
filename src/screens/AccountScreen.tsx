import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import UpgradeModal from "../components/UpgradeModal";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";

export default function AccountScreen() {
  const {
    profile,
    invoices,
    signOut,
    isPro,
    packages,
    purchasing,
    purchasePackage,
    restorePurchases,
  } = useApp();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const invoiceCount = profile?.invoice_count ?? invoices.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Plan</Text>
        <Text style={styles.value}>{isPro ? "pro" : profile?.plan ?? "free"}</Text>
        <Text style={styles.label}>Invoices created</Text>
        <Text style={styles.value}>{invoiceCount}</Text>
        {!isPro ? (
          <Text style={styles.note}>
            Upgrade to Pro for unlimited invoices and no watermark.
          </Text>
        ) : null}
      </View>
      {!isPro ? (
        <Button label="Upgrade to Pro" onPress={() => setShowUpgrade(true)} />
      ) : null}
      <Button label="Sign out" onPress={signOut} variant="secondary" />
      <UpgradeModal
        visible={showUpgrade}
        packages={packages}
        purchasing={purchasing}
        onClose={() => setShowUpgrade(false)}
        onPurchasePackage={async (pkg) => {
          const result = await purchasePackage(pkg);
          if (result.ok) {
            setShowUpgrade(false);
          }
        }}
        onRestore={async () => {
          const result = await restorePurchases();
          if (result.ok) {
            setShowUpgrade(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
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
  note: {
    marginTop: 16,
    color: colors.textSecondary,
  },
});
