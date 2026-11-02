/**
 * content-snapshot.json: a copy of the published content, saved at build time (scripts/snapshot-content.mjs).
 * It is used when the API cannot be reached, so the site still builds and still shows the last known articles.
 */
import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SnapshotSchema, type Snapshot } from './types';

const EMPTY: Snapshot = SnapshotSchema.parse({ generatedAt: null });
let cached: Snapshot | null = null;

export function readSnapshot(file = path.join(process.cwd(), 'content-snapshot.json')): Snapshot {
  if (cached && file.endsWith('content-snapshot.json')) return cached;
  let result = EMPTY;
  try {
    const parsed = SnapshotSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
    if (parsed.success) result = parsed.data;
  } catch {
    // No snapshot yet: the site uses the older article files instead.
  }
  if (file.endsWith('content-snapshot.json')) cached = result;
  return result;
}

export const snapshotHasContent = (snap: Snapshot) => snap.generatedAt !== null && (snap.cards.length > 0 || Object.keys(snap.posts).length > 0);
