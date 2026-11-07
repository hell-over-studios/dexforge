/**
 * Pokémon detail drawer (T2.6) — pixel-cozy panel with type badges (canonical
 * colors from /data/types.json), quantized pixel stat bars, abilities, dex
 * info and height/weight. Mobile-first (verified at 360px). Charts land in v0.3.
 */
import type { GamePokemon } from '../lib/data-schema';

interface Props {
  mon: GamePokemon;
  /** type slug -> hex color (may be partial; falls back to a neutral chip) */
  colors: Record<string, string>;
  onClose: () => void;
}

/** Quantize to 10% steps for the stepped-pixel look */
const quantizedWidth = (value: number, max = 255): string => {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const stepped = Math.round(pct / 10) * 10;
  return `${stepped}%`;
};

const formatMeters = (decimetres: number): string => {
  const m = decimetres / 10;
  return `${m === Math.floor(m) ? m : m.toFixed(1)} m`;
};

const formatKg = (hectograms: number): string => {
  const kg = hectograms / 10;
  return `${kg === Math.floor(kg) ? kg : kg.toFixed(1)} kg`;
};

const STAT_LABELS: { key: keyof GamePokemon['stats']; es: string; en: string }[] = [
  { key: 'hp', es: 'PS', en: 'HP' },
  { key: 'attack', es: 'Ataque', en: 'Attack' },
  { key: 'defense', es: 'Defensa', en: 'Defense' },
  { key: 'specialAttack', es: 'At. espe', en: 'Sp. Atk' },
  { key: 'specialDefense', es: 'Def. espe', en: 'Sp. Def' },
  { key: 'speed', es: 'Velocidad', en: 'Speed' },
];

export default function PokemonDetail({ mon, colors, onClose }: Props) {
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';
  const sprite = mon.sprites.game ?? mon.sprites.official;

  return (
    <section
      aria-label={mon.name[lang]}
      className="animate-pop-in rounded-sm border-2 border-ember-600 bg-bark-900 dither p-4 shadow-pixel"
    >
      <div className="flex items-start gap-3">
        {sprite ? (
          <img
            src={sprite}
            alt={
              lang === 'en'
                ? `${mon.name.en}, the Pokémon's game sprite`
                : `Sprite del juego de ${mon.name.es}`
            }
            width={96}
            height={96}
            className="size-20 shrink-0 [object-fit:contain] pixelated"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate font-display text-xl text-parchment-100">
              {mon.name[lang]}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'en' ? 'Close details' : 'Cerrar detalles'}
              className="shrink-0 cursor-pointer rounded-sm border-2 border-bark-950 bg-bark-700 px-2 py-0.5 font-display text-sm text-parchment-200 shadow-pixel-sm hover:border-ember-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-parchment-400">
            n.º {mon.id} · dex {mon.dexNumber} · {formatMeters(mon.height)} · {formatKg(mon.weight)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {mon.types.map((t) =>
              colors[t] ? (
                <span
                  key={t}
                  style={{ backgroundColor: colors[t] }}
                  className="rounded-sm border-2 border-bark-950 px-2 py-0.5 font-display text-xs font-bold text-bark-950"
                >
                  {t}
                </span>
              ) : (
                <span
                  key={t}
                  className="rounded-sm border border-bark-700 px-2 py-0.5 font-display text-xs text-parchment-400 uppercase"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      {/* pixel stat bars (quantized to 10% steps) */}
      <div
        className="mt-3 grid gap-1"
        role="table"
        aria-label={lang === 'en' ? 'Base stats' : 'Estadísticas base'}
      >
        {STAT_LABELS.map(({ key, es, en }) => (
          <div key={key} role="row" className="flex items-center gap-2">
            <span
              role="rowheader"
              className="w-20 shrink-0 font-display text-xs text-parchment-400"
            >
              {lang === 'en' ? en : es}
            </span>
            <span
              role="cell"
              className="h-3 min-w-0 flex-1 rounded-sm border-2 border-bark-950 bg-bark-950"
            >
              <span
                className="block h-full rounded-none bg-ember-500"
                style={{ width: quantizedWidth(mon.stats[key]) }}
                data-value={mon.stats[key]}
              ></span>
            </span>
            <span role="cell" className="w-8 text-right font-display text-xs text-parchment-200">
              {mon.stats[key]}
            </span>
          </div>
        ))}
      </div>

      {mon.abilities.length > 0 ? (
        <p className="mt-3 text-xs text-parchment-400">
          {lang === 'en' ? 'Abilities: ' : 'Habilidades: '}
          {mon.abilities
            .map(
              (a) =>
                `${a.name[lang]}${a.hidden ? (lang === 'en' ? ' (hidden)' : ' (oculta)') : ''}`,
            )
            .join(', ')}
        </p>
      ) : null}
    </section>
  );
}
