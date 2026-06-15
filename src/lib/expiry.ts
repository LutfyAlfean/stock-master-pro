export type ExpiryStatus = "aman" | "perlu-dipantau" | "hati-hati" | "kadaluarsa";

export function getExpiryStatus(date: string | null | undefined): ExpiryStatus | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(date);
  exp.setHours(0, 0, 0, 0);
  const days = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "kadaluarsa";
  if (days <= 7) return "hati-hati";
  if (days <= 30) return "perlu-dipantau";
  return "aman";
}

export const statusLabel: Record<ExpiryStatus, string> = {
  "aman": "Aman",
  "perlu-dipantau": "Perlu Dipantau",
  "hati-hati": "Hati-Hati",
  "kadaluarsa": "Kadaluarsa",
};

export function formatTanggal(d: string | Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
