/**
 * Move picker (T4.2) — four move slots plus an in-place learnset list inside
 * the detail drawer. Learnsets come from the game dataset (T4.1: version-group
 * filtered, so Red/Blue never offers a Gen-II move); picked moves live in the
 * team store, persist in localStorage and ride the v2 share payload.
 * Choices only apply to team members: a mon that is not in the team gets a
 * one-line hint instead of a picker.
 */
import { useMemo, useState } from 'react';
import type {
  GamePokemon,
  LocalizedText,
  MoveDamageClass,
  MoveInfo,
  MoveMethod,
} from '../lib/data-schema';
import { typeChipStyle } from '../lib/contrast';
import type { Lang } from '../lib/i18n';
import {
  buildMoveRows,
  filterMoveRows,
  MAX_MOVES,
  moveTypes,
  NO_MOVES,
  type MoveRow,
} from '../lib/moves';
import { useTeamStore } from '../lib/team';
import { useLang } from '../lib/use-lang';

interface Props {
  mon: GamePokemon;
  gameId: string;
  /** national move id (as string) -> details, from the game dataset */
  moveDex: Record<string, MoveInfo>;
  /** type slug -> canonical color */
  colors: Record<string, string>;
  /** type slug -> localized label */
  typeNames: Record<string, LocalizedText>;
  /** pickers are only enabled for team members */
  inTeam: boolean;
}

const damageLabel = (damageClass: MoveDamageClass, lang: Lang): string => {
  const labels = {
    physical: { es: 'Fís.', en: 'Phys.' },
    special: { es: 'Esp.', en: 'Spec.' },
    status: { es: 'Estado', en: 'Status' },
  } as const;
  return labels[damageClass][lang];
};

const methodLabel = (method: MoveMethod, level: number | null, lang: Lang): string => {
  if (method === 'level-up') return `${lang === 'en' ? 'Lv.' : 'Nv.'} ${level ?? '—'}`;
  if (method === 'machine') return lang === 'en' ? 'TM' : 'MT';
  if (method === 'tutor') return 'Tutor';
  return lang === 'en' ? 'Egg' : 'Huevo';
};

