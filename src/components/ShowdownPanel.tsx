/**
 * Showdown import/export panel (V1-01, #94) inside the team sheet. Export is
 * read-only text with a copy button; import reports every species or move that
 * does not fit the selected game instead of dropping it silently.
 */
import { useMemo, useState } from 'react';
import type { GameData } from '../lib/data-schema';
import {
  exportShowdown,
  importShowdown,
  type ShowdownIssue,
  type ShowdownMember,
} from '../lib/showdown';
import type { Lang } from '../lib/i18n';

interface Props {
  game: GameData;
  team: ShowdownMember[];
  lang: Lang;
  onImport: (members: ShowdownMember[]) => void;
}

const issueText = (issue: ShowdownIssue, lang: Lang, gameLabel: string): string => {
  switch (issue.kind) {
    case 'unknown-species':
      return lang === 'en'
        ? `${issue.text} is not in ${gameLabel}.`
        : `${issue.text} no está en ${gameLabel}.`;
    case 'unknown-move':
      return lang === 'en'
        ? `${issue.species}: “${issue.text}” is not a move of this game.`
        : `${issue.species}: «${issue.text}» no es un movimiento de este juego.`;
    case 'not-learnable':
      return lang === 'en'
        ? `${issue.species} cannot learn ${issue.text} in ${gameLabel}.`
        : `${issue.species} no puede aprender ${issue.text} en ${gameLabel}.`;
    case 'too-many-moves':
      return lang === 'en'
        ? `${issue.species}: only 4 moves fit, ${issue.text} was left out.`
        : `${issue.species}: solo caben 4 movimientos, ${issue.text} quedó fuera.`;
    case 'too-many-members':
      return lang === 'en'
        ? `Only 6 members fit, ${issue.text} was left out.`
        : `Solo caben 6 miembros, ${issue.text} quedó fuera.`;
  }
};

export default function ShowdownPanel({ game, team, lang, onImport }: Props) {
  const exported = useMemo(() => exportShowdown(team, game), [team, game]);
  const [paste, setPaste] = useState('');
  const [report, setReport] = useState<{ count: number; issues: ShowdownIssue[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const gameLabel = game.meta.label[lang];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the text stays selectable in the box */
    }
  };

  const runImport = () => {
    const result = importShowdown(paste, game);
    setReport({ count: result.members.length, issues: result.issues });
    if (result.members.length > 0) onImport(result.members);
  };

  return (
    <div className="grid gap-5 border-b-2 border-ink-950 bg-paper-100 px-4 py-4 sm:px-5 lg:grid-cols-2">
      <div>
        <label htmlFor="showdown-export" className="kicker text-xs text-ink-800">
          {lang === 'en' ? 'Export for Showdown' : 'Exportar para Showdown'}
        </label>
        <textarea
          id="showdown-export"
          readOnly
          rows={8}
          value={exported}
          placeholder={lang === 'en' ? 'Your team is empty.' : 'Tu equipo está vacío.'}
          className="mt-2 block w-full resize-y border-2 border-ink-950 bg-paper-50 p-2 font-mono text-xs text-ink-900"
        />
        <button
          type="button"
          onClick={copy}
          disabled={exported === ''}
          className="pixel-btn pixel-btn-paper mt-2 cursor-pointer px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied
            ? lang === 'en'
              ? 'Copied!'
              : '¡Copiado!'
            : lang === 'en'
              ? 'Copy text'
              : 'Copiar texto'}
        </button>
      </div>

      <div>
        <label htmlFor="showdown-import" className="kicker text-xs text-ink-800">
          {lang === 'en' ? 'Import from Showdown' : 'Importar desde Showdown'}
        </label>
        <textarea
          id="showdown-import"
          rows={8}
          value={paste}
          onChange={(ev) => setPaste(ev.currentTarget.value)}
          placeholder={'Swampert @ Leftovers\n- Earthquake\n- Surf'}
          className="mt-2 block w-full resize-y border-2 border-ink-950 bg-paper-50 p-2 font-mono text-xs text-ink-900"
        />
        <button
          type="button"
          onClick={runImport}
          disabled={paste.trim() === ''}
          className="pixel-btn pixel-btn-primary mt-2 cursor-pointer px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {lang === 'en' ? `Import into ${gameLabel}` : `Importar a ${gameLabel}`}
        </button>
        {report ? (
          <div role="status" className="mt-3 text-sm">
            <p className="font-semibold text-ink-900">
              {report.count > 0
                ? lang === 'en'
                  ? `${report.count} member(s) imported. The previous team can be restored with “Undo”.`
                  : `${report.count} miembro(s) importados. Puedes recuperar el equipo anterior con «Deshacer».`
                : lang === 'en'
                  ? 'Nothing could be imported into this game.'
                  : 'No se pudo importar nada a este juego.'}
            </p>
            {report.issues.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-700">
                {report.issues.map((issue, i) => (
                  <li key={i}>{issueText(issue, lang, gameLabel)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
