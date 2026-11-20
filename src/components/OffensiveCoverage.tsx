/**
 * Offensive coverage panel (T4.3) — pixel-cozy sibling of the defensive chart.
 * Reads ONLY the static per-game dataset: the team's picked move slots joined
 * with `game.moves` and the game's OWN `typeChart`, through src/lib/coverage.ts.
 * Never PokeAPI, never a modern chart (Red/Blue keeps its Gen-I matchups).
 *
 * Desktop: defender × member matrix with each member's best multiplier.
 * Mobile: one card per member listing the types it hits for 2× or more.
 * Above both: the milestone note — types no member can hit super effectively.
 * Only damaging moves with base power count (status/fixed damage are excluded).
 * ADR-012 «Revista»: cyan = answer, magenta = walled, black = immune; quiet ×1 cells.
 */
import { useEffect, useMemo, useState } from 'react';
import { analyzeCoverage, type CoverageMemberInput } from '../lib/coverage';
import { loadGame, loadTypeMeta, type TypeMeta } from '../lib/dex';
import { typeChipStyle } from '../lib/contrast';
import { useLang } from '../lib/use-lang';
import { NO_MOVES } from '../lib/moves';
import { useTeamStore } from '../lib/team';
import type { GameData, GamePokemon } from '../lib/data-schema';

/** multiplier -> compact label (single-type defenders only use 0/0.5/1/2) */
const MULT_LABEL: Record<string, string> = {
  '0': '×0',
  '0.25': '×¼',
  '0.5': '×½',
  '1': '×1',
  '2': '×2',
  '4': '×4',
};

/** offense heatmap: cyan = super effective, magenta = resisted, black = immune */
const chipClass = (m: number) => {
  if (m >= 2) return 'border-ink-950 bg-moss-500 text-ink-950';
  if (m === 0) return 'border-ink-950 bg-ink-950 text-paper-50';
  if (m < 1) return 'border-ink-950 bg-magenta-300 text-ink-950';
  return 'border-ink-900/20 bg-paper-50 text-ink-500';
};

interface MemberRow extends CoverageMemberInput {
  artwork: string | null;
}

