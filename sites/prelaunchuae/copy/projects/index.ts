import { palmSprings } from './palm-springs.ts';
import type { ProjectEditorial } from './types.ts';

export type { ProjectEditorial };

const bySlug: Record<string, ProjectEditorial> = {
  'palm-springs': palmSprings,
};

export function projectEditorial(slug: string): ProjectEditorial | undefined {
  return bySlug[slug];
}
