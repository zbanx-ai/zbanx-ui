/** 将字符串转换为数字，无法转换时返回 0。 */
export const toNumber = (value: string): number => {
  const normalized = value.replace(/[^0-9.-]/gi, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

export { formatNumber } from "./formation";

/**
 * 计算数字数组的中位数。
 *
 * 排序时复制数组，避免修改调用方传入的原始数组。
 */
export const median = (arr: number[]): number => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) {
    return 0;
  }
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

/** 为数字字符串添加千分位分隔符。 */
export const applyThousandSeparator = (
  value: string,
  thousandSeparator: boolean | string = ","
): string => {
  if (thousandSeparator === false) {
    return value;
  }
  const reg = /\B(?=(\d{3})+(?!\d))/g;
  if (thousandSeparator === true) {
    return value.replace(reg, ",");
  }
  return value.replace(reg, thousandSeparator);
};

/**
 * 四舍五入并保留指定的小数位数。
 *
 * 返回数字而不是字符串，适合继续参与计算。
 */
export const toRoundFixed = (num: number, scale: number): number => {
  if (!Number.isFinite(num) || !Number.isFinite(scale) || scale < 0) {
    return num;
  }
  const factor = 10 ** Math.floor(scale);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/** 将字符串解析为浮点数，无法解析时返回 0。 */
export const parseNumber = (val: string): number => {
  const value = parseFloat(val);
  return Number.isNaN(value) ? 0 : value;
};

/** 判断值是否为有限数字或合法的数字字符串。 */
export function isRealNumber(v: unknown): v is number {
  if (typeof v === "number") {
    return Number.isFinite(v);
  }
  if (typeof v === "string") {
    const num = parseFloat(v);
    return !Number.isNaN(num) && /^-?\d*\.?\d+$/.test(v);
  }
  return false;
}

/** 判断数字是否位于指定区间内，区间端点顺序不影响结果。 */
export function isBetween(value: number, start: number, end: number): boolean {
  const min = Math.min(start, end);
  const max = Math.max(start, end);

  return value >= min && value <= max;
}

/** 将百分比数字四舍五入到两位小数并添加百分号。 */
export const formatPercentage = (num?: number): string => {
  if (isRealNumber(num)) {
    return `${toRoundFixed(num, 2)}%`;
  }
  return "0%";
};

/** 向上取整并保留指定的小数位数。 */
export function roundUpToNDecimalPlaces(
  value: number,
  decimals: number
): number {
  if (!Number.isFinite(value) || !Number.isFinite(decimals) || decimals < 0) {
    return value;
  }
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

/**
 * 将比例转换为百分比并调整舍入误差，使结果总和为 100。
 *
 * 调整会作用于返回的新数组，不会修改输入数组。
 */
export function adjustRatiosToSum100(values: number[]): number[] {
  // 先计算原始比例
  const ratios = values.map((v) => v * 100);

  // 四舍五入到两位小数
  const rounded = ratios.map((r) => Math.round(r * 100) / 100);

  // 计算差值
  const sum = rounded.reduce((a, b) => a + b, 0);
  const diff = 100 - sum;

  if (Math.abs(diff) < 0.01) return rounded;

  // 找出舍入误差最大的项进行调整
  const errors = ratios
    .map((r, i) => ({
      index: i,
      error: r - (rounded[i] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.error) - Math.abs(a.error));

  // 分配差值到误差最大的项
  const firstError = errors[0];
  if (!firstError) {
    return rounded;
  }
  rounded[firstError.index] =
    Math.round(((rounded[firstError.index] ?? 0) + diff) * 100) / 100;

  return rounded;
}
