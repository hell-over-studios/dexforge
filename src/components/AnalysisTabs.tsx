/**
 * Analysis tabs for the workbench (ADR-012 desk, UX-04 #80): Defensa /
 * Cobertura / Perfil with live problem counts. WAI-ARIA tabs pattern — click
 * or ←/→/Home/End. The panels are static elements in the page
 * (`#panel-<id>`); this island only toggles their `hidden` attribute, so each
 * panel's island still hydrates the first time it is shown.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { analyzeTeam } from '../lib/analysis';
import { analyzeCoverage } from '../lib/coverage';
import { loadGame } from '../lib/dex';
import { coverageGapCount, defenseAlertCount } from '../lib/tab-counts';
import { useLang } from '../lib/use-lang';
import { useTeamStore } from '../lib/team';
import type { GameData, GamePokemon } from '../lib/data-schema';

const TABS = [
  { id: 'defensa', es: 'Defensa', en: 'Defense', unit: { es: 'alertas', en: 'alerts' } },
  { id: 'cobertura', es: 'Cobertura', en: 'Coverage', unit: { es: 'huecos', en: 'gaps' } },
  { id: 'perfil', es: 'Perfil', en: 'Profile', unit: null },
] as const;

const NO_MOVES: readonly number[] = [];

export default function AnalysisTabs({ gameId }: { gameId: string }) {
  const lang = useLang();
  const [game, setGame] = useState<GameData | null>(null);
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const teamState = useTeamStore((s) => s.teams);
  const moveState = useTeamStore((s) => s.moves);

  useEffect(() => {
    let cancelled = false;
    loadGame(gameId)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch(() => {
        /* counts are a hint: without data the tabs simply show no badge */
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  /* show the active panel, hide the others */
  useEffect(() => {
    TABS.forEach((tab, i) => {
      const panel = document.getElementById(`panel-${tab.id}`);
      if (panel) panel.hidden = i !== active;
    });
  }, [active]);

  const counts = useMemo(() => {
    if (!game) return [0, 0, 0];
    const members = (teamState[gameId] ?? [])
      .map((id) => game.pokemon.find((p) => p.id === id))
      .filter((p): p is GamePokemon => Boolean(p));
    if (members.length === 0) return [0, 0, 0];
    const defense = analyzeTeam(
      members.map((p) => ({ id: p.id, name: p.name, types: p.types })),
      game.typeChart,
    );
    const coverage = analyzeCoverage(
      members.map((p) => ({
        id: p.id,
        name: p.name,
        moves: moveState[gameId]?.[String(p.id)] ?? NO_MOVES,
      })),
      game.typeChart,
      game.moves,
    );
    return [defenseAlertCount(defense), coverageGapCount(coverage), 0];
  }, [game, teamState, moveState, gameId]);

  const select = (i: number, focus: boolean) => {
    setActive(i);
    if (focus) buttons.current[i]?.focus();
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = TABS.length - 1;
    const to =
      ev.key === 'ArrowRight'
        ? (i + 1) % TABS.length
        : ev.key === 'ArrowLeft'
          ? (i - 1 + TABS.length) % TABS.length
          : ev.key === 'Home'
            ? 0
            : ev.key === 'End'
              ? last
              : null;
    if (to === null) return;
    ev.preventDefault();
    select(to, true);
  };

  return (
    <div
      role="tablist"
      aria-label={lang === 'en' ? 'Team analysis' : 'Análisis del equipo'}
      className="flex flex-wrap gap-2 border-b-[3px] border-ink-950 pb-3"
    >
      {TABS.map((tab, i) => {
        const n = counts[i];
        const on = i === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => select(i, false)}
            onKeyDown={(ev) => onKeyDown(ev, i)}
            className="inline-flex cursor-pointer items-center gap-2 border-2 border-ink-950 bg-paper-50 px-4 py-2 kicker text-sm text-ink-950 shadow-pixel-sm transition-colors hover:bg-ember-300 aria-selected:bg-ink-950 aria-selected:text-ember-500"
          >
            {tab[lang]}
            {tab.unit && n > 0 ? (
              <span className="inline-grid min-w-5 place-items-center rounded-full border-2 border-ink-950 bg-magenta-500 px-1 text-[11px] leading-4 text-paper-50">
                {n}
                <span className="sr-only"> {tab.unit[lang]}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
