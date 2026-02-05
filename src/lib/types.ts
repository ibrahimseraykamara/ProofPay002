export type Plan = "free" | "pro";

export type Profile = {
  id: string;
  plan: Plan;
  invoice_count: number;
  created_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_name: string;
  service_description: string;
  amount: number;
  currency: string;
  payment_method: string;
  date: string;
  created_at: string;
  local_uri: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
};

export type InvoiceInput = {
  clientName: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  date: string;
};
