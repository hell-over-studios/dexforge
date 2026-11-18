/**
 * Ability presentation helpers (pure, unit-tested): effect language fallback
 * and team peers sharing an ability.
 *
 * PokeAPI only ships Spanish ability flavor text from X/Y on, so an ability
 * can legitimately have no `es` effect; the UI shows the English line with an
 * explicit `lang` instead of silently mixing languages.
 */
import type { AbilityInfo, GamePokemon } from './data-schema';
import type { Lang } from './i18n';

export interface AbilityEffect {
  text: string;
  /** language the rendered text is actually in */
  lang: Lang;
}

export function abilityEffect(info: AbilityInfo | undefined, lang: Lang): AbilityEffect {
  if (!info) return { text: '', lang };
  if (lang === 'en') return { text: info.effect.en, lang: 'en' };
  return info.effect.es
    ? { text: info.effect.es, lang: 'es' }
    : { text: info.effect.en, lang: 'en' };
}

/** Team members (other than `excludeId`) that share the given ability slug. */
export function abilityPeers(team: GamePokemon[], slug: string, excludeId: number): GamePokemon[] {
  return team.filter((m) => m.id !== excludeId && m.abilities.some((a) => a.slug === slug));
}

/** True when the ability existed in the game's generation. */
export function isAbilityInGame(info: AbilityInfo | undefined, generation: number): boolean {
  return info ? info.generation <= generation : true;
}
