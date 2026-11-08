/**
 * Team of 6 — pixel slot frames (T2.8). Pure CSS empty-state art (no ripped
 * assets): an ember "＋" over a faint inner border; filled slots use the
 * game sprite (pixelated) + name. Slots are accessible buttons; loaded only
 * client-side (island), so it never renders during SSR.
 */
import { useTeamStore } from '../lib/team';

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
        <span className="font-display text-sm text-ember-300">{team.length}/6</span>
      </div>
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
