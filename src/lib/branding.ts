export const APP_NAME = "AssetSphere";
export const APP_TAGLINE = "Smart Asset Intelligence for Modern Enterprises.";
/** Transparent PNG served from /public */
export const APP_LOGO_SRC = "/assetsphere-logo.png";
/** Sampled from logo artwork (AIM teal) */
export const APP_BRAND_COLOR = "#003040";
export const APP_BRAND_COLOR_LIGHT = "#5a9fad";

export function pageTitle(page: string): string {
  return `${page} — ${APP_NAME}`;
}
