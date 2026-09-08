import { applyThousandSeparator, toRoundFixed } from "./index";

/** 数字格式化选项。 */
export type NumberFormationProps = {
  /**
   * @description 格式化语言；默认使用 en-US
   */
  language?: "zh-CN" | "en-US" | string;

  /**
   * @description 是否自动进行 K、M、B 或 万、亿单位换算
   */
  autoFormat?: boolean;

  /**
   * @description 自动换算时的最小整数位数
   */
  formatScale?: number;

  /**
   * @description 保留的小数位数
   */
  decimalScale?: number;

  /**
   * @description 是否使用千分位分隔符，也可以传入自定义分隔符
   */
  thousandSeparator?: boolean | string;

  /**
   * @description 数字前缀
   */
  prefix?: string;

  /**
   * @description 数字后缀
   */
  suffix?: string;

  /**
   * @description 小数部分为 0 时是否隐藏末尾的 0
   */
  hiddenZero?: boolean;
};

/** 已拆分的数字格式化结果，适合需要分别渲染整数、小数和单位的场景。 */
export type Formation = {
  minus?: string;
  intNumStr: string;
  floatNum: string;
  prefix?: string;
  suffix?: string;
  unit?: string;
};

/** 根据配置拆分数字的符号、整数、小数、单位、前缀和后缀。 */
export function formation(
  value: number,
  options: NumberFormationProps = {}
): Formation {
  const {
    autoFormat = true,
    thousandSeparator = true,
    hiddenZero = true,
    prefix = "",
    suffix = "",
    formatScale = 4,
    decimalScale = 2,
    language = "en-US",
  } = options;

  if (!Number.isFinite(value)) {
    return { minus: "", prefix, intNumStr: "", floatNum: "", unit: "", suffix };
  }

  const minus = value < 0 ? "-" : "";
  const _value = Math.abs(value);

  const valueStr = toRoundFixed(_value, decimalScale).toString();
  const intVal = valueStr.split(".")[0] ?? "0";

  let unit = "";
  let newValue = toRoundFixed(_value, decimalScale);

  if (language === "zh-CN") {
    if (autoFormat && intVal) {
      if (intVal.length >= formatScale + 4) {
        unit = "亿";
        newValue = toRoundFixed(newValue / 100000000, decimalScale);
      } else if (intVal.length >= formatScale) {
        unit = "万";
        newValue = toRoundFixed(newValue / 10000, decimalScale);
      }
    }
  } else {
    if (autoFormat && intVal) {
      if (intVal.length >= formatScale + 6) {
        unit = "B";
        newValue = toRoundFixed(_value / 1000000000, decimalScale);
      } else if (intVal.length >= formatScale + 3) {
        unit = "M";
        newValue = toRoundFixed(_value / 1000000, decimalScale);
      } else if (intVal.length >= formatScale) {
        unit = "K";
        newValue = toRoundFixed(_value / 1000, decimalScale);
      }
    }
  }

  const arrValue = newValue.toString().split(".");
  const intNum = arrValue[0] || "";
  let floatNum = arrValue[1] || "";
  const intNumStr = applyThousandSeparator(intNum, thousandSeparator);
  // 补零
  if (!hiddenZero && !floatNum) {
    floatNum = new Array(decimalScale).fill(0).join("");
  }

  return {
    minus,
    prefix,
    intNumStr,
    floatNum,
    unit,
    suffix,
  };
}

/** 将数字格式化为可直接展示的字符串。默认使用 en-US 和自动单位换算。 */
export function formatNumber(
  value: number,
  options?: NumberFormationProps
): string {
  const { minus, prefix, intNumStr, floatNum, unit, suffix } = formation(
    value,
    options
  );
  const floatNumStr = floatNum ? `.${floatNum}` : "";
  return `${minus}${prefix}${intNumStr}${floatNumStr}${unit}${suffix}`;
}

/** 将带有英文单位的数字还原为原始数值。 */
export function unFormatNumber(
  value: number,
  unit: "K" | "M" | "G" | "T" | string
): number {
  switch (unit) {
    case "K":
      return value * 1000;
    case "M":
      return value * 1000000;
    case "G":
    case "B":
      return value * 1000000000;
    case "T":
      return value * 1000000000000;
    default:
      return value;
  }
}
