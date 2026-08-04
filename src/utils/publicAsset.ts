const ABSOLUTE_URL_PATTERN = /^(?:https?:|data:|blob:)/i;

function getRuntimePublicBaseUrl() {
  if (typeof document !== 'undefined') {
    const assetScript = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]');
    if (assetScript?.src) {
      return new URL('..', assetScript.src).href;
    }
  }

  if (typeof window !== 'undefined') {
    return new URL(import.meta.env.BASE_URL || '/', window.location.href).href;
  }

  return import.meta.env.BASE_URL || '/';
}

export function resolvePublicAssetUrl(path: string) {
  if (!path || ABSOLUTE_URL_PATTERN.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(normalizedPath, getRuntimePublicBaseUrl()).href;
}

export const DEFAULT_PRODUCT_ICON_URL = resolvePublicAssetUrl('product-icon.jpg');
