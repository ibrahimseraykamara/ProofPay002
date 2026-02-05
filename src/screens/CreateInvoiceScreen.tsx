import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import Button from "../components/Button";
import Input from "../components/Input";
import UpgradeModal from "../components/UpgradeModal";
import { useApp } from "../context/AppContext";
import { currencyOptions, paymentMethods } from "../lib/constants";
import { formatDateISO } from "../lib/format";
import { isInvoiceLimitReached } from "../lib/limits";
import { colors } from "../theme/colors";

export default function CreateInvoiceScreen() {
  const {
    createInvoice,
    profile,
    invoices,
    isPro,
    packages,
    purchasing,
    purchasePackage,
    restorePurchases,
  } = useApp();
  const [clientName, setClientName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(currencyOptions[0]);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [submitting, setSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isValid = useMemo(() => {
    return (
      clientName.trim().length > 1 &&
      serviceDescription.trim().length > 2 &&
      Number(amount) > 0
    );
  }, [clientName, serviceDescription, amount]);

  const invoiceCount = profile?.invoice_count ?? invoices.length;
  const isLimitReached = isInvoiceLimitReached(isPro ? "pro" : "free", invoiceCount);

  const handleCreate = async () => {
    if (!isValid) return;
    setSubmitting(true);
    const result = await createInvoice({
      clientName,
      serviceDescription,
      amount: Number(amount),
      currency,
      paymentMethod,
      date,
    });
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert("Unable to create invoice", result.message);
      return;
    }
    setClientName("");
    setServiceDescription("");
    setAmount("");
    setDate(formatDateISO(new Date()));
    Alert.alert("Invoice created", "Your PDF receipt is ready.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Invoice</Text>
      <Text style={styles.subtitle}>
        {isPro
          ? "Pro plan: unlimited invoices"
          : `Free plan: ${invoiceCount} / 3 invoices`}
      </Text>
      {isLimitReached && !isPro ? (
        <View style={styles.limitCard}>
          <Text style={styles.limitText}>
            Free plan limit reached. Upgrade to Pro to keep creating invoices.
          </Text>
          <Button label="Upgrade to Pro" onPress={() => setShowUpgrade(true)} />
        </View>
      ) : null}

      <Input
        label="Client name"
        value={clientName}
        onChangeText={setClientName}
        placeholder="Jane Doe"
      />
      <Input
        label="Service description"
        value={serviceDescription}
        onChangeText={setServiceDescription}
        placeholder="Social media graphics"
        multiline
      />
      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="250"
        keyboardType="numeric"
      />

      <View style={styles.pickerGroup}>
        <Text style={styles.pickerLabel}>Currency</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={currency} onValueChange={setCurrency}>
            {currencyOptions.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.pickerGroup}>
        <Text style={styles.pickerLabel}>Payment method</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={paymentMethod} onValueChange={setPaymentMethod}>
            {paymentMethods.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
      </View>

      <Input
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="2026-02-04"
      />

      <Button
        label={submitting ? "Generating PDF..." : "Generate invoice"}
        onPress={handleCreate}
        disabled={!isValid || submitting || isLimitReached}
      />
      <UpgradeModal
        visible={showUpgrade}
        packages={packages}
        purchasing={purchasing}
        onClose={() => setShowUpgrade(false)}
        onPurchasePackage={async (pkg) => {
          const result = await purchasePackage(pkg);
          if (result.ok) {
            setShowUpgrade(false);
            Alert.alert("Pro unlocked", "Your subscription is active.");
          } else if (result.message !== "Purchase cancelled.") {
            Alert.alert("Purchase failed", result.message);
          }
        }}
        onRestore={async () => {
          const result = await restorePurchases();
          if (result.ok) {
            setShowUpgrade(false);
            Alert.alert("Restored", "Your purchases are now active.");
          } else {
            Alert.alert("Restore failed", result.message);
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: 16,
  },
  pickerGroup: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 6,
  },
  pickerWrapper: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  limitCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  limitText: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
});
