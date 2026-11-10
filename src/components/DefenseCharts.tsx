/**
 * Defensive analysis charts (T3.2 + T3.4, v0.3.0) — pixel-cozy panel under the
 * picker. Data: ONLY the static per-game dataset + /data/types.json, through
 * src/lib/analysis.ts + src/lib/summary.ts (never PokeAPI, never a modern
 * static chart: rows are each game's OWN attacking types, so Red/Blue keeps
 * its 15 Gen-I rows). Mobile (<md): stacked per-member cards. Desktop:
 * attacker x member matrix. Below: v1 suggestions (shared weaknesses,
 * immunities, team-wide resists) as cozy text lines. Fails silent if the
 * data won't load (cosmetic panel).
 */
import { useEffect, useMemo, useState } from 'react';
import { analyzeTeam, type TeamMemberInput } from '../lib/analysis';
import { summarizeDefenses } from '../lib/summary';
import { loadGame, loadTypeMeta, type TypeMeta } from '../lib/dex';
import { useTeamStore } from '../lib/team';
import type { GameData, GamePokemon } from '../lib/data-schema';

/** multiplier -> display label (composition can only reach 0/0.25/0.5/1/2/4) */
const MULT_LABEL: Record<string, string> = {
  '0': '×0',
  '0.25': '×¼',
  '0.5': '×½',
  '1': '×1',
  '2': '×2',
  '4': '×4',
};

/** value-coded chip palette: ember = weakness, moss = resistance, dusk = immune */
const chipClass = (m: number) => {
  switch (m) {
    case 4:
      return 'border-ember-600 bg-ember-500 text-bark-950';
    case 2:
      return 'border-ember-700 bg-ember-700/40 text-parchment-100';
    case 0:
      return 'border-bark-800 bg-bark-950 text-parchment-600';
    case 0.25:
    case 0.5:
      return 'border-moss-700 bg-moss-500/25 text-parchment-100';
    default:
      return 'border-bark-700 bg-bark-900 text-parchment-600';
  }
};

interface MemberRow extends TeamMemberInput {
  artwork: string | null;
}

