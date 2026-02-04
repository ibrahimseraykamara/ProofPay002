import * as Print from "expo-print";
import { Invoice } from "./types";
import { formatCurrency, formatDateDisplay } from "./format";

type PdfOptions = {
  watermark: boolean;
};

export const buildInvoiceHtml = (invoice: Invoice, options: PdfOptions) => {
  const amount = formatCurrency(invoice.amount, invoice.currency);
  const date = formatDateDisplay(invoice.date);
  const watermarkHtml = options.watermark
    ? `<div class="watermark">PROOFPAY FREE</div>`
    : "";

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
          .container { border: 1px solid #e5e7eb; padding: 32px; border-radius: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 28px; font-weight: 700; }
          .badge { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; }
          .section { margin-top: 24px; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; }
          .value { font-size: 16px; margin-top: 6px; }
          .amount { font-size: 24px; font-weight: 700; margin-top: 8px; }
          .row { display: flex; justify-content: space-between; gap: 24px; }
          .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
          .watermark { position: fixed; top: 45%; left: 10%; right: 10%; text-align: center;
            font-size: 48px; color: rgba(17, 24, 39, 0.08); transform: rotate(-15deg); }
          .footer { margin-top: 24px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        ${watermarkHtml}
        <div class="container">
          <div class="header">
            <div>
              <div class="title">Invoice</div>
              <div class="badge">ProofPay</div>
            </div>
            <div>
              <div class="label">Date</div>
              <div class="value">${date}</div>
            </div>
          </div>

          <div class="section">
            <div class="label">Billed To</div>
            <div class="value">${invoice.client_name}</div>
          </div>

          <div class="section">
            <div class="label">Service Description</div>
            <div class="value">${invoice.service_description}</div>
          </div>

          <div class="divider"></div>

          <div class="row">
            <div>
              <div class="label">Payment Method</div>
              <div class="value">${invoice.payment_method}</div>
            </div>
            <div>
              <div class="label">Amount</div>
              <div class="amount">${amount}</div>
            </div>
          </div>

          <div class="footer">
            Payment proof generated with ProofPay. Keep this receipt for your records.
          </div>
        </div>
      </body>
    </html>
  `;
};

export const generateInvoicePdf = async (html: string) => {
  return Print.printToFileAsync({ html });
};
