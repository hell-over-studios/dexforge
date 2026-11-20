/**
 * Pokémon detail drawer (T2.6) — pixel-cozy panel with type badges (canonical
 * colors from /data/types.json), quantized pixel stat bars, abilities, dex
 * info and height/weight. Visuals show ONLY the official artwork (owner
 * directive 2026-11-07: no game/shiny/animated/HOME sprites anywhere).
 * Mobile-first (verified at 360px). Charts land in v0.3 (ADR-005).
 * ADR-012 «Revista»: the drawer is a white sheet with a yellow top rule.
 * T4.4: abilities expand in place (description, hidden/not-in-game markers and
 * the team members that share them).
 */
import { useState } from 'react';
import type { AbilityInfo, GamePokemon, LocalizedText, MoveInfo } from '../lib/data-schema';
import { typeChipStyle } from '../lib/contrast';
import { abilityEffect, abilityPeers } from '../lib/abilities';
import MovePicker from './MovePicker';
import { useLang } from '../lib/use-lang';
import { NO_TEAM, useTeamStore } from '../lib/team';

interface Props {
  mon: GamePokemon;
  gameId: string;
  /** type slug -> hex color (may be partial; falls back to a neutral chip) */
  colors: Record<string, string>;
  /** type slug -> localized label (falls back to the slug) */
  typeNames: Record<string, LocalizedText>;
  /** ability slug -> details, from the game dataset */
  abilities: Record<string, AbilityInfo>;
  /** national move id (as string) -> details, from the game dataset */
  moveDex: Record<string, MoveInfo>;
  /** the game's current team, used to highlight shared abilities */
  team: GamePokemon[];
  /** name of the team's oldest member (for the full-team replace message) */
  oldestName?: string;
  onClose: () => void;
}

