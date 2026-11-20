import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  normalizePlaceEn,
  translatePlaceEs,
  type PlaceDictionary,
} from '../scripts/lib/place-names';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curated = JSON.parse(
  readFileSync(path.join(ROOT, 'data', 'curated', 'place-names.json'), 'utf-8'),
) as { places: PlaceDictionary; enFixes: PlaceDictionary };
const dict = curated.places;

describe('translatePlaceEs', () => {
  it('turns routes into "Ruta N" without needing the dictionary', () => {
    expect(translatePlaceEs('Road 102', {})).toBe('Ruta 102');
    expect(translatePlaceEs('Road 124 (underwater)', {})).toBe('Ruta 124 (bajo el agua)');
  });

  it('keeps floor codes and translates qualifier words', () => {
    expect(translatePlaceEs('Granite Cave (B1F)', dict)).toBe('Cueva Granito (B1F)');
    expect(translatePlaceEs('Meteor Falls (back/small room)', dict)).toBe(
      'Cataratas Meteoro (fondo/sala pequeña)',
    );
    expect(translatePlaceEs('Safari Zone (Area 1, east)', dict)).toBe('Zona Safari (zona 1, este)');
    expect(translatePlaceEs('Safari Zone (NW/mach bike area)', dict)).toBe(
      'Zona Safari (NO/zona de la bici carrera)',
    );
  });

  it('localizes places nested inside qualifiers', () => {
    expect(translatePlaceEs('Road 2 (south, towards Viridian City)', dict)).toBe(
      'Ruta 2 (sur, hacia Ciudad Verde)',
    );
    expect(translatePlaceEs('Pokemon Center (Road 4)', dict)).toBe('Centro Pokémon (Ruta 4)');
    expect(translatePlaceEs('Dark Cave (Violet City entrance)', dict)).toBe(
      'Cueva Oscura (entrada de Ciudad Malva)',
    );
    expect(translatePlaceEs('Weather Institute (Road 119)', dict)).toBe(
      'Instituto Meteorológico (Ruta 119)',
    );
  });

  it('prefers a whole-name dictionary hit over parsing', () => {
    expect(translatePlaceEs('Shoal-cave-low-tide', dict)).toBe('Cueva Cardumen (marea baja)');
  });

  it('returns null for unknown places instead of guessing', () => {
    expect(translatePlaceEs('Terra Cave', dict)).toBeNull();
    expect(translatePlaceEs('Desert Underpass (B1F)', dict)).toBeNull();
  });
});

describe('normalizePlaceEn', () => {
  it('says Route like the English games', () => {
    expect(normalizePlaceEn('Road 2 (north, towards Pewter City)')).toBe(
      'Route 2 (north, towards Pewter City)',
    );
  });

  it('applies curated English fixes before normalizing', () => {
    expect(normalizePlaceEn('Wandert durch Johto', curated.enFixes)).toBe('Roaming Johto');
    expect(normalizePlaceEn('Shoal-cave-b2f', curated.enFixes)).toBe('Shoal Cave (B2F)');
  });
});
