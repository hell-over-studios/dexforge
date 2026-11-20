/**
 * Pokémon picker island (T2.5) — searchable pixel-cozy list with full keyboard
 * navigation (combobox/listbox ARIA pattern), ES default labels, empty/loading
 * states. The detail drawer expands IN PLACE, right under the selected row
 * (owner request 2026-11-08) instead of pinning to the top.
 * Data comes from the static /public/data/<game>.json via loadGame();
 * the deployed site never calls PokeAPI.
 * ADR-012 «Revista»: the index column of the workbench — it scrolls on its
 * own on desktop; the team sheet is its own island above it.
 */
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import PokemonDetail from './PokemonDetail';
import { loadGame, loadTypeMeta, searchDex, buildDexIndex, type DexEntry } from '../lib/dex';
import { typeChipStyle } from '../lib/contrast';
import { useLang } from '../lib/use-lang';
import { NO_TEAM, useTeamStore } from '../lib/team';
import { OPEN_MEMBER_EVENT, type OpenMemberDetail } from '../lib/events';
import type { GameData, GamePokemon, LocalizedText } from '../lib/data-schema';

interface Props {
  gameId: string;
}

const PAGE = 60;

export default function Picker({ gameId }: Props) {
  const [entries, setEntries] = useState<DexEntry[] | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [typeNames, setTypeNames] = useState<Record<string, LocalizedText>>({});
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCount, setShowCount] = useState(PAGE);
  const [selected, setSelected] = useState<DexEntry | null>(null);
  /** the in-place drawer <li>; scrolled into view whenever selection changes */
  const detailRef = useRef<HTMLLIElement | null>(null);

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
    /* type badge colors/labels are cosmetic — fail open with neutral chips */
    loadTypeMeta().then(({ colors: typeColors, names }) => {
      if (!cancelled) {
        setColors(typeColors);
        setTypeNames(names);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  /* UX-01: a click on a "Tu sexteto" card opens that member here, under its row */
  useEffect(() => {
    if (!entries) return;
    const onOpen = (ev: Event) => {
      const id = (ev as CustomEvent<OpenMemberDetail>).detail?.id;
      const idx = entries.findIndex((e) => e.id === id);
      if (idx < 0) return;
      setQuery('');
      setShowCount(PAGE * (Math.floor(idx / PAGE) + 1));
      setActiveIdx(idx);
      /* a fresh object so re-opening the same member scrolls to it again */
      setSelected({ ...entries[idx] });
    };
    window.addEventListener(OPEN_MEMBER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MEMBER_EVENT, onOpen);
  }, [entries]);

  /* expand-in-place: after every selection, keep the drawer on screen with the
     smallest possible scroll (nearest) — smooth, unless reduced motion is on */
  useEffect(() => {
    if (!selected) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    detailRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [selected]);

  const results = useMemo(() => (entries ? searchDex(entries, query) : []), [entries, query]);
  const visible = results.slice(0, showCount);
  /* where the drawer sits: under the selected row when it is on screen, above
     the list otherwise (e.g. the selection outlived a narrowed query) */
  const selIdx = selected ? visible.findIndex((e) => e.id === selected.id) : -1;
  /* current UI language at render time (ES default, ?lang=en supported) */
  const lang = useLang();
  /* ids in the team store (subscribed so the drawer and share panel re-render) */
  const teamIds = useTeamStore((s) => s.teams[gameId] ?? NO_TEAM);
  /* resolved team members; T4.4 uses them to highlight shared abilities */
  const teamMons = useMemo(
    () =>
      game
        ? teamIds
            .map((id) => game.pokemon.find((p) => p.id === id))
            .filter((m): m is GamePokemon => m !== undefined)
        : [],
    [game, teamIds],
  );
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
        /* clearing the query restores the full list; extend the shown window so
           the chosen entry keeps its row (and the drawer under it) on screen */
        const fullIdx = entries.findIndex((e) => e.id === pick.id);
        if (fullIdx >= PAGE) {
          setShowCount(PAGE * (Math.floor(fullIdx / PAGE) + 1));
          setActiveIdx(fullIdx);
        } else {
          resetWindow();
        }
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
      <div className="paper-panel p-6">
        <p role="alert" className="font-display text-lg text-ink-950">
          Algo se rompió en la forja
        </p>
        <p className="mt-2 text-sm text-ink-600">
          No se pudo cargar el Pokédex de {gameId}. Recarga la página e inténtalo otra vez.
        </p>
      </div>
    );
  }

  if (!entries) {
    return (
      <div aria-busy="true" className="paper-panel paper-grain p-6">
        <p className="animate-blink font-display text-lg text-ink-950">Cargando el Pokédex…</p>
      </div>
    );
  }

  const activeId = visible[activeIdx] ? `picker-opt-${activeIdx}` : undefined;

  return (
    <div className="paper-panel flex flex-col lg:max-h-[calc(100dvh-7rem)]">
      <div className="border-b-[3px] border-ink-950 p-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="kicker text-xs text-magenta-600">{lang === 'en' ? 'Index' : 'Índice'}</p>
            <h2 className="mt-0.5 font-headline text-3xl leading-none text-ink-950 uppercase">
              {lang === 'en' ? 'Search & add' : 'Busca y añade'}
            </h2>
          </div>
          <p className="kicker text-xs text-ink-600">
            {entries.length} {lang === 'en' ? 'species' : 'especies'}
          </p>
        </div>

        <label htmlFor="picker-input" className="mt-4 block kicker text-xs text-ink-700">
          {lang === 'en' ? 'Search Pokémon' : 'Buscar Pokémon'}
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
          className="mt-2 block w-full border-2 border-ink-950 bg-ember-300/50 px-3 py-2.5 font-body text-base font-semibold text-ink-950 shadow-pixel-sm placeholder:font-normal placeholder:text-ink-600 focus:bg-paper-50"
        />
        <p id="picker-help" className="mt-2 text-xs text-ink-600">
          {lang === 'en'
            ? 'Arrow keys to move, Enter to add, Escape to clear.'
            : 'Flechas para moverte, Enter para añadir, Escape para limpiar.'}
        </p>
      </div>

      {/* the index scrolls on its own on desktop so the team and analysis stay in view */}
      <div className="max-h-[70vh] min-h-0 flex-1 overflow-y-auto p-4 sm:px-5 lg:max-h-none">
        {selected && game && selIdx === -1
          ? /* Detail drawer (T2.6) fallback — the selected row is not in the visible
               window, so the panel cosplays as a top banner until it reappears. */
            (() => {
              const mon = game.pokemon.find((p) => p.id === selected.id);
              if (!mon) return null;
              return (
                <div className="mt-3">
                  <PokemonDetail
                    key={mon.id}
                    mon={mon}
                    gameId={gameId}
                    colors={colors}
                    typeNames={typeNames}
                    abilities={game.abilities}
                    moveDex={game.moves}
                    team={teamMons}
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
            <Fragment key={entry.slug}>
              <li
                role="option"
                id={`picker-opt-${idx}`}
                aria-selected={idx === activeIdx}
                onClick={() => pick(entry, idx)}
                className={
                  'flex cursor-pointer items-center gap-3 border-2 p-2 transition-colors ' +
                  (idx === activeIdx
                    ? 'border-ink-950 bg-ember-400/70 shadow-pixel-sm'
                    : 'border-ink-900/20 bg-paper-50 hover:border-ink-700 hover:bg-paper-100')
                }
              >
                {entry.spriteUrl ? (
                  // official artwork (owner directive): smooth render
                  <img
                    src={entry.spriteUrl}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                    className="size-12 shrink-0 [object-fit:contain]"
                  />
                ) : (
                  <span
                    className="size-12 shrink-0 border-2 border-ink-900/20 bg-paper-100"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-display text-base text-ink-950">{entry.name[lang]}</span>
                  <span className="ml-2 text-xs text-ink-600">
                    n.º {entry.id} · dex {entry.dexNumber}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {entry.types.map((t) => (
                      <span
                        key={t}
                        className="type-chip"
                        style={typeChipStyle(colors[t] ?? '#dcc49a')}
                      >
                        {typeNames[t]?.[lang] ?? t}
                      </span>
                    ))}
                  </span>
                </span>
              </li>
              {/* the drawer expands IN PLACE, right under the clicked row */}
              {selected && game && entry.id === selected.id
                ? (() => {
                    const mon = game.pokemon.find((p) => p.id === selected.id);
                    if (!mon) return null;
                    return (
                      <li ref={detailRef} role="presentation" className="list-none pt-1">
                        <PokemonDetail
                          key={mon.id}
                          mon={mon}
                          gameId={gameId}
                          colors={colors}
                          typeNames={typeNames}
                          abilities={game.abilities}
                          moveDex={game.moves}
                          team={teamMons}
                          onClose={() => setSelected(null)}
                        />
                      </li>
                    );
                  })()
                : null}
            </Fragment>
          ))}
        </ul>

        {query !== '' && results.length === 0 ? (
          <div className="mt-3 border-2 border-dashed border-ink-900/40 bg-paper-50 p-4">
            <p className="font-display text-sm text-ink-600">
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
            className="pixel-btn pixel-btn-paper mt-3 w-full"
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
    </div>
  );
}
