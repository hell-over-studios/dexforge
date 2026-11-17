/**
 * Readable text color for a solid background chip.
 *
 * Canonical type colors range from pale (grass, electric) to dark (steel,
 * poison), so a single ink color cannot stay AA-compliant on all of them.
 * Pick whichever of the two house text colors has the higher WCAG contrast
 * against the chip background.
 */
const INK = '#1a140d'; // --color-ink-950
const PAPER = '#fbf5e6'; // --color-paper-50

const parse = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (rgb: [number, number, number]): number =>
  0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

/** WCAG 2.x contrast ratio between two hex colors (1–21); invalid colors fail closed to 1. */
export function contrastRatio(a: string, b: string): number {
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return 1;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Ink or paper text, whichever is more legible on the given chip color. */
export function readableInk(background: string): string {
  return contrastRatio(background, INK) >= contrastRatio(background, PAPER) ? INK : PAPER;
}

const mix = (from: string, to: string, amount: number): string => {
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return from;
  const channelHex = (i: number) =>
    Math.round(a[i] * (1 - amount) + b[i] * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${channelHex(0)}${channelHex(1)}${channelHex(2)}`;
};

export interface TypeChipStyle {
  backgroundColor: string;
  color: string;
}

/**
 * Background + text for a solid type chip.
 *
 * Most canonical colors clear AA with ink or paper text. A few mid-luminance
 * ones (poison) clear neither, so they are nudged toward ink until the paper
 * text is legible; the hue still reads as the canonical type color.
 */
export function typeChipStyle(background: string): TypeChipStyle {
  const ink = contrastRatio(background, INK);
  const paper = contrastRatio(background, PAPER);
  if (Math.max(ink, paper) >= 4.5) {
    return { backgroundColor: background, color: ink >= paper ? INK : PAPER };
  }
  for (const amount of [0.15, 0.25, 0.35, 0.45, 0.55]) {
    const bg = mix(background, INK, amount);
    if (contrastRatio(bg, PAPER) >= 4.5) return { backgroundColor: bg, color: PAPER };
  }
  return { backgroundColor: mix(background, INK, 0.65), color: PAPER };
}
