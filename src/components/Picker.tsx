/**
 * Pokémon picker island (T2.5) — searchable pixel-cozy list with full keyboard
 * navigation (combobox/listbox ARIA pattern), ES default labels, empty/loading
 * states, and a minimal selection summary (full detail drawer is T2.6).
 * Data comes from the static /public/data/<game>.json via loadDexIndex();
 * the deployed site never calls PokeAPI.
 */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import PokemonDetail from './PokemonDetail';
import { loadGame, loadTypeColors, searchDex, buildDexIndex, type DexEntry } from '../lib/dex';
import type { GameData } from '../lib/data-schema';

interface Props {
  gameId: string;
}

const PAGE = 60;

export default function Picker({ gameId }: Props) {
  const [entries, setEntries] = useState<DexEntry[] | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCount, setShowCount] = useState(PAGE);
  const [selected, setSelected] = useState<DexEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGame(gameId)
      .then((data) => {
        if (!cancelled) {
          setGame(data);
          setEntries(buildDexIndex(data));
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    /* type badge colors are cosmetic — fail open with neutral chips */
    loadTypeColors().then((c) => {
      if (!cancelled) setColors(c);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const results = useMemo(() => (entries ? searchDex(entries, query) : []), [entries, query]);
  const visible = results.slice(0, showCount);
  /* current UI language at render time (ES default, ?lang=en supported) */
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';
  const oneIndexed = (i: number) => i + 1;

  const resetWindow = () => {
    setShowCount(PAGE);
    setActiveIdx(0);
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (!entries) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      const needsMore = activeIdx >= visible.length - 1 && showCount < results.length;
      if (needsMore) setShowCount(showCount + PAGE);
      setActiveIdx(Math.min(activeIdx + 1, results.length - 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActiveIdx(Math.max(activeIdx - 1, 0));
    } else if (ev.key === 'Enter') {
      const pick = visible[activeIdx];
      if (pick) {
        ev.preventDefault();
        setSelected(pick);
        setQuery('');
        resetWindow();
      }
    } else if (ev.key === 'Escape') {
      setQuery('');
      resetWindow();
    }
  };

  const pick = (entry: DexEntry, idx: number) => {
    setSelected(entry);
    setActiveIdx(idx);
  };

  if (loadError) {
    return (
      <div className="rounded-sm border-2 border-bark-700 bg-bark-900 p-6 shadow-pixel">
        <p role="alert" className="font-display text-lg text-parchment-100">
          Algo se rompió en la forja
        </p>
        <p className="mt-2 text-sm text-parchment-400">
          No se pudo cargar el Pokédex de {gameId}. Recarga la página e inténtalo otra vez.
        </p>
      </div>
    );
  }

  if (!entries) {
    return (
      <div
        aria-busy="true"
        className="rounded-sm border-2 border-bark-700 bg-bark-900 dither p-6 shadow-pixel"
      >
        <p className="animate-blink font-display text-lg text-parchment-100">
          Cargando el Pokédex…
        </p>
      </div>
    );
  }

  const activeId = visible[activeIdx] ? `picker-opt-${activeIdx}` : undefined;

  return (
    <div className="rounded-sm">
      <label htmlFor="picker-input" className="font-display text-sm text-parchment-400">
        Buscar Pokémon
      </label>
      <input
        id="picker-input"
        role="combobox"
        type="text"
        autoComplete="off"
        aria-expanded="true"
        aria-controls="picker-list"
        aria-describedby="picker-help"
        aria-activedescendant={activeId}
        value={query}
        placeholder={lang === 'en' ? 'Name or number…' : 'Nombre o número…'}
        onKeyDown={onKeyDown}
        onChange={(ev) => {
          setQuery(ev.currentTarget.value);
          resetWindow();
        }}
        className="mt-2 block w-full rounded-sm border-2 border-bark-700 bg-bark-950 px-3 py-2 font-body text-parchment-100 shadow-pixel-sm placeholder:text-parchment-600"
      />
      <p id="picker-help" className="mt-2 text-xs text-parchment-600">
        {lang === 'en'
          ? 'Arrow keys to move, Enter to add, Escape to clear.'
          : 'Flechas para moverte, Enter para añadir, Escape para limpiar.'}
      </p>

      {selected && game
        ? /* Full detail drawer (T2.6) — shows immediately under the input */
          (() => {
            const mon = game.pokemon.find((p) => p.id === selected.id);
            if (!mon) return null;
            return (
              <div className="mt-3">
                <PokemonDetail
                  key={mon.id}
                  mon={mon}
                  colors={colors}
                  onClose={() => setSelected(null)}
                />
              </div>
            );
          })()
        : null}

      <ul
        id="picker-list"
        role="listbox"
        aria-label={lang === 'en' ? 'Matching Pokémon' : 'Pokémon coincidentes'}
        className="mt-3 grid gap-2"
      >
        {visible.map((entry, idx) => (
          <li
            key={entry.slug}
            role="option"
            id={`picker-opt-${idx}`}
            aria-selected={idx === activeIdx}
            onClick={() => pick(entry, idx)}
            className={
              'flex cursor-pointer items-center gap-3 rounded-sm border-2 bg-bark-900 p-2 shadow-pixel-sm ' +
              (idx === activeIdx
                ? 'border-ember-500 bg-bark-800'
                : 'border-bark-800 hover:border-ember-600')
            }
          >
            {entry.spriteUrl ? (
              // game sprite: keep it pixel-crisp (ADR-008)
              <img
                src={entry.spriteUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                width={64}
                height={64}
                className="size-12 shrink-0 [object-fit:contain] pixelated"
              />
            ) : (
              <span
                className="size-12 shrink-0 rounded-sm border-2 border-bark-800 bg-bark-950"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="font-display text-base text-parchment-100">{entry.name[lang]}</span>
              <span className="ml-2 text-xs text-parchment-600">
                n.º {entry.id} · dex {entry.dexNumber}
              </span>
              <span className="mt-1 flex gap-1">
                {entry.types.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border border-bark-700 px-1 text-[10px] tracking-wide text-parchment-400 uppercase"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {query !== '' && results.length === 0 ? (
        <div className="mt-3 rounded-sm border-2 border-bark-700 bg-bark-900 p-4 shadow-pixel">
          <p className="font-display text-sm text-parchment-400">
            {lang === 'en'
              ? `No Pokémon matches "${query}"`
              : `Ningún Pokémon coincide con "${query}"`}
          </p>
        </div>
      ) : null}

      {results.length > showCount ? (
        <button
          type="button"
          onClick={() => {
            setShowCount(showCount + PAGE);
          }}
          className="mt-3 block w-full cursor-pointer rounded-sm border-2 border-bark-700 bg-bark-800 px-3 py-2 font-display text-sm text-parchment-100 shadow-pixel-sm hover:border-ember-600"
        >
          {lang === 'en'
            ? `More (${results.length - showCount} remaining)`
            : `Más (${results.length - showCount} restantes)`}
        </button>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {lang === 'en'
          ? `${results.length} results, ${activeIdx + 1} highlighted`
          : `${results.length} resultados, ${oneIndexed(activeIdx)} resaltado`}
      </p>
    </div>
  );
}