export default function OffensiveCoverage({ gameId }: { gameId: string }) {
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

  const lang = useLang();
  const teamState = useTeamStore((s) => s.teams);
  const moveState = useTeamStore((s) => s.moves);

  const members: MemberRow[] = useMemo(() => {
    if (!game) return [];
    return (teamState[gameId] ?? [])
      .map((id) => game.pokemon.find((p) => p.id === id))
      .filter((p): p is GamePokemon => Boolean(p))
      .map((p) => ({
        id: p.id,
        name: p.name,
        moves: moveState[gameId]?.[String(p.id)] ?? NO_MOVES,
        artwork: p.sprites.official,
      }));
  }, [game, teamState, moveState, gameId]);

  const profile = useMemo(
    () =>
      game && members.length
        ? analyzeCoverage(
            members.map((m) => ({ id: m.id, name: m.name, moves: m.moves })),
            game.typeChart,
            game.moves,
          )
        : null,
    [game, members],
  );

  if (loadError) return null;

  const t = {
    heading: lang === 'en' ? 'Offensive coverage' : 'Cobertura ofensiva',
    hint:
      lang === 'en'
        ? 'Which types your team can hit for 2× or more with the moves you picked. Only damaging moves with base power count.'
        : 'A qué tipos puede golpear tu equipo ×2 o más con los movimientos elegidos. Solo cuentan los movimientos de daño con potencia.',
    emptyTeam:
      lang === 'en'
        ? 'Add Pokémon to the team to see the coverage.'
        : 'Añade Pokémon al equipo para ver la cobertura.',
    emptyMoves:
      lang === 'en'
        ? 'Pick moves in each Pokémon’s card to measure the coverage.'
        : 'Elige movimientos en la ficha de cada Pokémon para medir la cobertura.',
    gapsTitle: lang === 'en' ? 'No super-effective hit' : 'Sin golpe súper eficaz',
    gapsHint:
      lang === 'en'
        ? 'No member can hit these types for 2× or more.'
        : 'Ningún miembro puede golpear a estos tipos ×2 o más.',
    allCovered: (count: number) =>
      lang === 'en'
        ? `Every one of the ${count} defending types has a super-effective answer.`
        : `Los ${count} tipos defensores tienen respuesta súper eficaz.`,
    answers: lang === 'en' ? 'Answers per member' : 'Respuestas por miembro',
    noAnswers:
      lang === 'en' ? 'No super-effective moves picked.' : 'Sin movimientos súper eficaces.',
    caption:
      lang === 'en'
        ? 'Best multiplier of each member’s picked moves against each defending type'
        : 'Mejor multiplicador de los movimientos elegidos de cada miembro contra cada tipo defensor',
    footnote:
      lang === 'en'
        ? 'Status moves and fixed-damage moves are left out: they do not use the type chart for damage.'
        : 'Los movimientos de estado y los de daño fijo quedan fuera: no usan la tabla de tipos para el daño.',
    loading: lang === 'en' ? 'Loading coverage…' : 'Cargando cobertura…',
    memberMoves: (count: number) => (lang === 'en' ? `${count} damaging` : `${count} de daño`),
  };

  const typeName = (slug: string) => meta.names[slug]?.[lang] ?? slug;
  const typeColor = (slug: string) => meta.colors[slug] ?? '#57504a';
  const label = (m: number) => MULT_LABEL[String(m)] ?? `×${m}`;

  if (!game) {
    return (
      <div aria-busy="true" className="paper-panel paper-grain p-6">
        <p className="animate-blink font-display text-lg text-ink-900">{t.loading}</p>
      </div>
    );
  }

  const noTeam = members.length === 0;
  const noMoves = !noTeam && Boolean(profile?.empty);

  return (
    <div className="paper-panel p-4 sm:p-5">
      <div className="border-b-2 border-ink-900/15 pb-3">
        <h2 className="font-headline text-3xl leading-none text-ink-950 uppercase">{t.heading}</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">{t.hint}</p>
      </div>

      {noTeam || noMoves || !profile ? (
        <div className="mt-4 border-2 border-dashed border-ink-900/30 bg-paper-50 p-6 text-center">
          <span aria-hidden="true" className="text-2xl text-magenta-500">
            ◈
          </span>
          <p className="mt-2 text-sm text-ink-600">{noTeam ? t.emptyTeam : t.emptyMoves}</p>
          {noMoves ? <p className="mt-1 text-xs text-ink-500">{t.footnote}</p> : null}
        </div>
      ) : (
        <>
          {/* the milestone question: which types has nobody got an answer for? */}
          <div
            role="group"
            aria-label={
              lang === 'en'
                ? 'Types without super-effective coverage'
                : 'Tipos sin cobertura súper eficaz'
            }
            className={
              'mt-4 border-2 p-3 ' +
              (profile.gaps.length
                ? 'border-ink-950 bg-magenta-300/40'
                : 'border-ink-950 bg-moss-300/50')
            }
          >
            {profile.gaps.length ? (
              <>
                <p className="kicker text-xs text-ink-800">{t.gapsTitle}</p>
                <p className="mt-1 text-xs text-ink-700">{t.gapsHint}</p>
                <ul className="mt-2 flex flex-wrap gap-1">
                  {profile.gaps.map((slug) => (
                    <li key={slug}>
                      <span className="type-chip" style={typeChipStyle(typeColor(slug))}>
                        {typeName(slug)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-800">
                <span aria-hidden="true" className="text-moss-600">
                  ✓
                </span>
                {t.allCovered(profile.defenders.length)}
              </p>
            )}
          </div>

          {/* desktop: defender × member matrix */}
          <table className="mt-4 hidden border-separate border-spacing-x-1 border-spacing-y-1.5 text-left md:table">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-24 pb-1 font-display text-xs font-normal text-ink-600">
                  {lang === 'en' ? 'Defender' : 'Defensor'}
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
              {profile.defenders.map((defender) => (
                <tr key={defender} className="align-middle">
                  <th scope="row" className="py-0.5 font-display text-xs font-normal">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-3 border border-ink-950"
                        style={{ backgroundColor: typeColor(defender) }}
                      />
                      <span className="text-ink-800">{typeName(defender)}</span>
                    </span>
                  </th>
                  {profile.members.map((member) => {
                    const value = member.best[defender];
                    const move = member.bestMove[defender];
                    if (value === undefined) {
                      return (
                        <td key={member.id} className="px-1 text-center">
                          <span className="text-xs text-ink-400" aria-hidden="true">
                            —
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={member.id} className="px-1 text-center">
                        <span
                          className={
                            'inline-block min-w-10 border-2 px-1 py-0.5 font-display text-xs ' +
                            chipClass(value)
                          }
                          aria-label={`${member.name[lang]}: ${move?.name[lang] ?? ''} ${lang === 'en' ? 'vs' : 'contra'} ${typeName(defender)} ${label(value)}`}
                        >
                          {label(value)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* mobile: one card per member with the types it answers */}
          <div className="mt-4 md:hidden">
            <h3 className="kicker text-xs text-magenta-600">{t.answers}</h3>
            <ul className="mt-2 grid gap-3">
              {members.map((mem, mi) => {
                const member = profile.members[mi];
                const answered = profile.defenders.filter(
                  (defender) => (member.best[defender] ?? 0) >= 2,
                );
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
                      <span className="ml-auto text-[10px] text-ink-500">
                        {t.memberMoves(member.moves.length)}
                      </span>
                    </div>
                    {answered.length ? (
                      <ul className="mt-2 flex flex-wrap gap-1">
                        {answered.map((slug) => (
                          <li key={slug}>
                            <span
                              className="type-chip"
                              style={typeChipStyle(typeColor(slug))}
                              aria-label={`${lang === 'en' ? 'super effective against' : 'súper eficaz contra'} ${typeName(slug)}`}
                            >
                              {typeName(slug)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-ink-600">{t.noAnswers}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-3 border-t-2 border-ink-900/15 pt-2 text-[11px] leading-relaxed text-ink-600">
            {t.footnote}
          </p>
        </>
      )}
    </div>
  );
}
