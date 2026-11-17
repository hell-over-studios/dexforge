/**
 * Team profile panel (T3.3, v0.3.0) — pixel-cozy summary under the defensive
 * table: hand-rolled SVG radar of the team's average base stats (ADR-005: no
 * chart libraries; static drawing, nothing animates) and a v1 heuristic role
 * per member from src/lib/roles.ts. Reads only the static per-game dataset;
 * silent fail if it won't load (cosmetic panel).
 * v2 «Pergamino»: a paper profile sheet — ink radar grid, ember polygon,
 * role chips in the same heatmap language as the defensive table.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  detectRole,
  RADAR_CAP,
  radarPolygon,
  STAT_SHORT,
  teamAverageStats,
  type Role,
} from '../lib/roles';
import { loadGame } from '../lib/dex';
import { useLang } from '../lib/use-lang';
import { useTeamStore } from '../lib/team';
import type { GameData, GamePokemon, Stats } from '../lib/data-schema';

const ROLE_LABEL: Record<Role, { es: string; en: string }> = {
  sweeper: { es: 'Sweep físico', en: 'Physical sweeper' },
  'special-sweeper': { es: 'Sweep especial', en: 'Special sweeper' },
  wall: { es: 'Muro', en: 'Wall' },
  tank: { es: 'Tanque', en: 'Tank' },
  support: { es: 'Soporte', en: 'Support' },
};

const ROLE_CHIP: Record<Role, string> = {
  sweeper: 'border-ink-950 bg-ember-500 text-ink-950',
  'special-sweeper': 'border-ember-700 bg-ember-300/80 text-ink-900',
  wall: 'border-ink-950 bg-moss-500 text-ink-950',
  tank: 'border-moss-700 bg-moss-300/60 text-ink-900',
  support: 'border-ink-900/25 bg-paper-200 text-ink-700',
};

interface MemberRow {
  id: number;
  name: { es: string; en: string };
  artwork: string | null;
  stats: Stats;
}

/** axis label anchors so the six labels hug the hexagon without clipping */
const labelAnchor = (cos: number) => (cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle');

export default function TeamProfile({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<GameData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGame(gameId)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const lang = useLang();

  const teamState = useTeamStore((s) => s.teams);

  const members: MemberRow[] = useMemo(() => {
    if (!game) return [];
    return (teamState[gameId] ?? [])
      .map((id) => game.pokemon.find((p) => p.id === id))
      .filter((p): p is GamePokemon => Boolean(p))
      .map((p) => ({ id: p.id, name: p.name, artwork: p.sprites.official, stats: p.stats }));
  }, [game, teamState, gameId]);

  const averages = useMemo(() => teamAverageStats(members.map((m) => m.stats)), [members]);

  if (loadError) return null;

  const t = {
    heading: lang === 'en' ? 'Team profile' : 'Perfil del equipo',
    hint:
      lang === 'en'
        ? 'Average base stats and a first-pass role per member (v1 heuristics).'
        : 'Medias de stats base y un rol por miembro (heurísticas v1).',
    empty:
      lang === 'en'
        ? 'Add Pokémon to the team to see the profile.'
        : 'Añade Pokémon al equipo para ver el perfil.',
    radarCaption:
      lang === 'en'
        ? 'Radar of the team average base stats'
        : 'Radar de las medias de stats base del equipo',
    roleHeading: lang === 'en' ? 'Roles' : 'Roles',
  };

  if (!game) {
    return (
      <div aria-busy="true" className="paper-panel paper-grain p-6">
        <p className="animate-blink font-display text-lg text-ink-900">
          {lang === 'en' ? 'Loading profile…' : 'Cargando perfil…'}
        </p>
      </div>
    );
  }

  /* radar geometry: 6 axes, top = PS/HP, clockwise (matches radarPolygon) */
  const cx = 120;
  const R = 78;
  const pts = radarPolygon(averages, cx, R);
  const ring = (f: number) =>
    radarPolygon(
      {
        hp: RADAR_CAP * f,
        attack: RADAR_CAP * f,
        defense: RADAR_CAP * f,
        specialAttack: RADAR_CAP * f,
        specialDefense: RADAR_CAP * f,
        speed: RADAR_CAP * f,
      },
      cx,
      R,
    );

  return (
    <div className="paper-panel p-4 sm:p-5">
      <div className="border-b-2 border-ink-900/15 pb-3">
        <h2 className="font-display text-2xl leading-none text-ink-950">{t.heading}</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">{t.hint}</p>
      </div>

      {!members.length ? (
        <div className="mt-4 border-2 border-dashed border-ink-900/30 bg-paper-50 p-6 text-center">
          <span aria-hidden="true" className="text-2xl text-ember-600">
            ⬡
          </span>
          <p className="mt-2 text-sm text-ink-600">{t.empty}</p>
        </div>
      ) : (
        <div className="mt-4 grid items-center gap-4 sm:grid-cols-[13rem_1fr]">
          {/* average stats radar (pure SVG, no libraries) */}
          <div className="mx-auto w-52 max-w-full border-2 border-ink-900/15 bg-paper-50 paper-grain p-2">
            <svg viewBox="0 0 240 240" role="img" aria-label={t.radarCaption} className="w-full">
              {/* grid: rings + axes */}
              {[1 / 3, 2 / 3, 1].map((f) => (
                <polygon
                  key={f}
                  points={ring(f)
                    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                    .join(' ')}
                  fill="none"
                  stroke="var(--color-paper-400)"
                  strokeWidth={f === 1 ? 2 : 1}
                />
              ))}
              {pts.map((p) => (
                <line
                  key={`ax-${p.key}`}
                  x1={cx}
                  y1={cx}
                  x2={p.ax}
                  y2={p.ay}
                  stroke="var(--color-paper-400)"
                  strokeWidth="1"
                />
              ))}
              {/* the team polygon */}
              <polygon
                points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                fill="var(--color-ember-500)"
                fillOpacity="0.22"
                stroke="var(--color-ember-700)"
                strokeWidth="2"
              />
              {pts.map((p) => (
                <rect
                  key={`dot-${p.key}`}
                  x={p.x - 2}
                  y={p.y - 2}
                  width={5}
                  height={5}
                  fill="var(--color-ink-900)"
                />
              ))}
              {/* axis labels */}
              {pts.map((p) => (
                <text
                  key={`lb-${p.key}`}
                  x={cx + (p.ax - cx) * 1.18}
                  y={cx + (p.ay - cx) * 1.18 + 3}
                  textAnchor={labelAnchor((p.ax - cx) / R)}
                  className="fill-ink-600 font-display"
                  fontSize="10"
                >
                  {STAT_SHORT[lang][p.key]}
                </text>
              ))}
            </svg>
          </div>

          {/* roles per member */}
          <div>
            <h3 className="font-display text-xs tracking-[0.14em] text-ink-600 uppercase">
              {t.roleHeading}
            </h3>
            <ul className="mt-2 space-y-2 md:grid md:grid-cols-2 md:space-y-0 md:gap-x-6 md:gap-y-2">
              {members.map((m) => {
                const role = detectRole(m.stats);
                return (
                  <li key={m.id} className="flex items-center gap-2">
                    {m.artwork ? (
                      <img
                        src={m.artwork}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        width={32}
                        height={32}
                        className="size-8 shrink-0 [object-fit:contain]"
                      />
                    ) : null}
                    <span className="w-24 shrink-0 truncate font-display text-sm text-ink-950">
                      {m.name[lang]}
                    </span>
                    <span
                      className={
                        'border-2 px-1.5 py-0.5 font-display text-[11px] tracking-wide uppercase ' +
                        ROLE_CHIP[role]
                      }
                      aria-label={`${m.name[lang]}: ${ROLE_LABEL[role][lang]}`}
                    >
                      {ROLE_LABEL[role][lang]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
