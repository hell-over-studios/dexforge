/**
 * Defensive analysis charts (T3.2 + T3.4, v0.3.0) — pixel-cozy panel under the
 * picker. Data: ONLY the static per-game dataset + /data/types.json, through
 * src/lib/analysis.ts + src/lib/summary.ts (never PokeAPI, never a modern
 * static chart: rows are each game's OWN attacking types, so Red/Blue keeps
 * its 15 Gen-I rows). Mobile (<md): stacked per-member cards. Desktop:
 * attacker x member matrix. Below: v1 suggestions (shared weaknesses,
 * immunities, team-wide resists) as cozy text lines. Fails silent if the
 * data won't load (cosmetic panel).
 * ADR-012 «Revista»: a "what hurts most" box on top (magenta, with the
 * members that suffer it), then the heatmap in press colors — magenta for
 * danger, cyan for resists, black for immunities.
 */
import { useEffect, useMemo, useState } from 'react';
import { analyzeTeam, type TeamMemberInput } from '../lib/analysis';
import { summarizeDefenses } from '../lib/summary';
import { loadGame, loadTypeMeta, type TypeMeta } from '../lib/dex';
import { typeChipStyle } from '../lib/contrast';
import { useLang } from '../lib/use-lang';
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

/** press heatmap: magenta = weakness, cyan = resistance, black = immune */
const chipClass = (m: number) => {
  switch (m) {
    case 4:
      return 'border-ink-950 bg-magenta-500 text-paper-50';
    case 2:
      return 'border-ink-950 bg-magenta-300 text-ink-950';
    case 0:
      return 'border-ink-950 bg-ink-950 text-paper-50';
    case 0.25:
      return 'border-ink-950 bg-moss-500 text-ink-950';
    case 0.5:
      return 'border-ink-950 bg-moss-300 text-ink-950';
    default:
      return 'border-ink-900/20 bg-paper-50 text-ink-500';
  }
};

