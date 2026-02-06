import { Plan } from "./types";

export const FREE_INVOICE_LIMIT = 3;

export const isInvoiceLimitReached = (plan: Plan, count: number) => {
  if (plan === "pro") return false;
  return count >= FREE_INVOICE_LIMIT;
};

export const getInvoiceWatermarkState = (plan: Plan) => {
  if (plan === "pro") return false;
  return true;
};
