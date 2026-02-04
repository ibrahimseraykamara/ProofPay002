import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import { Invoice } from "../lib/types";
import { formatCurrency, formatDateDisplay } from "../lib/format";
import { colors } from "../theme/colors";

type InvoiceCardProps = {
  invoice: Invoice;
  onDuplicate: () => void;
  onDelete: () => void;
  onView: () => void;
};

export default function InvoiceCard({
  invoice,
  onDuplicate,
  onDelete,
  onView,
}: InvoiceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.client}>{invoice.client_name}</Text>
        <Text style={styles.amount}>
          {formatCurrency(invoice.amount, invoice.currency)}
        </Text>
      </View>
      <Text style={styles.meta}>{invoice.service_description}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDateDisplay(invoice.date)}</Text>
        <Text style={styles.method}>{invoice.payment_method}</Text>
      </View>
      <View style={styles.actions}>
        <Button label="View" onPress={onView} variant="secondary" />
        <Button label="Duplicate" onPress={onDuplicate} variant="secondary" />
        <Button label="Delete" onPress={onDelete} variant="danger" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  client: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  meta: {
    color: colors.textSecondary,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  method: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
});
