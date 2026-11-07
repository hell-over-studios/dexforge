/**
 * Deploy path helpers (ADR-011): GitHub Pages serves the site under a base
 * path (/dexforge), so all internal URLs must be prefixed with BASE_URL.
 * Astro's import.meta.env.BASE_URL may carry a trailing slash depending on
 * config; normalize here so callers never worry.
 */
const base = import.meta.env.BASE_URL;

/** e.g. '/dexforge' (no trailing slash) */
export const siteBase: string = base.endsWith('/') ? base.slice(0, -1) : base;

/** Prefix any root-relative path with the deploy base: withBase('juego/x') */
export const withBase = (path: string): string => `${siteBase}/${path}`;
