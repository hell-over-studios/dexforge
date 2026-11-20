/**
 * Team sheet — "Tu sexteto" (T2.8, restyled for ADR-012 «Revista»).
 * Six magazine cards across the top of the workbench: a halftone block in the
 * member's first type color, a big slot number, the official artwork as a
 * cut-out (owner directive 2026-11-07: artwork only), a rotated name tag, type
 * chips, the v1 role and four move pips colored by move type. Empty slots say
 * what to do next. Filled cards are buttons that remove the member.
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
import type { GameData, GamePokemon } from '../lib/data-schema';

interface Props {
  gameId: string;
}

const MOVE_SLOTS = 4;

export default function TeamSlots({ gameId }: Props) {
  const team = useTeamStore((s) => s.teams[gameId] ?? NO_TEAM);
  const moves = useTeamStore((s) => s.moves[gameId] ?? NO_MEMBER_MOVES);
  const remove = useTeamStore((s) => s.remove);
  const lang = useLang();
  const [game, setGame] = useState<GameData | null>(null);
  const [meta, setMeta] = useState<TypeMeta>({ colors: {}, names: {} });
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    moves: (n: number) => (lang === 'en' ? `${n}/4 moves` : `${n}/4 movimientos`),
    help:
      lang === 'en'
        ? 'Click a card to remove that member. Moves are picked in each Pokémon’s sheet.'
        : 'Haz clic en una ficha para quitarla. Los movimientos se eligen en la ficha de cada Pokémon.',
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
        <div className="flex items-center gap-3">
          <span className="border-2 border-ink-950 bg-ember-500 px-2.5 py-1 font-headline text-2xl leading-none text-ink-950 shadow-pixel-sm">
            {team.length}/6
          </span>
          <button
            type="button"
            onClick={copyLink}
            disabled={team.length === 0}
            aria-label={t.copyLabel}
            className="pixel-btn pixel-btn-quiet cursor-pointer px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.copy} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>

      {/* reduced-motion aware: global CSS freezes the transition under prefers-reduced-motion */}
      <p
        aria-live="polite"
        className={
          'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border-2 border-ink-950 bg-ember-500 px-3 py-1.5 kicker text-sm text-ink-950 shadow-pixel transition-opacity duration-200' +
          (copied ? ' opacity-100' : ' pointer-events-none opacity-0')
        }
      >
        {copied ? t.copied : ''}
      </p>

      <ul role="list" className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => {
          const id = team[index];
          const mon = id === undefined ? undefined : byId.get(id);
          const n = index + 1;

          if (id === undefined || !mon) {
            return (
              <li key={index}>
                <div className="flex h-full min-h-[13.5rem] flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-950/45 bg-paper-100 p-3 text-center">
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
            <li key={index}>
              <button
                type="button"
                onClick={() => remove(gameId, index)}
                aria-label={t.remove(name, n)}
                className="group flex h-full w-full cursor-pointer flex-col overflow-hidden border-2 border-ink-950 bg-paper-50 text-left shadow-pixel-sm transition-transform duration-150 ease-out hover:-translate-y-1 hover:-rotate-1"
              >
                <span
                  className="relative block h-28 overflow-hidden border-b-2 border-ink-950"
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
                      className="absolute -right-1 -bottom-2 size-28 [object-fit:contain] cutout transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 hidden bg-ink-950 px-1.5 py-0.5 kicker text-[10px] text-paper-50 group-hover:block"
                  >
                    {lang === 'en' ? 'Remove' : 'Quitar'} ✕
                  </span>
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
                  <span className="kicker text-[11px] text-magenta-600">
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
            </li>
          );
        })}
      </ul>
      <p className="border-t-2 border-ink-950/15 px-4 py-2 text-xs leading-relaxed text-ink-600 sm:px-5">
        {t.help}
      </p>
    </section>
  );
}
