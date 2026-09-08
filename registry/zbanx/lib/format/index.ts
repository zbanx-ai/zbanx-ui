import { formatNumber as formatFormationNumber } from "../number/formation";

/** 格式化数字，不自动追加 K、M、B 等单位。 */
export function formatNumber(value: number): string {
  return formatFormationNumber(value, { autoFormat: false });
}

/** 格式化可选数字；值为空时返回占位符。 */
export function formatOptionalNumber(value: number | null): string {
  return value == null ? "—" : formatNumber(value);
}

/** 按美元等货币格式化金额，默认不显示小数位。 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** 将 ISO 日期字符串格式化为中文短日期；无效日期返回原字符串。 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(date);
}

/** 格式化百分比变化，并为非负值添加正号。 */
export function formatPercentChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

/** 将秒数格式化为分钟和秒；不足一分钟时仅显示秒数。 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}秒`;
  return rest === 0 ? `${minutes}min` : `${minutes}min${rest}s`;
}

const byteUnits = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/** 将字节数按 1024 进制格式化为带单位的文件大小。 */
export function formatBytes(bytes: number): string {
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < byteUnits.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return unitIndex === 0
    ? `${value} ${byteUnits[unitIndex]}`
    : `${value.toFixed(1)} ${byteUnits[unitIndex]}`;
}