export default function MovePicker({ mon, gameId, moveDex, colors, typeNames, inTeam }: Props) {
  const lang = useLang();
  const slots = useTeamStore((s) => s.moves[gameId]?.[String(mon.id)] ?? NO_MOVES);
  const toggleMove = useTeamStore((s) => s.toggleMove);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const rows = useMemo(() => buildMoveRows(mon, moveDex), [mon, moveDex]);
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const types = useMemo(() => moveTypes(rows), [rows]);
  const visible = useMemo(
    () => filterMoveRows(rows, { query, type, lang }),
    [rows, query, type, lang],
  );

  const typeLabel = (slug: string) =>
    slug === 'unknown' ? '???' : (typeNames[slug]?.[lang] ?? slug);

  const toggle = (row: MoveRow) => {
    const replaced =
      slots.length >= MAX_MOVES && !slots.includes(row.id) ? byId.get(slots[0]) : undefined;
    const result = toggleMove(gameId, mon.id, row.id);
    if (result === 'replaced-oldest') {
      setNote(
        lang === 'en'
          ? `Replaced ${replaced?.info.name.en ?? 'the first move'}.`
          : `Salió ${replaced?.info.name.es ?? 'el primer movimiento'}.`,
      );
    } else if (result === 'removed') {
      setNote(lang === 'en' ? `Removed ${row.info.name.en}.` : `Quitado: ${row.info.name.es}.`);
    } else {
      setNote(lang === 'en' ? `Added ${row.info.name.en}.` : `Añadido: ${row.info.name.es}.`);
    }
  };

  const searchId = `move-search-${mon.id}`;
  const toggleId = `move-toggle-${mon.id}`;
  const panelId = `move-panel-${mon.id}`;

  if (!inTeam) {
    return (
      <div className="mt-3 border-t-2 border-ink-900/15 pt-3">
        <p className="font-display text-xs text-ink-600">
          {lang === 'en' ? 'Moves' : 'Movimientos'}
        </p>
        <p className="mt-1 text-xs text-ink-600">
          {lang === 'en'
            ? `Add ${mon.name.en} to the team to pick up to 4 moves.`
            : `Añade a ${mon.name.es} al equipo para elegir hasta 4 movimientos.`}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t-2 border-ink-900/15 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-xs text-ink-600">
          {lang === 'en' ? 'Moves' : 'Movimientos'}
        </p>
        <span className="border border-ink-900/30 bg-paper-200 px-1.5 py-0.5 font-display text-[10px] text-ink-700">
          {slots.length}/{MAX_MOVES}
        </span>
      </div>

      <ul
        aria-label={lang === 'en' ? 'Selected moves' : 'Movimientos elegidos'}
        className="mt-1 grid grid-cols-2 gap-1.5"
      >
        {Array.from({ length: MAX_MOVES }, (_, index) => {
          const id = slots[index];
          const row = id !== undefined ? byId.get(id) : undefined;
          if (!row) {
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label={
                    lang === 'en'
                      ? `Pick move ${index + 1} of ${MAX_MOVES}`
                      : `Elegir movimiento ${index + 1} de ${MAX_MOVES}`
                  }
                  className="flex h-full min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 border-2 border-dashed border-ink-900/35 bg-paper-100/60 px-1 text-ink-600 transition-colors hover:border-ink-700 hover:bg-paper-100"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-lg leading-none text-ember-600"
                  >
                    ＋
                  </span>
                  <span className="font-display text-[10px] tracking-wide uppercase">
                    {lang === 'en' ? 'Move' : 'Movimiento'}
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li key={index}>
              <div className="flex h-full flex-col gap-1 border-2 border-ink-950 bg-paper-50 p-1.5 shadow-pixel-sm">
                <div className="flex items-start gap-1">
                  <span className="min-w-0 flex-1 truncate font-display text-[11px] leading-tight text-ink-900">
                    {row.info.name[lang]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(row)}
                    aria-label={
                      lang === 'en' ? `Remove ${row.info.name.en}` : `Quitar ${row.info.name.es}`
                    }
                    className="shrink-0 cursor-pointer border border-ink-950 bg-paper-100 px-1 font-display text-[10px] leading-none text-ink-800 transition-colors hover:bg-paper-200"
                  >
                    ✕
                  </button>
                </div>
                {colors[row.info.type] ? (
                  <span
                    className="type-chip self-start"
                    style={typeChipStyle(colors[row.info.type])}
                  >
                    {typeLabel(row.info.type)}
                  </span>
                ) : (
                  <span className="type-chip self-start bg-paper-300 text-ink-900">
                    {typeLabel(row.info.type)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        id={toggleId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="mt-2 w-full cursor-pointer border-2 border-ink-950 bg-paper-50 px-2 py-1 font-display text-[11px] tracking-wide text-ink-900 uppercase shadow-pixel-sm transition-colors hover:bg-paper-100"
      >
        {open
          ? lang === 'en'
            ? 'Hide move list'
            : 'Ocultar lista'
          : lang === 'en'
            ? 'Choose moves'
            : 'Elegir movimientos'}
      </button>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
        {lang === 'en'
          ? 'Pick up to 4. A fifth replaces the first one.'
          : 'Elige hasta 4. El quinto sustituye al primero.'}
      </p>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label={lang === 'en' ? 'Move list' : 'Lista de movimientos'}
          className="mt-2 animate-pop-in border-2 border-ink-900/20 bg-paper-100 p-2"
        >
          <label htmlFor={searchId} className="block font-display text-[11px] text-ink-600">
            {lang === 'en' ? 'Search moves' : 'Buscar movimiento'}
          </label>
          <input
            id={searchId}
            type="text"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={lang === 'en' ? 'Name…' : 'Nombre…'}
            className="mt-1 block w-full border-2 border-ink-950 bg-paper-50 px-2 py-1 font-body text-sm shadow-pixel-sm placeholder:text-ink-500"
          />

          <div
            role="group"
            aria-label={lang === 'en' ? 'Filter by type' : 'Filtrar por tipo'}
            className="mt-1.5 flex flex-wrap gap-1"
          >
            <button
              type="button"
              aria-pressed={type === null}
              onClick={() => setType(null)}
              className={
                'type-chip shrink-0 cursor-pointer ' +
                (type === null
                  ? 'bg-ink-950 text-paper-50'
                  : 'bg-paper-200 text-ink-800 hover:bg-paper-300')
              }
            >
              {lang === 'en' ? 'All' : 'Todos'}
            </button>
            {types.map((slug) => (
              <button
                key={slug}
                type="button"
                aria-pressed={type === slug}
                onClick={() => setType(type === slug ? null : slug)}
                className={
                  'type-chip shrink-0 cursor-pointer transition-opacity ' +
                  (type === slug
                    ? 'ring-2 ring-ink-950 ring-offset-1'
                    : 'opacity-70 hover:opacity-100')
                }
                style={colors[slug] ? typeChipStyle(colors[slug]) : undefined}
              >
                {typeLabel(slug)}
              </button>
            ))}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p aria-live="polite" className="min-h-4 text-[11px] text-ink-700">
              {note}
            </p>
            <p className="shrink-0 text-[10px] text-ink-500">
              {visible.length} {lang === 'en' ? 'moves' : 'movs.'}
            </p>
          </div>

          <ul
            aria-label={lang === 'en' ? 'Learnable moves' : 'Movimientos aprendibles'}
            className="mt-1 grid max-h-72 gap-1 overflow-y-auto overscroll-contain pr-0.5"
          >
            {visible.map((row) => {
              const selected = slots.includes(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(row)}
                    className={
                      'w-full cursor-pointer border-2 px-2 py-1.5 text-left transition-colors ' +
                      (selected
                        ? 'border-ember-600 bg-ember-300/30'
                        : 'border-ink-900/20 bg-paper-50 hover:border-ink-700 hover:bg-paper-100')
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate font-display text-xs text-ink-900">
                        {row.info.name[lang]}
                      </span>
                      {colors[row.info.type] ? (
                        <span
                          className="type-chip shrink-0"
                          style={typeChipStyle(colors[row.info.type])}
                        >
                          {typeLabel(row.info.type)}
                        </span>
                      ) : (
                        <span className="type-chip shrink-0 bg-paper-300 text-ink-900">
                          {typeLabel(row.info.type)}
                        </span>
                      )}
                      {selected ? (
                        <span
                          aria-hidden="true"
                          className="shrink-0 font-display text-xs text-ember-700"
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-ink-600">
                      <span>{damageLabel(row.info.damageClass, lang)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {lang === 'en' ? 'Power' : 'Pot.'} {row.info.power ?? '—'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {lang === 'en' ? 'Acc.' : 'Prec.'} {row.info.accuracy ?? '—'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>PP {row.info.pp ?? '—'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-ink-700">
                        {methodLabel(row.method, row.level, lang)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {visible.length === 0 ? (
            <p className="mt-1 text-xs text-ink-600">
              {lang === 'en'
                ? 'No moves match that filter.'
                : 'Ningún movimiento coincide con el filtro.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
