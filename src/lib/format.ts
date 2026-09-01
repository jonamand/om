export function formatPrice(price: number, currency: string = "USD"): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    XOF: "FCFA",
    GHS: "₵",
    NGN: "₦",
    KES: "KSh",
  };
  const symbol = symbols[currency] ?? currency;
  if (currency === "XOF") {
    return `${Math.round(price).toLocaleString("fr-FR")} ${symbol}`;
  }
  return `${symbol}${price.toFixed(2)}`;
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", opts ?? {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  if (hours > 0) return `il y a ${hours}h`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `il y a ${mins}min`;
  return "à l'instant";
}
