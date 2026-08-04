const ABSOLUTE_URL_PATTERN = /^(?:https?:|data:|blob:)/i;

export function resolvePublicAssetUrl(path: string) {
  if (!path || ABSOLUTE_URL_PATTERN.test(path)) return path;

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return `${normalizedBase}${normalizedPath}`;
}

export const DEFAULT_PRODUCT_ICON_URL = resolvePublicAssetUrl('product-icon.jpg');
