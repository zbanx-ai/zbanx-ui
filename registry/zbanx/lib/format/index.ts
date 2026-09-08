import { formatNumber as formatFormationNumber } from "../number/formation";

export function formatNumber(value: number): string {
  return formatFormationNumber(value, { autoFormat: false });
}

export function formatOptionalNumber(value: number | null): string {
  return value == null ? "—" : formatNumber(value);
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(date);
}

export function formatPercentChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}秒`;
  return rest === 0 ? `${minutes}min` : `${minutes}min${rest}s`;
}
