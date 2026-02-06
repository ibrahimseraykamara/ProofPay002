import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Session } from "@supabase/supabase-js";
import Purchases, { PurchasesPackage } from "react-native-purchases";

import { supabase } from "../lib/supabase";
import {
  FREE_INVOICE_LIMIT,
  getInvoiceWatermarkState,
  isInvoiceLimitReached,
} from "../lib/limits";
import { Invoice, InvoiceInput, Profile } from "../lib/types";
import { buildInvoiceHtml, generateInvoicePdf } from "../lib/pdf";
import { loadLocalInvoices, saveLocalInvoices } from "../lib/storage";
import { formatDateISO } from "../lib/format";

type CreateInvoiceResult = { ok: true } | { ok: false; message: string };

type AppContextValue = {
  session: Session | null;
  profile: Profile | null;
  invoices: Invoice[];
  loading: boolean;
  isPro: boolean;
  packages: PurchasesPackage[];
  purchasing: boolean;
  customerInfo: any | null;
  refreshCustomerInfo: () => Promise<void>;
  createInvoice: (input: InvoiceInput) => Promise<CreateInvoiceResult>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  duplicateInvoice: (invoiceId: string) => Promise<CreateInvoiceResult>;
  refreshInvoices: () => Promise<void>;
  signOut: () => Promise<void>;
  viewInvoice: (invoice: Invoice) => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CreateInvoiceResult>;
  restorePurchases: () => Promise<CreateInvoiceResult>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [listenerAttached, setListenerAttached] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      if (data.session) {
        await ensureProfile(data.session.user.id);
        await refreshInvoicesForUser(data.session.user.id);
        await setupRevenueCat(data.session.user.id);
      }
      setLoading(false);
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        if (!nextSession) {
          setProfile(null);
          setInvoices([]);
          setIsPro(false);
          setPackages([]);
          setCustomerInfo(null);
          await safeRevenueCatLogout();
          return;
        }
        setLoading(true);
        await ensureProfile(nextSession.user.id);
        await refreshInvoicesForUser(nextSession.user.id);
        await setupRevenueCat(nextSession.user.id);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const setupRevenueCat = async (userId: string) => {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      setIsPro(profile?.plan === "pro");
      return;
    }
    Purchases.configure({ apiKey, appUserID: userId });
    await Purchases.logIn(userId);
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      setPackages(offerings.current.availablePackages);
    }
    const info = await Purchases.getCustomerInfo();
    await handleCustomerInfo(info);
    if (!listenerAttached) {
      Purchases.addCustomerInfoUpdateListener(handleCustomerInfo);
      setListenerAttached(true);
    }
  };

  const safeRevenueCatLogout = async () => {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) return;
    await Purchases.logOut();
  };

  const handleCustomerInfo = async (info: any) => {
    setCustomerInfo(info ?? null);
    const active = Boolean(info?.entitlements?.active?.[entitlementId]);
    setIsPro(active);
    await syncPlanWithSupabase(active);
  };

  const refreshCustomerInfo = async () => {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) return;
    const info = await Purchases.getCustomerInfo();
    await handleCustomerInfo(info);
  };

  const syncPlanWithSupabase = async (pro: boolean) => {
    if (!session) return;
    const desiredPlan = pro ? "pro" : "free";
    if (profile?.plan === desiredPlan) return;
    const { data } = await supabase
      .from("profiles")
      .update({ plan: desiredPlan })
      .eq("id", session.user.id)
      .select()
      .single();
    if (data) {
      setProfile(normalizeProfile(data));
    }
  };

  const ensureProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(normalizeProfile(data));
      return;
    }

    if (error) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: userId, plan: "free", invoice_count: 0 })
        .select()
        .single();

      if (created) {
        setProfile(normalizeProfile(created));
      }
    }
  };

  const updateInvoiceCount = async (count: number) => {
    if (!session || !profile) return;
    if (profile.invoice_count === count) return;
    const { data } = await supabase
      .from("profiles")
      .update({ invoice_count: count })
      .eq("id", session.user.id)
      .select()
      .single();
    if (data) {
      setProfile(normalizeProfile(data));
    }
  };

  const refreshInvoicesForUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setInvoices(data as Invoice[]);
      await saveLocalInvoices(data as Invoice[]);
      await updateInvoiceCount(data.length);
      return;
    }

    const local = await loadLocalInvoices();
    setInvoices(local);
    await updateInvoiceCount(local.length);
  };

  const refreshInvoices = async () => {
    if (!session) return;
    await refreshInvoicesForUser(session.user.id);
  };

  const createInvoice = async (input: InvoiceInput): Promise<CreateInvoiceResult> => {
    if (!session) return { ok: false, message: "Please sign in to continue." };

    const plan = isPro ? "pro" : profile?.plan ?? "free";
    const count = profile?.invoice_count ?? invoices.length;
    if (isInvoiceLimitReached(plan, count)) {
      return {
        ok: false,
        message: `Free plan is limited to ${FREE_INVOICE_LIMIT} invoices.`,
      };
    }

    const invoiceId = Crypto.randomUUID();
    const now = new Date();
    const invoice: Invoice = {
      id: invoiceId,
      user_id: session.user.id,
      client_name: input.clientName,
      service_description: input.serviceDescription,
      amount: input.amount,
      currency: input.currency,
      payment_method: input.paymentMethod,
      date: input.date,
      created_at: now.toISOString(),
      local_uri: null,
      pdf_url: null,
      pdf_path: null,
    };

    const watermark = getInvoiceWatermarkState(plan);
    const html = buildInvoiceHtml(invoice, { watermark });
    const pdf = await generateInvoicePdf(html);
    const localUri = await savePdfLocally(invoiceId, pdf.uri);
    const { storagePath, publicUrl } = await uploadPdfToSupabase(
      session.user.id,
      invoiceId,
      pdf.uri
    );

    const payload: Invoice = {
      ...invoice,
      local_uri: localUri,
      pdf_url: publicUrl,
      pdf_path: storagePath,
    };

    await supabase.from("invoices").insert(payload);
    const updated = [payload, ...invoices];
    setInvoices(updated);
    await saveLocalInvoices(updated);
    await updateInvoiceCount(updated.length);

    return { ok: true };
  };

  const duplicateInvoice = async (
    invoiceId: string
  ): Promise<CreateInvoiceResult> => {
    const source = invoices.find((item) => item.id === invoiceId);
    if (!source) return { ok: false, message: "Invoice not found." };

    return createInvoice({
      clientName: source.client_name,
      serviceDescription: source.service_description,
      amount: source.amount,
      currency: source.currency,
      paymentMethod: source.payment_method,
      date: formatDateISO(new Date()),
    });
  };

  const deleteInvoice = async (invoiceId: string) => {
    const target = invoices.find((item) => item.id === invoiceId);
    if (!target || !session) return;

    await supabase.from("invoices").delete().eq("id", invoiceId);

    if (target.pdf_path) {
      await supabase.storage.from("invoices").remove([target.pdf_path]);
    }

    if (target.local_uri) {
      await FileSystem.deleteAsync(target.local_uri, { idempotent: true });
    }

    const updated = invoices.filter((item) => item.id !== invoiceId);
    setInvoices(updated);
    await saveLocalInvoices(updated);
    await updateInvoiceCount(updated.length);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await safeRevenueCatLogout();
  };

  const purchasePackage = async (
    pkg: PurchasesPackage
  ): Promise<CreateInvoiceResult> => {
    try {
      setPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await handleCustomerInfo(customerInfo);
      return { ok: true };
    } catch (error: any) {
      if (error?.userCancelled) {
        return { ok: false, message: "Purchase cancelled." };
      }
      return { ok: false, message: "Purchase failed. Please try again." };
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async (): Promise<CreateInvoiceResult> => {
    try {
      setPurchasing(true);
      const info = await Purchases.restorePurchases();
      await handleCustomerInfo(info);
      return { ok: true };
    } catch {
      return { ok: false, message: "Restore failed. Please try again." };
    } finally {
      setPurchasing(false);
    }
  };

  const viewInvoice = async (invoice: Invoice) => {
    if (!invoice.local_uri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(invoice.local_uri);
    }
  };

  const value = useMemo(
    () => ({
      session,
      profile,
      invoices,
      loading,
      isPro,
      packages,
      purchasing,
      customerInfo,
      refreshCustomerInfo,
      createInvoice,
      deleteInvoice,
      duplicateInvoice,
      refreshInvoices,
      signOut,
      viewInvoice,
      purchasePackage,
      restorePurchases,
    }),
    [
      session,
      profile,
      invoices,
      loading,
      isPro,
      packages,
      purchasing,
      customerInfo,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

const savePdfLocally = async (invoiceId: string, sourceUri: string) => {
  const folder = `${FileSystem.documentDirectory}proofpay`;
  const directoryInfo = await FileSystem.getInfoAsync(folder);
  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  }
  const destination = `${folder}/invoice-${invoiceId}.pdf`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
};

const uploadPdfToSupabase = async (userId: string, invoiceId: string, uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storagePath = `${userId}/${invoiceId}.pdf`;
  const { data, error } = await supabase.storage
    .from("invoices")
    .upload(storagePath, blob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from("invoices")
    .getPublicUrl(data.path);

  return { storagePath: data.path, publicUrl: publicData.publicUrl };
};

const normalizeProfile = (input: any): Profile => ({
  ...input,
  invoice_count: input.invoice_count ?? 0,
});

const getRevenueCatApiKey = () => {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_RC_IOS_API_KEY ?? "";
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY ?? "";
  }
  return "";
};

const entitlementId = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID ?? "pro";

