/**
 * What the MBR content API sends, written once. Every reply is checked against these shapes before the site uses it,
 * so a changed or broken reply is treated as "API unavailable" instead of breaking a page.
 */
import { z } from 'zod';

export const MediaSchema = z.object({
  url: z.string(),
  alt: z.string().default(''),
  caption: z.string().default(''),
  credit: z.string().default(''),
  width: z.number().default(0),
  height: z.number().default(0),
  blurDataUrl: z.string().default(''),
  dominantColor: z.string().default(''),
  variants: z.array(z.object({ width: z.number(), format: z.string(), url: z.string() })).default([]),
});
export type Media = z.infer<typeof MediaSchema>;

const NameSlug = z.object({ name: z.string(), slug: z.string() });

export const PostCardSchema = z.object({
  id: z.string(),
  type: z.enum(['blog', 'news']),
  slug: z.string(),
  path: z.string(),
  title: z.string(),
  excerpt: z.string().default(''),
  cover: MediaSchema.nullable().default(null),
  category: NameSlug.nullable().default(null),
  author: NameSlug.nullable().default(null),
  tags: z.array(z.string()).default([]),
  readingTime: z.number().default(1),
  dateline: z.string().default(''),
  publishedAt: z.string(),
  updatedAt: z.string(),
});
export type PostCard = z.infer<typeof PostCardSchema>;

export const PostListSchema = z.object({ items: z.array(PostCardSchema), nextCursor: z.string().nullable() });
export type PostList = z.infer<typeof PostListSchema>;

const PostLink = z.object({ slug: z.string(), title: z.string(), path: z.string() });

export const AuthorProfileSchema = z.object({
  name: z.string(),
  slug: z.string(),
  title: z.string().default(''),
  bio: z.string().default(''),
  photo: MediaSchema.nullable().default(null),
});
export type AuthorProfile = z.infer<typeof AuthorProfileSchema>;

export const PostDetailSchema = PostCardSchema.omit({ author: true }).extend({
  /** Tiptap/ProseMirror JSON. Rendered by components/content/Body.tsx; never inserted as HTML. */
  body: z.unknown(),
  headings: z.array(z.object({ id: z.string(), text: z.string(), level: z.number() })).default([]),
  wordCount: z.number().default(0),
  language: z.string().default('en'),
  author: AuthorProfileSchema.nullable().default(null),
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    canonicalUrl: z.string(),
    noindex: z.boolean(),
    ogTitle: z.string().default(''),
    ogDescription: z.string().default(''),
    ogImage: MediaSchema.nullable().default(null),
  }),
  schemaType: z.string().default('Article'),
  /** Precomputed by the API (article, FAQ, breadcrumbs). Placed on the page exactly as received. */
  jsonLd: z.array(z.record(z.string(), z.unknown())).default([]),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  sources: z
    .array(z.object({ title: z.string(), url: z.string(), publisher: z.string().default(''), accessedAt: z.string().default('') }))
    .default([]),
  news: z.object({ dateline: z.string(), location: z.string(), isBreaking: z.boolean() }).nullable().default(null),
  relatedProjectSlugs: z.array(z.string()).default([]),
  publisher: z.object({ name: z.string(), url: z.string() }),
  related: z.array(PostCardSchema).default([]),
  prev: PostLink.nullable().default(null),
  next: PostLink.nullable().default(null),
});
export type PostDetail = z.infer<typeof PostDetailSchema>;

export const CategorySchema = z.object({ name: z.string(), slug: z.string(), description: z.string().default(''), count: z.number().default(0) });
export const CategoryListSchema = z.object({ items: z.array(CategorySchema) });
export type Category = z.infer<typeof CategorySchema>;

export const AuthorSchema = AuthorProfileSchema.extend({
  social: z.object({ website: z.string().default(''), linkedin: z.string().default('') }).default({ website: '', linkedin: '' }),
  postCount: z.number().default(0),
});
export type Author = z.infer<typeof AuthorSchema>;

export const RedirectListSchema = z.object({
  items: z.array(z.object({ from: z.string(), to: z.string(), code: z.union([z.literal(301), z.literal(302)]).default(301) })),
});
export type RedirectRule = z.infer<typeof RedirectListSchema>['items'][number];

export const SitemapListSchema = z.object({
  items: z.array(z.object({ path: z.string(), type: z.string().default('blog'), lastmod: z.string().nullable().default(null) })),
});
export type SitemapEntry = z.infer<typeof SitemapListSchema>['items'][number];

/** Where the content on a page came from. Shown by /api/content-status. */
export type ContentSource = 'api' | 'snapshot' | 'files';

export const SnapshotSchema = z.object({
  generatedAt: z.string().nullable(),
  apiUrl: z.string().default(''),
  contentKey: z.string().default(''),
  cards: z.array(PostCardSchema).default([]),
  posts: z.record(z.string(), PostDetailSchema).default({}),
  categories: z.array(CategorySchema).default([]),
  authors: z.record(z.string(), AuthorSchema).default({}),
  redirects: z.array(RedirectListSchema.shape.items.element).default([]),
  sitemap: z.array(SitemapListSchema.shape.items.element).default([]),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;
