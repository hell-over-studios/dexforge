/**
 * Cross-island events. Every Astro island is its own React root, so islands
 * that need to talk (the team sheet asking the index to open a member) use a
 * small window CustomEvent instead of shared component state.
 */
export const OPEN_MEMBER_EVENT = 'dexforge:open-member';

export interface OpenMemberDetail {
  /** national dex id of the Pokémon to open in the index drawer */
  id: number;
}

/** ask the index island to open this Pokémon in its drawer */
export function requestOpenMember(id: number): void {
  window.dispatchEvent(new CustomEvent<OpenMemberDetail>(OPEN_MEMBER_EVENT, { detail: { id } }));
}
