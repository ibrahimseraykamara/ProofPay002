import AsyncStorage from "@react-native-async-storage/async-storage";
import { Invoice } from "./types";

const STORAGE_KEY = "proofpay_invoices";

export const loadLocalInvoices = async (): Promise<Invoice[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
};

export const saveLocalInvoices = async (invoices: Invoice[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
};
