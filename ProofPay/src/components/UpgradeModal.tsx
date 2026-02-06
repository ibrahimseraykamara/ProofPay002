import React, { useMemo } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { PACKAGE_TYPE, PurchasesPackage } from "react-native-purchases";
import Button from "./Button";
import { colors } from "../theme/colors";

type UpgradeModalProps = {
  visible: boolean;
  packages: PurchasesPackage[];
  purchasing: boolean;
  onClose: () => void;
  onPurchasePackage: (pkg: PurchasesPackage) => void;
  onRestore: () => void;
};

export default function UpgradeModal({
  visible,
  packages,
  purchasing,
  onClose,
  onPurchasePackage,
  onRestore,
}: UpgradeModalProps) {
  const { monthlyPackage, annualPackage, fallbackPackages } = useMemo(() => {
    const monthly = packages.find((pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY);
    const annual = packages.find((pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL);
    return { monthlyPackage: monthly, annualPackage: annual, fallbackPackages: packages };
  }, [packages]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Go Pro</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited invoices and remove the ProofPay watermark.
          </Text>
          <View style={styles.perks}>
            <Text style={styles.perkItem}>• Unlimited invoices</Text>
            <Text style={styles.perkItem}>• No watermark</Text>
            <Text style={styles.perkItem}>• Priority exports</Text>
          </View>
          {monthlyPackage ? (
            <Button
              label={`Monthly · ${monthlyPackage.product.priceString}`}
              onPress={() => onPurchasePackage(monthlyPackage)}
              disabled={purchasing}
            />
          ) : null}
          {annualPackage ? (
            <Button
              label={`Yearly · ${annualPackage.product.priceString}`}
              onPress={() => onPurchasePackage(annualPackage)}
              disabled={purchasing}
            />
          ) : null}
          {!monthlyPackage && !annualPackage ? (
            <Text style={styles.fallbackText}>
              Plans will appear once RevenueCat is configured.
            </Text>
          ) : null}
          {fallbackPackages.length > 2 ? (
            <Text style={styles.fallbackText}>
              Additional plans available in your store setup.
            </Text>
          ) : null}
          <Button label="Restore purchases" onPress={onRestore} variant="secondary" />
          <Button label="Not now" onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  perks: {
    marginVertical: 8,
  },
  perkItem: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