/** the most damaging attacking types: most weak members first, then the worst multiplier */
const HURT_TOP = 3;

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
  const lang = useLang();

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

  const hurts = useMemo(() => {
    if (!profile) return [];
    return profile.rows
      .map((row) => {
        const weak = row.perMember
          .map((m, i) => ({ m, i }))
          .filter((x) => x.m > 1)
          .map((x) => x.i);
        const worst = Math.max(...row.perMember);
        return { attack: row.attack, weak, worst };
      })
      .filter((h) => h.weak.length > 0)
      .sort((a, b) => b.weak.length - a.weak.length || b.worst - a.worst)
      .slice(0, HURT_TOP);
  }, [profile]);

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
    hurtKicker: lang === 'en' ? 'What hurts most' : 'Lo que más duele',
    hurtCount: (n: number) =>
      lang === 'en'
        ? `${n} weak member${n === 1 ? '' : 's'}`
        : `${n} ${n === 1 ? 'miembro débil' : 'miembros débiles'}`,
    hurtNone:
      lang === 'en'
        ? 'Nothing hits this team super effectively. Rare: enjoy it.'
        : 'Ningún tipo golpea súper eficaz a este equipo. Es raro: disfrútalo.',
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
      <div aria-busy="true" className="paper-panel paper-grain p-6">
        <p className="animate-blink font-display text-lg text-ink-900">
          {lang === 'en' ? 'Loading analysis…' : 'Cargando análisis…'}
        </p>
      </div>
    );
  }

  return (
    <div className="paper-panel p-4 sm:p-5">
      <div className="border-b-2 border-ink-900/15 pb-3">
        <h2 className="font-headline text-3xl leading-none text-ink-950 uppercase">{t.heading}</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">{t.hint}</p>
      </div>

      {!profile ? (
        /* empty team state */
        <div className="mt-4 border-2 border-dashed border-ink-900/30 bg-paper-50 p-6 text-center">
          <span aria-hidden="true" className="text-2xl text-magenta-500">
            ⬡
          </span>
          <p className="mt-2 text-sm text-ink-600">{t.empty}</p>
        </div>
      ) : (
        <>
          {/* «Revista»: the headline of the analysis — what hurts the team most */}
          <div className="mt-4">
            <p className="kicker text-xs text-magenta-600">{t.hurtKicker}</p>
            {hurts.length === 0 ? (
              <p className="mt-2 border-2 border-ink-950 bg-moss-300 px-3 py-2 text-sm font-semibold text-ink-950">
                {t.hurtNone}
              </p>
            ) : (
              <ol className="mt-2 grid gap-3 sm:grid-cols-3">
                {hurts.map((h, rank) => (
                  <li
                    key={h.attack}
                    className={
                      'border-2 border-ink-950 p-2.5 ' +
                      (rank === 0
                        ? 'rotate-[-1deg] bg-magenta-500 text-paper-50 shadow-pixel'
                        : 'bg-paper-50 text-ink-950 shadow-pixel-sm')
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-3 shrink-0 rounded-full border-2 border-ink-950"
                        style={{ backgroundColor: typeColor(h.attack) }}
                      />
                      <span className="font-headline text-2xl leading-none uppercase">
                        {typeName(h.attack)}
                      </span>
                      <span className="ml-auto font-headline text-2xl leading-none">
                        {h.weak.length}/{members.length}
                      </span>
                    </span>
                    <span className="mt-1 block kicker text-[11px] opacity-90">
                      {t.hurtCount(h.weak.length)}
                      {h.worst >= 4 ? ' · ×4' : ''}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1">
                      {h.weak.map((i) =>
                        members[i].artwork ? (
                          <img
                            key={members[i].id}
                            src={members[i].artwork ?? undefined}
                            alt={members[i].name[lang]}
                            title={members[i].name[lang]}
                            loading="lazy"
                            decoding="async"
                            width={32}
                            height={32}
                            className="size-8 rounded-full border-2 border-ink-950 bg-paper-50 [object-fit:contain]"
                          />
                        ) : (
                          <span key={members[i].id} className="text-xs">
                            {members[i].name[lang]}
                          </span>
                        ),
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* mobile-first: stacked per-member cards */}
          <ul className="mt-4 grid gap-3 md:hidden">
            {profile.members.map((_, mi) => {
              const mem = members[mi];
              return (
                <li key={mem.id} className="border-2 border-ink-900/20 bg-paper-50 p-2">
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
                    <span className="font-display text-sm text-ink-950">{mem.name[lang]}</span>
                    <span className="ml-auto flex gap-1">
                      {mem.types.map((tp) => (
                        <span
                          key={tp}
                          className="border border-ink-950 px-1 font-display text-[11px] tracking-wide uppercase"
                          style={typeChipStyle(typeColor(tp))}
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
                              'inline-flex items-center gap-1 border-2 px-1 py-0.5 font-display text-[11px] ' +
                              chipClass(val)
                            }
                            aria-label={`${typeName(row.attack)} ${lang === 'en' ? 'vs' : 'contra'} ${mem.name[lang]}: ${label(val)}`}
                          >
                            <span
                              aria-hidden="true"
                              className="size-2 border border-ink-950/40"
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
                <th scope="col" className="w-24 pb-1 font-display text-xs font-normal text-ink-600">
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
                    <span className="mt-0.5 block font-display text-[11px] leading-tight text-ink-600">
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
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-3 border border-ink-950"
                        style={{ backgroundColor: typeColor(row.attack) }}
                      />
                      <span className="text-ink-800">{typeName(row.attack)}</span>
                    </span>
                  </th>
                  {row.perMember.map((m, i) => (
                    <td key={profile.members[i].id} className="px-1 text-center">
                      <span
                        className={
                          'inline-block min-w-10 border-2 px-1 py-0.5 font-display text-xs ' +
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
        <div className="mt-4 border-t-2 border-ink-900/15 pt-3">
          <h3 className="kicker text-xs text-magenta-600">{t.notes}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {summary.sharedWeaknesses.map((w) => (
              <li key={`sh-${w.attack}`} className="text-ink-800">
                <span aria-hidden="true" className="mr-1 text-magenta-600">
                  ⚠
                </span>
                {t.warn(w.indices.map((i) => members[i].name[lang]).join(', '), typeName(w.attack))}
              </li>
            ))}
            {summary.immunities.map((imm) =>
              imm.indices.map((i) => (
                <li key={`im-${imm.attack}-${i}`} className="text-ink-800">
                  <span aria-hidden="true" className="mr-1 text-moss-600">
                    ⬡
                  </span>
                  {t.immune(members[i].name[lang], typeName(imm.attack))}
                </li>
              )),
            )}
            {summary.teamResists.map((r) => (
              <li key={`tr-${r}`} className="text-ink-800">
                <span aria-hidden="true" className="mr-1 text-moss-600">
                  ▐
                </span>
                {t.resists(typeName(r))}
              </li>
            ))}
            {summary.sharedWeaknesses.length === 0 &&
              summary.immunities.length === 0 &&
              summary.teamResists.length === 0 && <li className="text-ink-600">{t.noNotes}</li>}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
