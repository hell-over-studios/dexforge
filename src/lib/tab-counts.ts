/**
 * Problem counts shown on the analysis tabs (UX-04, #80). Pure helpers over
 * the same profiles the panels render, so a tab badge never disagrees with
 * the panel behind it.
 */
import type { TeamProfile } from './analysis';
import type { CoverageProfile } from './coverage';
import { summarizeDefenses } from './summary';

/** attacking types that hit two or more members super effectively */
export function defenseAlertCount(profile: TeamProfile | null): number {
  return profile ? summarizeDefenses(profile).sharedWeaknesses.length : 0;
}

/**
 * types no member hits super effectively — only once at least one damaging
 * move was picked (with no moves every type would be a "gap")
 */
export function coverageGapCount(profile: CoverageProfile | null): number {
  return profile && !profile.empty ? profile.gaps.length : 0;
}
