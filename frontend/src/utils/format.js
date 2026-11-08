const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatPrice = (value) => currency.format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/** Inline SVG shown when a product image is missing or fails to load. */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#f1f5f9"/>' +
      '<g fill="none" stroke="#94a3b8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="110" y="130" width="180" height="140" rx="12"/>' +
      '<circle cx="160" cy="180" r="14"/>' +
      '<path d="M120 255l55-55 40 40 25-25 50 50"/></g></svg>',
  );

export const onImageError = (event) => {
  if (event.currentTarget.src !== PLACEHOLDER_IMAGE) {
    event.currentTarget.src = PLACEHOLDER_IMAGE;
  }
};

export const ORDER_STATUSES = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export const statusColor = (status) =>
  ({
    PLACED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-amber-100 text-amber-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  })[status] || "bg-slate-100 text-slate-700";
