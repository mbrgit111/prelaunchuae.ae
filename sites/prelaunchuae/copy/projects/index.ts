import { palm01ByBinghatti } from './palm-01-by-binghatti.ts';
import { palmSprings } from './palm-springs.ts';
import type { ProjectEditorial } from './types.ts';

export type { ProjectEditorial };

const bySlug: Record<string, ProjectEditorial> = {
  'palm-01-by-binghatti': palm01ByBinghatti,
  'palm-springs': palmSprings,
};

export function projectEditorial(slug: string): ProjectEditorial | undefined {
  return bySlug[slug];
}
