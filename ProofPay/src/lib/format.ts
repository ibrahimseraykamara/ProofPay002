export const formatCurrency = (amount: number, currency: string) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(safeAmount);
};

export const formatDateDisplay = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString();
};

export const formatDateISO = (date: Date) => {
  return date.toISOString().split("T")[0];
};
