/**
 * 生成绝对 URL
 * @param url
 * @returns
 */
export function getAbsoluteUrl(url?: string | null) {
  if (!url) {
    return "";
  }
  return isAbsoluteUrl(url) ? url : `https://${url}`;
}

/**
 * 判断一个 URL 是否为绝对 URL
 * @param url
 * @returns
 */
export function isAbsoluteUrl(url: string) {
  return /^(?:[a-z][a-z0-9\-.+]*:)?\/\//i.test(url);
}

/**
 * 生成 youtube 的搜索链接
 * @param query
 * @returns {string}
 *
 * @example
 * getYoutubeSearchUrl("Xiaomi 15 Ultra vs Huawei Pura 80 Pro+")
 * // https://www.youtube.com/results?search_query=Xiaomi+15+Ultra+vs+Huawei+Pura+80+Pro%2B
 */
export function getYoutubeSearchUrl(query: string): string {
  const words = query.split(" ").map(encodeURIComponent);
  return `https://www.youtube.com/results?search_query=${words.join("+")}`;
}

/**
 * 生成 tiktok 的搜索链接
 * @param query
 * @returns {string}
 */
export function getTikTokSearchUrl(query: string): string {
  const words = query.split(" ").map(encodeURIComponent);
  return `https://www.tiktok.com/search?q=${words.join("+")}`;
}
