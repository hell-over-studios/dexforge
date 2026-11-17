import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { contrastRatio, readableInk, typeChipStyle } from '../src/lib/contrast';

interface TypeRecord {
  slug: string;
  color: string;
}

const data = JSON.parse(
  fs.readFileSync(new URL('../public/data/types.json', import.meta.url), 'utf-8'),
) as { types: TypeRecord[] };

describe('readableInk', () => {
  it('puts paper text on dark canonical colors', () => {
    expect(readableInk('#5f636d')).toBe('#fbf5e6'); // steel
  });

  it('keeps ink text on light canonical colors', () => {
    expect(readableInk('#f7d02c')).toBe('#1a140d'); // electric
  });

  it('fails closed to ink on malformed input', () => {
    expect(contrastRatio('nope', '#000000')).toBe(1);
    expect(readableInk('nope')).toBe('#1a140d');
  });
});

describe('typeChipStyle', () => {
  it('reaches AA (4.5:1) for every canonical type color', () => {
    for (const { slug, color } of data.types) {
      const { backgroundColor, color: text } = typeChipStyle(color);
      const ratio = contrastRatio(backgroundColor, text);
      expect(ratio, `${slug} ${color} -> ${backgroundColor}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('darkens a mid-luminance chip instead of leaving it illegible', () => {
    const poison = '#b054cf';
    const style = typeChipStyle(poison);
    expect(style.backgroundColor).not.toBe(poison);
    expect(contrastRatio(style.backgroundColor, style.color)).toBeGreaterThanOrEqual(4.5);
  });
});
