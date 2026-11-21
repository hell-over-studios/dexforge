/**
 * Team sheet — "Tu sexteto" (T2.8, restyled for ADR-012 «Revista»).
 * Six magazine cards across the top of the workbench: a halftone block in the
 * member's first type color, a big slot number, the official artwork as a
 * cut-out (owner directive 2026-11-07: artwork only), a rotated name tag, type
 * chips, the v1 role and four move pips colored by move type. Empty slots say
 * what to do next. A click on a card opens that member in the index drawer
 * (UX-01, #77); the ✕ button removes it and a toast offers "Deshacer".
 * Own island: it loads the static per-game dataset itself (no PokeAPI).
 * T2.9: copy-link button (shares `?t=<encoded>`) and seeding the team from an
 * incoming `?t=` param; the toast is animation-free under reduced motion.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../lib/use-lang';
import { NO_TEAM, useTeamStore } from '../lib/team';
import { NO_MEMBER_MOVES } from '../lib/moves';
import { decodeTeam, encodeTeam } from '../lib/share';
import { loadGame, loadTypeMeta, type TypeMeta } from '../lib/dex';
import { typeChipStyle } from '../lib/contrast';
import { detectRole, ROLE_LABEL } from '../lib/roles';
import { requestOpenMember } from '../lib/events';
import { EXAMPLE_TEAMS } from '../lib/showcase';
import ShowdownPanel from './ShowdownPanel';
import type { ShowdownMember } from '../lib/showdown';
import type { GameData, GamePokemon } from '../lib/data-schema';

interface Props {
  gameId: string;
}

const MOVE_SLOTS = 4;
/** how long the "Deshacer" toast stays after a removal */
const UNDO_MS = 6000;

/** what the "Deshacer" toast can bring back: one member, or the whole team */
interface Undoable {
  message: string;
  restore: () => void;
}

