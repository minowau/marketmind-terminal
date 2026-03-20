export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function formatCurrency(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function sentimentColor(sentiment: "positive" | "negative" | "neutral"): string {
  switch (sentiment) {
    case "positive": return "text-success";
    case "negative": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

export function scoreColor(score: number): string {
  if (score > 1) return "text-success";    // Strong BUY (Green)
  if (score > 0) return "text-success/70"; // Mild BUY (Green)
  if (score < -1) return "text-destructive"; // Strong SHORT
  if (score < 0) return "text-destructive/70"; // Mild SHORT
  return "text-warning";                   // Neutral
}