export default function DefenseCharts({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<GameData | null>(null);
  const [meta, setMeta] = useState<TypeMeta>({ colors: {}, names: {} });
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
    loadTypeMeta().then((m) => {
      if (!cancelled) setMeta(m);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  /* current UI language at render time (ES default, ?lang=en supported) */
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';

  const teamState = useTeamStore((s) => s.teams);

  const members: MemberRow[] = useMemo(() => {
    if (!game) return [];
    return (teamState[gameId] ?? [])
      .map((id) => game.pokemon.find((p) => p.id === id))
      .filter((p): p is GamePokemon => Boolean(p))
      .map((p) => ({ id: p.id, name: p.name, types: p.types, artwork: p.sprites.official }));
  }, [game, teamState, gameId]);

  const profile = useMemo(
    () => (game && members.length ? analyzeTeam(members, game.typeChart) : null),
    [game, members],
  );

  const summary = useMemo(() => (profile ? summarizeDefenses(profile) : null), [profile]);

  if (loadError) return null;

  const t = {
    heading: lang === 'en' ? 'Defensive analysis' : 'Análisis defensivo',
    hint:
      lang === 'en'
        ? 'How each attacking type (rows) lands on your team. Exact per game: Red/Blue keeps its Gen-I chart.'
        : 'Cómo le golpea cada tipo atacante (filas) a tu equipo. Exacto por juego: Rojo/Azul mantiene su tabla de Gen I.',
    empty:
      lang === 'en'
        ? 'Add Pokémon to the team to see the analysis.'
        : 'Añade Pokémon al equipo para ver el análisis.',
    caption:
      lang === 'en'
        ? 'Multipliers of each attacking type against each team member'
        : 'Multiplicadores de cada tipo atacante contra cada miembro del equipo',
    notes: lang === 'en' ? 'Notes' : 'Notas',
    warn: (names: string, ty: string) =>
      lang === 'en'
        ? `Watch out for ${ty}: it hits ×2 or more on ${names}.`
        : `Cuidado con ${ty}: golpea ×2 o más a ${names}.`,
    immune: (name: string, ty: string) =>
      lang === 'en' ? `${name} is immune to ${ty}.` : `${name} es inmune a ${ty}.`,
    resists: (ty: string) =>
      lang === 'en'
        ? `Solid answer: the whole team resists ${ty}.`
        : `Respuesta clara: todo el equipo resiste ${ty}.`,
    noNotes:
      lang === 'en'
        ? 'No warnings with this team so far.'
        : 'Sin avisos por ahora con este equipo.',
  };

  const typeName = (slug: string) => meta.names[slug]?.[lang] ?? slug;
  const typeColor = (slug: string) => meta.colors[slug] ?? '#57504a';
  const label = (m: number) => MULT_LABEL[String(m)] ?? `×${m}`;

  if (!game) {
    return (
      <div
        aria-busy="true"
        className="rounded-sm border-2 border-bark-700 bg-bark-900 dither p-6 shadow-pixel"
      >
        <p className="animate-blink text-sm text-parchment-400">
          {lang === 'en' ? 'Loading analysis…' : 'Cargando análisis…'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border-2 border-bark-700 bg-bark-900 p-4 shadow-pixel max-md:p-3">
      <h2 className="font-display text-xl text-parchment-100">{t.heading}</h2>
      <p className="mt-1 text-xs text-parchment-600">{t.hint}</p>

      {!profile ? (
        /* empty team state */
        <div className="mt-4 rounded-sm border-2 border-dashed border-bark-700 bg-bark-950 p-6 text-center">
          <span aria-hidden="true" className="text-2xl text-ember-600">
            ⬡
          </span>
          <p className="mt-2 text-sm text-parchment-400">{t.empty}</p>
        </div>
      ) : (
        <>
          {/* mobile-first: stacked per-member cards */}
          <ul className="mt-4 grid gap-3 md:hidden">
            {profile.members.map((_, mi) => {
              const mem = members[mi];
              return (
                <li
                  key={mem.id}
                  className="rounded-sm border-2 border-bark-800 bg-bark-950 p-2 shadow-pixel-sm"
                >
                  <div className="flex items-center gap-2">
                    {mem.artwork ? (
                      <img
                        src={mem.artwork}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        width={32}
                        height={32}
                        className="size-8 shrink-0 [object-fit:contain]"
                      />
                    ) : null}
                    <span className="font-display text-sm text-parchment-100">
                      {mem.name[lang]}
                    </span>
                    <span className="ml-auto flex gap-1">
                      {mem.types.map((tp) => (
                        <span
                          key={tp}
                          className="rounded-sm px-1 text-[10px] tracking-wide text-bark-950 uppercase"
                          style={{ backgroundColor: typeColor(tp) }}
                        >
                          {typeName(tp)}
                        </span>
                      ))}
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {profile.rows.map((row) => {
                      const val = row.perMember[mi];
                      return (
                        <li key={row.attack}>
                          <span
                            className={
                              'inline-flex items-center gap-1 rounded-sm border-2 px-1 py-0.5 font-display text-[11px] shadow-pixel-sm ' +
                              chipClass(val)
                            }
                            aria-label={`${typeName(row.attack)} ${lang === 'en' ? 'vs' : 'contra'} ${mem.name[lang]}: ${label(val)}`}
                          >
                            <span
                              aria-hidden="true"
                              className="size-2 rounded-sm"
                              style={{ backgroundColor: typeColor(row.attack) }}
                            />
                            {label(val)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>

          {/* desktop: full matrix (rows = per-game attacking types) */}
          <table className="mt-4 hidden w-full border-separate border-spacing-x-1 border-spacing-y-1.5 text-left md:table">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-24 pb-1 font-display text-xs text-parchment-600">
                  {lang === 'en' ? 'Type' : 'Tipo'}
                </th>
                {members.map((mem) => (
                  <th key={mem.id} scope="col" className="px-1 pb-1 text-center">
                    {mem.artwork ? (
                      <img
                        src={mem.artwork}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={40}
                        className="mx-auto size-10 [object-fit:contain]"
                      />
                    ) : null}
                    <span className="text-parchment-300 mt-0.5 block font-display text-[10px] leading-tight">
                      {mem.name[lang]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.rows.map((row) => (
                <tr key={row.attack} className="align-middle">
                  <th scope="row" className="py-0.5 font-display text-xs font-normal">
                    <span className="inline-flex items-center gap-2 rounded-sm bg-bark-800 px-1.5 py-1">
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-sm border border-bark-950"
                        style={{ backgroundColor: typeColor(row.attack) }}
                      />
                      <span className="text-parchment-200">{typeName(row.attack)}</span>
                    </span>
                  </th>
                  {row.perMember.map((m, i) => (
                    <td key={profile.members[i].id} className="px-1 text-center">
                      <span
                        className={
                          'inline-block min-w-10 rounded-sm border-2 px-1 py-0.5 font-display text-xs shadow-pixel-sm ' +
                          chipClass(m)
                        }
                        aria-label={`${typeName(row.attack)} ${lang === 'en' ? 'vs' : 'contra'} ${profile.members[i].name[lang]}: ${label(m)}`}
                      >
                        {label(m)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* T3.4: suggestions v1 — cozy text notes from the same profile, no fake data */}
      {summary ? (
        <div className="mt-4 rounded-sm border-2 border-bark-800 bg-bark-950 p-3">
          <h3 className="font-display text-sm tracking-wide text-parchment-600 uppercase">
            {t.notes}
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {summary.sharedWeaknesses.map((w) => (
              <li key={`sh-${w.attack}`} className="text-parchment-200">
                <span aria-hidden="true" className="mr-1 text-ember-400">
                  ⚠
                </span>
                {t.warn(w.indices.map((i) => members[i].name[lang]).join(', '), typeName(w.attack))}
              </li>
            ))}
            {summary.immunities.map((imm) =>
              imm.indices.map((i) => (
                <li key={`im-${imm.attack}-${i}`} className="text-parchment-200">
                  <span aria-hidden="true" className="mr-1 text-moss-500">
                    ⬡
                  </span>
                  {t.immune(members[i].name[lang], typeName(imm.attack))}
                </li>
              )),
            )}
            {summary.teamResists.map((r) => (
              <li key={`tr-${r}`} className="text-parchment-200">
                <span aria-hidden="true" className="mr-1 text-moss-500">
                  ▐
                </span>
                {t.resists(typeName(r))}
              </li>
            ))}
            {summary.sharedWeaknesses.length === 0 &&
              summary.immunities.length === 0 &&
              summary.teamResists.length === 0 && (
                <li className="text-parchment-400">{t.noNotes}</li>
              )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
