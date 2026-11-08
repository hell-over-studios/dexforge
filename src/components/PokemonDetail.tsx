/**
 * Pokémon detail drawer (T2.6 + T2.7) — pixel-cozy panel with type badges
 * (canonical colors from /data/types.json), quantized pixel stat bars,
 * abilities, dex info and height/weight, plus a sprite viewer with
 * kind toggles and a documented fallback chain (src/lib/sprites.ts).
 * Mobile-first (verified at 360px). Charts land in v0.3 (ADR-005).
 */
import { useState } from 'react';
import type { GamePokemon } from '../lib/data-schema';
import { chooseSprite, missingKinds, SPRITE_KINDS, type SpriteKind } from '../lib/sprites';
import { useTeamStore } from '../lib/team';

interface Props {
  mon: GamePokemon;
  gameId: string;
  /** type slug -> hex color (may be partial; falls back to a neutral chip) */
  colors: Record<string, string>;
  /** name of the team's oldest member (for the full-team replace message) */
  oldestName?: string;
  onClose: () => void;
}

/**
 * Alt-text convention (a11y): each sprite gets a localized sentence naming the
 * species AND the kind actually shown ("game sprite of X", "shiny sprite of
 * X", "official artwork of X"…), because a fallback changes what the image is.
 */
const ALT: Record<SpriteKind, { es: (n: string) => string; en: (n: string) => string }> = {
  game: { es: (n) => `Sprite del juego de ${n}`, en: (n) => `Game sprite of ${n}` },
  shiny: { es: (n) => `Sprite variocolor de ${n}`, en: (n) => `Shiny sprite of ${n}` },
  animated: { es: (n) => `Sprite animado de ${n}`, en: (n) => `Animated sprite of ${n}` },
  artwork: { es: (n) => `Ilustración oficial de ${n}`, en: (n) => `Official artwork of ${n}` },
  home: { es: (n) => `Render de Pokémon HOME de ${n}`, en: (n) => `Pokémon HOME render of ${n}` },
};

const TOGGLE_LABEL: Record<SpriteKind, { es: string; en: string }> = {
  game: { es: 'Juego', en: 'Game' },
  shiny: { es: 'Variocolor', en: 'Shiny' },
  animated: { es: 'Animado', en: 'Animated' },
  artwork: { es: 'Ilustración', en: 'Artwork' },
  home: { es: 'HOME', en: 'HOME' },
};

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

export default function PokemonDetail({ mon, gameId, colors, oldestName, onClose }: Props) {
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';
  const [kind, setKind] = useState<SpriteKind>('game');
  const [note, setNote] = useState('');
  const team = useTeamStore((s) => s.teams[gameId]) ?? [];
  const toggle = useTeamStore((s) => s.toggle);
  const inTeam = team.includes(mon.id);
  const choice = chooseSprite(mon.sprites, kind);
  const unavailable = missingKinds(mon.sprites);
  const fellBack = choice && choice.kind !== kind;

  const onTeamButton = () => {
    const result = toggle(gameId, mon.id);
    setNote(
      result === 'replaced-oldest'
        ? lang === 'en'
          ? `Team full — swapped out ${oldestName ?? 'the oldest'}`
          : `Equipo lleno — salió ${oldestName ?? 'el más antiguo'}`
        : result === 'added'
          ? lang === 'en'
            ? 'Added to the team.'
            : 'Añadido al equipo.'
          : lang === 'en'
            ? 'Removed from the team.'
            : 'Quitado del equipo.',
    );
  };

  return (
    <section
      aria-label={mon.name[lang]}
      className="animate-pop-in rounded-sm border-2 border-ember-600 bg-bark-900 dither p-4 shadow-pixel"
    >
      <div className="flex items-start gap-3">
        {/* sprite viewer (T2.7): toggles + fallback note */}
        <div className="shrink-0 text-center">
          {choice ? (
            <img
              src={choice.url}
              alt={ALT[choice.kind][lang](mon.name[lang])}
              width={96}
              height={96}
              className={'size-20 [object-fit:contain]' + (choice.pixelated ? ' pixelated' : '')}
            />
          ) : (
            <span
              className="grid size-20 place-items-center rounded-sm border-2 border-bark-800 bg-bark-950 text-xs text-parchment-600"
              aria-hidden="true"
            >
              —
            </span>
          )}
          <div
            role="group"
            aria-label={lang === 'en' ? 'Sprite kind' : 'Tipo de sprite'}
            className="mt-1 flex flex-col gap-1"
          >
            {SPRITE_KINDS.map((k) => {
              const unavailableHere = unavailable.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={
                    'rounded-sm border-2 px-1.5 py-0.5 font-display text-[10px] tracking-wide uppercase transition-colors ' +
                    (kind === k
                      ? 'border-ember-400 bg-ember-500 text-bark-950'
                      : 'text-parchment-300 border-bark-700 bg-bark-800 hover:border-ember-600')
                  }
                >
                  {TOGGLE_LABEL[k][lang]}
                  {unavailableHere ? '*' : ''}
                </button>
              );
            })}
          </div>
        </div>

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

      <p aria-live="polite" className="mt-1 h-3 text-[10px] text-parchment-600">
        {fellBack && choice
          ? lang === 'en'
            ? `"${TOGGLE_LABEL[kind].en}" not available — showing ${TOGGLE_LABEL[choice.kind].en.toLowerCase()}`
            : `"${TOGGLE_LABEL[kind].es}" no disponible — se muestra ${TOGGLE_LABEL[choice.kind].es.toLowerCase()}`
          : ''}
      </p>

      {/* pixel stat bars (quantized to 10% steps) */}
      <div
        className="mt-2 grid gap-1"
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

      {/* team button (T2.8): add / remove / full -> replace oldest */}
      <button
        type="button"
        onClick={onTeamButton}
        className={
          'mt-3 block w-full cursor-pointer rounded-sm border-2 px-3 py-2 font-display text-sm shadow-pixel-sm transition-colors ' +
          (inTeam
            ? 'border-bark-950 bg-bark-700 text-parchment-200 hover:border-moss-500'
            : 'border-bark-950 bg-ember-500 text-bark-950 hover:bg-ember-400')
        }
      >
        {inTeam
          ? lang === 'en'
            ? 'Remove from team'
            : 'Quitar del equipo'
          : team.length >= 6
            ? lang === 'en'
              ? `Team full — replace ${oldestName ?? 'oldest'}`
              : `Equipo lleno — sustituye a ${oldestName ?? 'el más antiguo'}`
            : lang === 'en'
              ? 'Add to team'
              : 'Añadir al equipo'}
      </button>
      <p aria-live="polite" className="mt-1 min-h-4 text-[10px] text-parchment-600">
        {note}
      </p>
    </section>
  );
}
