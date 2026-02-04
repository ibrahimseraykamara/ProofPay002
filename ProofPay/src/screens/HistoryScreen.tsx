import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import InvoiceCard from "../components/InvoiceCard";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";

export default function HistoryScreen() {
  const { invoices, deleteInvoice, duplicateInvoice, viewInvoice } = useApp();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoice History</Text>
      {invoices.length === 0 ? (
        <Text style={styles.empty}>No invoices yet.</Text>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InvoiceCard
              invoice={item}
              onDelete={() => deleteInvoice(item.id)}
              onDuplicate={() => duplicateInvoice(item.id)}
              onView={() => viewInvoice(item)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
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
    marginBottom: 12,
  },
  empty: {
    color: colors.textMuted,
  },
  list: {
    paddingBottom: 24,
  },
});