export default function TeamSlots({ gameId }: Props) {
  const team = useTeamStore((s) => s.teams[gameId] ?? NO_TEAM);
  const moves = useTeamStore((s) => s.moves[gameId] ?? NO_MEMBER_MOVES);
  const remove = useTeamStore((s) => s.remove);
  const insert = useTeamStore((s) => s.insert);
  const seed = useTeamStore((s) => s.seed);
  const lang = useLang();
  const [game, setGame] = useState<GameData | null>(null);
  const [meta, setMeta] = useState<TypeMeta>({ colors: {}, names: {} });
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [removed, setRemoved] = useState<Undoable | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const offerUndo = (undo: Undoable) => {
    setRemoved(undo);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  };

  const removeMember = (index: number, id: number, name: string) => {
    remove(gameId, index);
    offerUndo({
      message: lang === 'en' ? `${name} removed from the team` : `${name} quitado del equipo`,
      restore: () => insert(gameId, index, id),
    });
  };

  /* UX-12: clear the whole team in one click, with the same undo */
  const clearTeam = () => {
    const snapshot = team.map((id) => ({ id, moves: moves[String(id)] ?? [] }));
    seed(gameId, []);
    offerUndo({
      message: lang === 'en' ? 'Team cleared' : 'Equipo vaciado',
      restore: () => seed(gameId, snapshot),
    });
  };

  const example = EXAMPLE_TEAMS[gameId];
  /* V1-01: Showdown import replaces the team; the previous one stays one "Deshacer" away */
  const [showdownOpen, setShowdownOpen] = useState(false);
  const importTeam = (members: ShowdownMember[]) => {
    const snapshot = team.map((id) => ({ id, moves: moves[String(id)] ?? [] }));
    seed(gameId, members);
    offerUndo({
      message: lang === 'en' ? 'Team imported' : 'Equipo importado',
      restore: () => seed(gameId, snapshot),
    });
  };

  const loadExample = () => {
    if (example)
      seed(
        gameId,
        example.map((id) => ({ id })),
      );
  };

  const undoRemove = () => {
    if (!removed) return;
    removed.restore();
    setRemoved(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  useEffect(() => {
    let cancelled = false;
    loadGame(gameId)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch(() => {
        /* the picker island reports load errors; the sheet just stays empty */
      });
    loadTypeMeta().then((m) => {
      if (!cancelled) setMeta(m);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  /* incoming share: `?t=<value>` wins for this game only when it names this game */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('t');
    if (!raw) return;
    const payload = decodeTeam(raw);
    if (payload?.gameId !== gameId || payload.members.length === 0) return;
    useTeamStore.getState().seed(gameId, payload.members);
    /* consume the param so a reload keeps newer local picks instead of
       re-seeding the (now stale) link */
    params.delete('t');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
  }, [gameId]);

  const copyLink = async () => {
    const value = encodeTeam(
      gameId,
      team.map((id) => ({ id, moves: moves[String(id)] ?? [] })),
    );
    const url = `${window.location.origin}${window.location.pathname}?t=${encodeURIComponent(value)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable (e.g. insecure context): silently keep the UI calm */
    }
  };

  const byId = useMemo(() => {
    const map = new Map<number, GamePokemon>();
    for (const p of game?.pokemon ?? []) map.set(p.id, p);
    return map;
  }, [game]);

  const typeName = (slug: string) => meta.names[slug]?.[lang] ?? slug;
  const typeColor = (slug: string) => meta.colors[slug] ?? '#9299a1';

  const t = {
    kicker: lang === 'en' ? 'Your six' : 'Tu sexteto',
    heading: lang === 'en' ? 'Your team' : 'Tu equipo',
    copy: lang === 'en' ? 'Copy link' : 'Copiar enlace',
    copyLabel:
      lang === 'en' ? 'Copy share link to the team' : 'Copiar enlace para compartir el equipo',
    copied: lang === 'en' ? 'Link copied!' : '¡Enlace copiado!',
    free: (n: number) => (lang === 'en' ? `Slot ${n} open` : `Casilla ${n} libre`),
    freeHint:
      lang === 'en' ? 'Pick a Pokémon in the index below.' : 'Elige un Pokémon en el índice.',
    remove: (name: string, n: number) =>
      (lang === 'en' ? `Remove ${name} from the team` : `Quitar a ${name} del equipo`) +
      ` (${n}/6)`,
    open: (name: string, n: number) =>
      (lang === 'en' ? `Open ${name}’s sheet` : `Ver la ficha de ${name}`) + ` (${n}/6)`,
    clear: lang === 'en' ? 'Clear' : 'Vaciar',
    clearLabel: lang === 'en' ? 'Clear the whole team' : 'Vaciar todo el equipo',
    firstKicker: lang === 'en' ? 'First time here?' : '¿Primera vez aquí?',
    firstText:
      lang === 'en'
        ? 'Load an example team for this edition to see the whole analysis, then make it yours.'
        : 'Carga un equipo de ejemplo de esta edición para ver el análisis completo y luego hazlo tuyo.',
    firstButton: lang === 'en' ? 'Try an example team' : 'Probar con un equipo de ejemplo',
    undo: lang === 'en' ? 'Undo' : 'Deshacer',
    moves: (n: number) => (lang === 'en' ? `${n}/4 moves` : `${n}/4 movimientos`),
    help:
      lang === 'en'
        ? 'Click a card to open that Pokémon; ✕ removes it. Moves are picked in each Pokémon’s sheet.'
        : 'Haz clic en una ficha para abrir ese Pokémon; ✕ lo quita. Los movimientos se eligen en la ficha de cada Pokémon.',
  };

  return (
    <section className="relative border-[3px] border-ink-950 bg-paper-50 shadow-[8px_8px_0_0_var(--color-ink-950)]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-ink-950 px-4 pt-3 pb-3 sm:px-5">
        <div>
          <p className="kicker text-xs text-magenta-600">{t.kicker}</p>
          <h2 className="mt-0.5 font-headline text-4xl leading-none text-ink-950 uppercase">
            {t.heading}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="border-2 border-ink-950 bg-ember-500 px-2.5 py-1 font-headline text-2xl leading-none text-ink-950 shadow-pixel-sm">
            {team.length}/6
          </span>
          <button
            type="button"
            onClick={copyLink}
            data-copy-link
            disabled={team.length === 0}
            aria-label={t.copyLabel}
            className="pixel-btn pixel-btn-quiet cursor-pointer px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.copy} <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            onClick={() => setShowdownOpen((o) => !o)}
            aria-expanded={showdownOpen}
            className="cursor-pointer border-2 border-ink-950 bg-paper-50 px-2.5 py-2 kicker text-xs text-ink-950 shadow-pixel-sm hover:bg-ember-300"
          >
            Showdown <span aria-hidden="true">{showdownOpen ? '▴' : '▾'}</span>
          </button>
          {team.length > 0 ? (
            <button
              type="button"
              onClick={clearTeam}
              aria-label={t.clearLabel}
              className="cursor-pointer kicker text-xs text-ink-700 underline decoration-2 underline-offset-4 hover:text-magenta-600"
            >
              {t.clear}
            </button>
          ) : null}
        </div>
      </div>

      {showdownOpen && game ? (
        <ShowdownPanel
          game={game}
          lang={lang}
          team={team.map((id) => ({ id, moves: moves[String(id)] ?? [] }))}
          onImport={importTeam}
        />
      ) : null}

      {team.length === 0 && example ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink-950 bg-ember-300/60 px-4 py-3 sm:px-5">
          <p className="max-w-xl text-sm text-ink-900">
            <span className="mr-2 kicker text-xs text-magenta-600">{t.firstKicker}</span>
            {t.firstText}
          </p>
          <button
            type="button"
            onClick={loadExample}
            className="pixel-btn pixel-btn-primary cursor-pointer px-3 py-2 text-sm"
          >
            {t.firstButton} <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      {/* reduced-motion aware: global CSS freezes the transition under prefers-reduced-motion */}
      <p
        aria-live="polite"
        className={
          'fixed bottom-24 left-1/2 z-50 -translate-x-1/2 border-2 border-ink-950 bg-ember-500 px-3 py-1.5 kicker text-sm text-ink-950 shadow-pixel transition-opacity duration-200 sm:bottom-4' +
          (copied ? ' opacity-100' : ' pointer-events-none opacity-0')
        }
      >
        {copied ? t.copied : ''}
      </p>

      {/* UX-10: one horizontal, snapping strip on phones; the grid from sm up */}
      <ul
        role="list"
        className="flex snap-x gap-3 overflow-x-auto p-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:p-5 lg:grid-cols-6"
      >
        {Array.from({ length: 6 }, (_, index) => {
          const id = team[index];
          const mon = id === undefined ? undefined : byId.get(id);
          const n = index + 1;

          if (id === undefined || !mon) {
            return (
              <li key={index} className="w-36 shrink-0 snap-start sm:w-auto">
                <div className="flex h-full min-h-[9rem] flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-950/45 bg-paper-100 p-3 text-center sm:min-h-[13.5rem]">
                  <span
                    aria-hidden="true"
                    className="font-headline text-5xl leading-none text-paper-400"
                  >
                    {n}
                  </span>
                  <span className="kicker text-sm text-ink-800">{t.free(n)}</span>
                  <span className="text-xs leading-snug text-ink-600">{t.freeHint}</span>
                </div>
              </li>
            );
          }

          const name = mon.name[lang];
          const first = mon.types[0];
          const picked = moves[String(mon.id)] ?? [];
          const role = detectRole(mon.stats);
          return (
            <li key={index} className="group relative w-36 shrink-0 snap-start sm:w-auto">
              <button
                type="button"
                onClick={() => requestOpenMember(mon.id)}
                aria-label={t.open(name, n)}
                className="flex h-full w-full cursor-pointer flex-col overflow-hidden border-2 border-ink-950 bg-paper-50 text-left shadow-pixel-sm transition-transform duration-150 ease-out group-hover:-translate-y-1 group-hover:-rotate-1"
              >
                <span
                  className="relative block h-24 overflow-hidden border-b-2 border-ink-950 sm:h-28"
                  style={{ backgroundColor: typeColor(first) }}
                >
                  <span aria-hidden="true" className="absolute inset-0 halftone" />
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1.5 font-headline text-5xl leading-none text-paper-50 [text-shadow:2px_2px_0_var(--color-ink-950)]"
                  >
                    {n}
                  </span>
                  {mon.sprites.official ? (
                    <img
                      src={mon.sprites.official}
                      alt=""
                      aria-hidden="true"
                      width={112}
                      height={112}
                      decoding="async"
                      className="absolute -right-1 -bottom-2 size-24 [object-fit:contain] cutout transition-transform duration-200 group-hover:scale-105 sm:size-28"
                    />
                  ) : null}
                </span>
                <span className="flex flex-1 flex-col gap-1.5 p-2">
                  <span className="-mt-5 mb-0.5 -rotate-2 self-start border-2 border-ink-950 bg-paper-50 px-1.5 font-headline text-lg leading-tight text-ink-950 uppercase">
                    {name}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {mon.types.map((tp) => (
                      <span
                        key={tp}
                        className="type-chip px-1.5 text-[10px]"
                        style={typeChipStyle(typeColor(tp))}
                      >
                        {typeName(tp)}
                      </span>
                    ))}
                  </span>
                  <span className="hidden kicker text-[11px] text-magenta-600 sm:inline">
                    {ROLE_LABEL[role][lang]}
                  </span>
                  <span
                    className="mt-auto grid grid-cols-4 gap-1"
                    role="img"
                    aria-label={t.moves(picked.length)}
                  >
                    {Array.from({ length: MOVE_SLOTS }, (_, mi) => {
                      const moveId = picked[mi];
                      const info = moveId === undefined ? undefined : game?.moves[String(moveId)];
                      return (
                        <span
                          key={mi}
                          className="h-2 border border-ink-950"
                          style={{
                            backgroundColor: info ? typeColor(info.type) : 'var(--color-paper-200)',
                          }}
                        />
                      );
                    })}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeMember(index, mon.id, name)}
                aria-label={t.remove(name, n)}
                title={t.remove(name, n)}
                className="absolute top-1.5 right-1.5 grid size-7 cursor-pointer place-items-center border-2 border-ink-950 bg-paper-50 font-headline text-sm leading-none text-ink-950 shadow-pixel-sm transition-colors group-hover:-translate-y-1 hover:bg-magenta-500 hover:text-paper-50"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* undo toast after a removal; plain status message, no motion under reduced motion */}
      <div
        role="status"
        className={
          'fixed bottom-36 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 border-2 border-ink-950 bg-ink-950 py-1.5 pr-1.5 pl-3 text-sm text-paper-50 shadow-pixel transition-opacity duration-200 sm:bottom-16' +
          (removed ? ' opacity-100' : ' pointer-events-none opacity-0')
        }
      >
        {removed ? (
          <>
            <span className="kicker">{removed.message}</span>
            <button
              type="button"
              onClick={undoRemove}
              className="cursor-pointer border-2 border-paper-50 bg-ember-500 px-2 py-1 kicker text-xs text-ink-950 hover:bg-ember-400"
            >
              {t.undo}
            </button>
          </>
        ) : null}
      </div>
      <p className="border-t-2 border-ink-950/15 px-4 py-2 text-xs leading-relaxed text-ink-600 sm:px-5">
        {t.help}
      </p>
    </section>
  );
}
