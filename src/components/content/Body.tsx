import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import type { Project } from '@/data';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { LiteVideo } from '@/components/ui/LiteVideo';

/**
 * Draws an article from the structured JSON the desk saves. Every element is created here from a fixed list of
 * node types; nothing from the article is ever inserted as HTML. Unknown nodes are dropped, unsafe links lose their
 * link, unsafe images disappear. Server component: no JavaScript is added to the page (except the video button).
 */
export type BodyNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: BodyNode[];
  text?: string;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
};

export type HeadingRef = { id: string; text: string; level: number };

const MAX_DEPTH = 12;

/** Returns a safe address, or null. Same-site paths, #anchors, http(s), mailto and tel only. */
export function safeHref(raw: unknown): { href: string; external: boolean } | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > 2048 || /[\u0000-\u001F\u007F\s]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return { href: value, external: false };
  if (value.startsWith('#')) return { href: value, external: false };
  try {
    const url = new URL(value);
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') return { href: value, external: false };
    if (url.protocol === 'https:' || url.protocol === 'http:') return { href: value, external: true };
  } catch {
    return null;
  }
  return null;
}

/** Images: https or a same-site path. */
export function safeImageSrc(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > 2048 || /[\u0000-\u001F\u007F\s]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n < 10000 ? Math.round(n) : undefined;
};

const plainText = (node: BodyNode): string =>
  typeof node.text === 'string' ? node.text : (node.content ?? []).map(plainText).join('');

function slug(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'section'
  );
}

type Context = { headings: HeadingRef[]; next: number; used: Map<string, number>; projects: Map<string, Project> };

function headingId(ctx: Context, text: string): string {
  // The API already numbered the headings; use its ids so the contents list and the page agree.
  const given = ctx.headings[ctx.next];
  ctx.next += 1;
  if (given && given.text.trim() === text.trim()) return given.id;
  const base = slug(text);
  const count = ctx.used.get(base) ?? 0;
  ctx.used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function marked(node: BodyNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? '';
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        out = <strong>{out}</strong>;
        break;
      case 'italic':
        out = <em>{out}</em>;
        break;
      case 'underline':
        out = <u>{out}</u>;
        break;
      case 'strike':
        out = <s>{out}</s>;
        break;
      case 'code':
        out = <code>{out}</code>;
        break;
      case 'link': {
        const safe = safeHref(mark.attrs?.href);
        if (!safe) break; // keep the words, lose the link
        out = safe.external ? (
          <a href={safe.href} target="_blank" rel="noopener noreferrer">{out}</a>
        ) : safe.href.startsWith('/') ? (
          <Link href={safe.href}>{out}</Link>
        ) : (
          <a href={safe.href}>{out}</a>
        );
        break;
      }
      default:
        break; // unknown style: plain text
    }
  }
  return <Fragment key={key}>{out}</Fragment>;
}

function inline(nodes: BodyNode[] | undefined): ReactNode[] {
  return (nodes ?? []).map((node, i) => {
    if (node.type === 'text') return marked(node, i);
    if (node.type === 'hardBreak') return <br key={i} />;
    return null;
  });
}

function blocks(nodes: BodyNode[] | undefined, ctx: Context, depth: number): ReactNode[] {
  return (nodes ?? []).map((node, i) => block(node, ctx, depth, i));
}

function block(node: BodyNode, ctx: Context, depth: number, key: number): ReactNode {
  if (!node || typeof node !== 'object' || depth > MAX_DEPTH) return null;
  switch (node.type) {
    case 'paragraph': {
      const kids = inline(node.content);
      return kids.length ? <p key={key}>{kids}</p> : null;
    }
    case 'heading': {
      const text = plainText(node).trim();
      if (!text) return null;
      const level = Number(node.attrs?.level) <= 2 ? 2 : 3; // the page title is the only H1
      const id = headingId(ctx, text);
      return level === 2 ? (
        <h2 key={key} id={id}>{inline(node.content)}</h2>
      ) : (
        <h3 key={key} id={id}>{inline(node.content)}</h3>
      );
    }
    case 'bulletList':
      return <ul key={key}>{blocks(node.content, ctx, depth + 1)}</ul>;
    case 'orderedList':
      return <ol key={key}>{blocks(node.content, ctx, depth + 1)}</ol>;
    case 'listItem':
      return <li key={key}>{blocks(node.content, ctx, depth + 1)}</li>;
    case 'blockquote':
      return <blockquote key={key}>{blocks(node.content, ctx, depth + 1)}</blockquote>;
    case 'horizontalRule':
      return <hr key={key} />;
    case 'codeBlock':
      return <pre key={key}><code>{plainText(node)}</code></pre>;
    case 'table': {
      const rows = (node.content ?? []).filter((row) => row.type === 'tableRow');
      const caption = typeof node.attrs?.caption === 'string' ? node.attrs.caption.trim() : '';
      return (
        // A keyboard user can focus the table to scroll it sideways on a small screen.
        <div key={key} className="table-wrap" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
          <table>
            {caption ? <caption>{caption}</caption> : null}
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {(row.content ?? []).map((cell, c) =>
                    cell.type === 'tableHeader' ? (
                      <th key={c} scope="col">{blocks(cell.content, ctx, depth + 1)}</th>
                    ) : (
                      <td key={c}>{blocks(cell.content, ctx, depth + 1)}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'image': {
      const src = safeImageSrc(node.attrs?.src);
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt.trim() : '';
      if (!src || !alt) return null; // no picture without its description
      const caption = typeof node.attrs?.caption === 'string' ? node.attrs.caption.trim() : '';
      const width = num(node.attrs?.width);
      const height = num(node.attrs?.height);
      return (
        <figure key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element -- body pictures can come from any approved https address */}
          <img src={src} alt={alt} loading="lazy" decoding="async" {...(width && height ? { width, height, style: { aspectRatio: `${width} / ${height}` } } : { style: { aspectRatio: '16 / 9', objectFit: 'cover' as const } })} />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      );
    }
    case 'callout': {
      const tone = node.attrs?.tone === 'warning' ? 'warning' : 'info';
      return (
        <aside key={key} className={`callout callout-${tone}`} role="note">
          {blocks(node.content, ctx, depth + 1)}
        </aside>
      );
    }
    case 'projectCard': {
      // Only projects that exist in this site's own data. An unknown or unpublished project shows nothing.
      const project = typeof node.attrs?.slug === 'string' ? ctx.projects.get(node.attrs.slug) : undefined;
      return project ? (
        <div key={key} className="not-prose my-2 max-w-md">
          <ProjectCard p={project} headingLevel="h3" />
        </div>
      ) : null;
    }
    case 'youtube': {
      const id = typeof node.attrs?.id === 'string' ? node.attrs.id : '';
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      const title = typeof node.attrs?.title === 'string' && node.attrs.title.trim() ? node.attrs.title.trim() : 'Video';
      return <div key={key}><LiteVideo title={title} youtubeId={id} /></div>;
    }
    case 'registerCta':
      return (
        <p key={key}>
          <a href="#register" className="btn btn-primary">Register interest</a>
        </p>
      );
    default:
      return null;
  }
}

export function Body({ doc, headings = [], projects = [] }: { doc: unknown; headings?: HeadingRef[]; projects?: Project[] }) {
  const root = doc && typeof doc === 'object' ? (doc as BodyNode) : null;
  if (!root || root.type !== 'doc') return null;
  const ctx: Context = { headings, next: 0, used: new Map(), projects: new Map(projects.map((project) => [project.slug, project])) };
  return <div className="api-prose grid gap-5">{blocks(root.content, ctx, 1)}</div>;
}
