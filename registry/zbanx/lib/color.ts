let context: CanvasRenderingContext2D | null = null;

const SENTINEL = "#010101";
const SENTINEL_SERIALIZED = "rgb(1, 1, 1)";

/**
 * 将 zrender 颜色插值解析器不支持的 CSS 颜色（oklch/lab/color() 等）
 * 转换为 rgba 字符串，保证 echarts hover 状态过渡可正常插值。
 */
export function resolveCssColor(color: string, fallback: string): string {
  if (typeof document === "undefined") return fallback || color;
  context ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!context) return fallback;
  const ctx = context;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = SENTINEL;
  ctx.fillStyle = color || fallback;
  if (ctx.fillStyle === SENTINEL_SERIALIZED && color !== SENTINEL) {
    return fallback;
  }
  ctx.fillRect(0, 0, 1, 1);
  const pixel = ctx.getImageData(0, 0, 1, 1).data;
  const alpha = pixel[3] ?? 0;
  if (alpha === 0) return fallback;
  return `rgba(${pixel[0] ?? 0}, ${pixel[1] ?? 0}, ${pixel[2] ?? 0}, ${(
    alpha / 255
  ).toFixed(3)})`;
}