const ART_ALT = {
  es: (n: string) => `Ilustración oficial de ${n}`,
  en: (n: string) => `Official artwork of ${n}`,
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

export default function PokemonDetail({
  mon,
  gameId,
  colors,
  typeNames,
  abilities,
  moveDex,
  team,
  oldestName,
  onClose,
}: Props) {
  const lang = useLang();
  const [note, setNote] = useState('');
  /** slug of the ability expanded in place (one at a time) */
  const [openAbility, setOpenAbility] = useState<string | null>(null);
  const teamIds = useTeamStore((s) => s.teams[gameId] ?? NO_TEAM);
  const toggle = useTeamStore((s) => s.toggle);
  const inTeam = teamIds.includes(mon.id);
  const artwork = mon.sprites.official;

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
      className="animate-pop-in border-[3px] border-t-8 border-ink-950 border-t-ember-500 bg-paper-50 p-4 shadow-pixel-lg"
    >
      <div className="flex items-start gap-3">
        {/* official artwork ONLY (owner directive 2026-11-07) — smooth render */}
        <div
          className="relative grid size-24 shrink-0 place-items-center overflow-hidden border-2 border-ink-950"
          style={{ backgroundColor: colors[mon.types[0]] ?? 'var(--color-paper-200)' }}
        >
          <span aria-hidden="true" className="absolute inset-0 halftone" />
          {artwork ? (
            <img
              src={artwork}
              alt={ART_ALT[lang](mon.name[lang])}
              width={96}
              height={96}
              className="relative size-20 [object-fit:contain] cutout"
            />
          ) : (
            <span className="font-display text-xs text-ink-600" aria-hidden="true">
              —
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate font-headline text-3xl leading-none text-ink-950 uppercase">
              {mon.name[lang]}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'en' ? 'Close details' : 'Cerrar detalles'}
              className="shrink-0 cursor-pointer border-2 border-ink-950 bg-paper-100 px-2 py-0.5 font-display text-sm text-ink-900 shadow-pixel-sm transition-colors hover:bg-paper-200"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-ink-600">
            n.º {mon.id} · dex {mon.dexNumber} · {formatMeters(mon.height)} · {formatKg(mon.weight)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {mon.types.map((t) =>
              colors[t] ? (
                <span key={t} className="type-chip" style={typeChipStyle(colors[t])}>
                  {typeNames[t]?.[lang] ?? t}
                </span>
              ) : (
                <span key={t} className="type-chip bg-paper-300 text-ink-900">
                  {typeNames[t]?.[lang] ?? t}
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
            <span role="rowheader" className="w-20 shrink-0 font-display text-xs text-ink-600">
              {lang === 'en' ? en : es}
            </span>
            <span role="cell" className="h-3 min-w-0 flex-1 border-2 border-ink-950 bg-paper-200">
              <span
                className="block h-full bg-ember-500"
                style={{ width: quantizedWidth(mon.stats[key]) }}
                data-value={mon.stats[key]}
              ></span>
            </span>
            <span role="cell" className="w-8 text-right font-display text-xs text-ink-900">
              {mon.stats[key]}
            </span>
          </div>
        ))}
      </div>

      {mon.abilities.length > 0 ? (
        <div className="mt-3">
          <p className="font-display text-xs text-ink-600">
            {lang === 'en' ? 'Abilities' : 'Habilidades'}
          </p>
          <ul className="mt-1 grid gap-1">
            {mon.abilities.map((a) => {
              const info = abilities[a.slug];
              const effect = abilityEffect(info, lang);
              const open = openAbility === a.slug;
              const peers = abilityPeers(team, a.slug, mon.id);
              const btnId = `ability-${mon.id}-${a.slug}-btn`;
              const panelId = `ability-${mon.id}-${a.slug}-panel`;
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    id={btnId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenAbility(open ? null : a.slug)}
                    className={
                      'flex w-full cursor-pointer items-center gap-1.5 border-2 px-2 py-1 text-left transition-colors ' +
                      (open
                        ? 'border-ember-600 bg-ember-300/30'
                        : 'border-ink-900/20 bg-paper-50 hover:border-ink-700 hover:bg-paper-100')
                    }
                  >
                    <span className="min-w-0 flex-1 truncate font-display text-xs text-ink-900">
                      {a.name[lang]}
                    </span>
                    {a.hidden ? (
                      <span className="shrink-0 border border-ink-900/30 bg-paper-200 px-1 text-[10px] text-ink-600">
                        {lang === 'en' ? 'hidden' : 'oculta'}
                      </span>
                    ) : null}
                    {!a.inGame ? (
                      <span className="shrink-0 border border-ink-900/30 bg-paper-300 px-1 text-[10px] text-ink-600">
                        {lang === 'en' ? 'not in this game' : 'no en este juego'}
                      </span>
                    ) : null}
                    {peers.length > 0 ? (
                      <span className="shrink-0 border border-ember-600 bg-ember-300/40 px-1 text-[10px] text-ink-900">
                        {lang === 'en' ? 'team' : 'equipo'}
                      </span>
                    ) : null}
                    <span aria-hidden="true" className="shrink-0 font-display text-xs text-ink-600">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="animate-pop-in border-2 border-t-0 border-ink-900/20 bg-paper-100 px-2 py-2"
                    >
                      <p lang={effect.lang} className="text-xs leading-relaxed text-ink-800">
                        {effect.text ||
                          (lang === 'en'
                            ? 'No description available.'
                            : 'Sin descripción disponible.')}
                      </p>
                      {!a.inGame ? (
                        <p className="mt-1 text-[11px] text-ink-600">
                          {lang === 'en'
                            ? 'This ability did not exist in this game.'
                            : 'Esta habilidad no existía en este juego.'}
                        </p>
                      ) : null}
                      {peers.length > 0 ? (
                        <p className="mt-1 text-[11px] text-ink-700">
                          {lang === 'en' ? 'Also on your team: ' : 'También en tu equipo: '}
                          <span className="font-display">
                            {peers.map((p) => p.name[lang]).join(', ')}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* T4.2: four move slots + version-group-accurate move list */}
      <MovePicker
        mon={mon}
        gameId={gameId}
        moveDex={moveDex}
        colors={colors}
        typeNames={typeNames}
        inTeam={inTeam}
      />

      {/* team button (T2.8): add / remove / full -> replace oldest */}
      <button
        type="button"
        onClick={onTeamButton}
        className={'pixel-btn mt-3 w-full ' + (inTeam ? 'pixel-btn-paper' : 'pixel-btn-primary')}
      >
        {inTeam
          ? lang === 'en'
            ? 'Remove from team'
            : 'Quitar del equipo'
          : teamIds.length >= 6
            ? lang === 'en'
              ? `Team full — replace ${oldestName ?? 'oldest'}`
              : `Equipo lleno — sustituye a ${oldestName ?? 'el más antiguo'}`
            : lang === 'en'
              ? 'Add to team'
              : 'Añadir al equipo'}
      </button>
      <p aria-live="polite" className="mt-1 min-h-4 text-[11px] text-ink-600">
        {note}
      </p>
    </section>
  );
}
