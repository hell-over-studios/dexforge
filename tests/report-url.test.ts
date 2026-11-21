/** UX-14 (#90): the report link opens the data-correction form, prefilled. */
import { describe, expect, it } from 'vitest';
import { reportUrl } from '../src/components/PokemonDetail';

describe('reportUrl', () => {
  it('targets the data-correction template with game, species and page', () => {
    const url = new URL(reportUrl('emerald', 'feebas'));
    expect(url.origin + url.pathname).toBe(
      'https://github.com/hell-over-studios/dexforge/issues/new',
    );
    expect(url.searchParams.get('template')).toBe('data_correction.yml');
    expect(url.searchParams.get('title')).toBe('[data] emerald: feebas');
    expect(url.searchParams.get('game')).toBe('emerald');
    expect(url.searchParams.get('entries')).toContain('/dexforge/juego/emerald');
  });
});
