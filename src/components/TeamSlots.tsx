/**
 * Team of 6 — pixel slot frames (T2.8). Pure CSS empty-state art (no ripped
 * assets): an ember "＋" over a dashed inner frame; filled slots use the
 * official artwork (owner directive 2026-11-07: artwork only, smooth render)
 * + name. Slots are accessible buttons; loaded only client-side (island), so
 * it never renders during SSR.
 * T2.9: copy-link button (shares `?t=<encoded>`) and seeding the team from
 * an incoming `?t=` param; toast is animation-free under reduced motion.
 * v2 «Pergamino»: the team sheet is a parchment panel (sticky on desktop).
 */
import { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/use-lang';
import { NO_TEAM, useTeamStore } from '../lib/team';
import { NO_MEMBER_MOVES } from '../lib/moves';
import { decodeTeam, encodeTeam } from '../lib/share';

interface Props {
  gameId: string;
  /** lookup for filled slots: national id -> { name, spriteUrl } */
  resolve: (id: number) => { name: string; spriteUrl: string | null } | undefined;
}

export default function TeamSlots({ gameId, resolve }: Props) {
  const team = useTeamStore((s) => s.teams[gameId] ?? NO_TEAM);
  const moves = useTeamStore((s) => s.moves[gameId] ?? NO_MEMBER_MOVES);
  const remove = useTeamStore((s) => s.remove);
  const lang = useLang();
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const slots = Array.from({ length: 6 }, (_, i) => {
    const id = team[i];
    if (id === undefined) return { id: null, index: i };
    const info = resolve(id);
    return { id, index: i, info };
  });

  return (
    <div className="paper-panel paper-grain p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl leading-none text-ink-950">
            {lang === 'en' ? 'Your team' : 'Tu equipo'}
          </h2>
        </div>
        <span className="border-2 border-ink-950 bg-ember-500 px-2 py-1 font-display text-sm leading-none text-ink-950 shadow-pixel-sm">
          {team.length}/6
        </span>
      </div>

      <button
        type="button"
        onClick={copyLink}
        disabled={team.length === 0}
        aria-label={
          lang === 'en' ? 'Copy share link to the team' : 'Copiar enlace para compartir el equipo'
        }
        className="mt-3 w-full cursor-pointer border-2 border-ink-950 bg-paper-50 px-2 py-1.5 font-display text-[11px] tracking-wide text-ink-900 uppercase shadow-pixel-sm transition-colors hover:bg-paper-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {lang === 'en' ? 'Copy link' : 'Copiar enlace'}
      </button>

      {/* reduced-motion aware: global CSS freezes animation under prefers-reduced-motion */}
      <p
        aria-live="polite"
        className={
          'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border-2 border-ink-950 bg-ember-500 px-3 py-1.5 font-display text-sm text-ink-950 shadow-pixel transition-opacity duration-200' +
          (copied ? ' opacity-100' : ' pointer-events-none opacity-0')
        }
      >
        {copied ? (lang === 'en' ? 'Link copied!' : '¡Enlace copiado!') : ''}
      </p>

      <ul role="list" className="mt-3 grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          if (slot.id !== null && slot.info) {
            return (
              <li key={slot.index}>
                <button
                  type="button"
                  onClick={() => remove(gameId, slot.index)}
                  aria-label={
                    (lang === 'en'
                      ? `Remove ${slot.info.name} from the team`
                      : `Quitar a ${slot.info.name} del equipo`) + ` (${slot.index + 1}/6)`
                  }
                  className="group flex h-full w-full cursor-pointer flex-col items-center gap-1 border-2 border-ink-950 bg-paper-50 p-1 shadow-pixel-sm transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-paper-100"
                >
                  {slot.info.spriteUrl ? (
                    <img
                      src={slot.info.spriteUrl}
                      alt=""
                      aria-hidden="true"
                      width={56}
                      height={56}
                      className="size-14 [object-fit:contain]"
                    />
                  ) : (
                    <span className="size-14" aria-hidden="true" />
                  )}
                  <span className="w-full truncate text-center font-display text-[11px] text-ink-800">
                    {slot.info.name}
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li key={slot.index}>
              <div
                aria-hidden="true"
                className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-ink-900/35 bg-paper-100/60 p-1"
              >
                <span className="grid size-14 place-items-center font-display text-2xl text-ember-600">
                  ＋
                </span>
                <span className="font-display text-[11px] text-ink-600">{slot.index + 1}/6</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-ink-600">
        {lang === 'en'
          ? 'Click a filled slot to remove it.'
          : 'Haz clic en una casilla llena para quitarla.'}
      </p>
    </div>
  );
}
