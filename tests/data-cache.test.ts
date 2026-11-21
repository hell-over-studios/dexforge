/**
 * UX-05 (#81): every island on a page shares one download per dataset.
 * `fetch` is stubbed; no network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDataCache, loadGame, loadTypeMeta } from '../src/lib/dex';

const okJson = (body: unknown) =>
  ({ ok: true, json: () => Promise.resolve(body) }) as unknown as Response;
const notFound = { ok: false, json: () => Promise.resolve({}) } as unknown as Response;

describe('shared data cache', () => {
  beforeEach(() => clearDataCache());
  afterEach(() => vi.unstubAllGlobals());

  it('downloads a game dataset once for concurrent callers', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(okJson({ pokemon: [] })));
    vi.stubGlobal('fetch', fetchMock);
    const [a, b, c] = await Promise.all([
      loadGame('emerald'),
      loadGame('emerald'),
      loadGame('emerald'),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('keeps one entry per game', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(okJson({ pokemon: [] })));
    vi.stubGlobal('fetch', fetchMock);
    await loadGame('emerald');
    await loadGame('red-blue');
    await loadGame('emerald');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('forgets a failed load so the next call retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(notFound)
      .mockResolvedValueOnce(okJson({ pokemon: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadGame('emerald')).rejects.toThrow(/dataset does not exist/);
    await expect(loadGame('emerald')).resolves.toEqual({ pokemon: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares types.json too and fails open with empty metadata', async () => {
    const types = {
      types: [{ slug: 'fire', color: '#ff7043', name: { es: 'Fuego', en: 'Fire' } }],
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(notFound).mockResolvedValue(okJson(types));
    vi.stubGlobal('fetch', fetchMock);
    expect(await loadTypeMeta()).toEqual({ colors: {}, names: {} });
    const [x, y] = await Promise.all([loadTypeMeta(), loadTypeMeta()]);
    expect(x.colors.fire).toBe('#ff7043');
    expect(y.names.fire).toEqual({ es: 'Fuego', en: 'Fire' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
