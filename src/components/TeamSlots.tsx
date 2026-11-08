/**
 * Team of 6 — pixel slot frames (T2.8). Pure CSS empty-state art (no ripped
 * assets): an ember "＋" over a faint inner border; filled slots use the
 * game sprite (pixelated) + name. Slots are accessible buttons; loaded only
 * client-side (island), so it never renders during SSR.
 * T2.9: copy-link button (shares `?t=<encoded>`) and seeding the team from
 * an incoming `?t=` param; toast is animation-free under reduced motion.
 */
import { useEffect, useRef, useState } from 'react';
import { useTeamStore } from '../lib/team';
import { decodeTeam, encodeTeam } from '../lib/share';

interface Props {
  gameId: string;
  /** lookup for filled slots: national id -> { name, spriteUrl } */
  resolve: (id: number) => { name: string; spriteUrl: string | null } | undefined;
}

export default function TeamSlots({ gameId, resolve }: Props) {
  const team = useTeamStore((s) => s.teams[gameId]) ?? [];
  const remove = useTeamStore((s) => s.remove);
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* incoming share: `?t=<value>` wins for this game only when it names this game */
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('t');
    if (!raw) return;
    const payload = decodeTeam(raw);
    if (payload?.gameId === gameId && payload.ids.length > 0) {
      useTeamStore.getState().seed(gameId, payload.ids);
    }
  }, [gameId]);

  const copyLink = async () => {
    const value = encodeTeam(gameId, team);
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
    <div className="rounded-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm tracking-widest text-parchment-400 uppercase">
          {lang === 'en' ? 'Your team' : 'Tu equipo'}
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-ember-300">{team.length}/6</span>
          <button
            type="button"
            onClick={copyLink}
            disabled={team.length === 0}
            aria-label={
              lang === 'en'
                ? 'Copy share link to the team'
                : 'Copiar enlace para compartir el equipo'
            }
            className="cursor-pointer rounded-sm border-2 border-bark-700 bg-bark-800 px-2 py-0.5 font-display text-[11px] tracking-wide text-parchment-200 uppercase shadow-pixel-sm hover:border-ember-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lang === 'en' ? 'Copy link' : 'Copiar enlace'}
          </button>
        </div>
      </div>
      {/* reduced-motion aware: global CSS freezes animation under prefers-reduced-motion */}
      <p
        aria-live="polite"
        className={
          'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-pop-in rounded-sm border-2 border-ember-400 bg-bark-900 px-3 py-1.5 font-display text-sm text-parchment-100 shadow-pixel transition-opacity duration-200' +
          (copied ? ' opacity-100' : ' pointer-events-none opacity-0')
        }
      >
        {lang === 'en' ? 'Link copied!' : '¡Enlace copiado!'}
      </p>
      <ul role="list" className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                  className="group flex h-full w-full cursor-pointer flex-col items-center gap-1 rounded-sm border-2 border-ember-500 bg-bark-900 p-1 shadow-pixel-sm transition-all ease-in-out hover:border-ember-600 hover:shadow-pixel-ember"
                >
                  {slot.info.spriteUrl ? (
                    <img
                      src={slot.info.spriteUrl}
                      alt=""
                      aria-hidden="true"
                      width={48}
                      height={48}
                      className="size-12 [object-fit:contain] pixelated"
                    />
                  ) : (
                    <span className="size-12 rounded-sm" aria-hidden="true" />
                  )}
                  <span className="w-full truncate text-center font-display text-[10px] text-parchment-200">
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
                className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-bark-700 bg-bark-950/60 p-1"
              >
                <span className="grid size-12 place-items-center font-display text-lg text-ember-700">
                  ＋
                </span>
                <span className="font-display text-[10px] text-parchment-600">
                  {slot.index + 1}/6
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-[10px] text-parchment-600">
        {lang === 'en'
          ? 'Click a filled slot to remove it.'
          : 'Haz clic en una casilla llena para quitarla.'}
      </p>
    </div>
  );
}
