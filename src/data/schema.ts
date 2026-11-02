/**
 * Zod rules for the portal JSON. Only fields the site uses are checked; extra fields are allowed so a portal
 * update does not break the build. Anything wrong in a used field stops the build with the project named.
 */
import { z } from 'zod';

const num = z.number().finite();
const int = z.number().int();
const isoDateTime = z.iso.datetime();
const optionalUrl = z.union([z.url(), z.literal('')]).nullish();
const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform((v) => v ?? []);

const PlanStep = z.looseObject({
  milestoneTitle: z.string(),
  percentage: num.nullish(),
  isFee: z.boolean().nullish(),
  fixedAmount: num.nullish(),
});

const Milestone = z.looseObject({
  milestoneTitle: z.string(),
  percentage: num.nullish(),
  paymentsCount: int.nullish(),
  subSteps: list(PlanStep),
});

const PaymentPlan = z.looseObject({
  title: z.string(),
  isDefault: z.boolean().nullish(),
  headingPercentages: z.looseObject({ onBooking: num, onConstruction: num, onHandover: num, postHandover: num.nullish() }),
  summary: z
    .looseObject({
      onBookingPaymentsCount: int.nullish(),
      onConstructionPaymentsCount: int.nullish(),
      onHandoverPaymentsCount: int.nullish(),
      postHandoverPaymentsCount: int.nullish(),
    })
    .nullish(),
  milestones: list(Milestone),
});

const Unit = z.looseObject({
  name: z.string(),
  unitType: z.string(),
  bedroom: z.string().nullish(),
  priceStart: num.nullish(),
  priceEnd: num.nullish(),
  areaStart: num.nullish(),
  areaEnd: num.nullish(),
  image: optionalUrl,
});

const Amenity = z.looseObject({ name: z.string(), description: z.string().nullish(), image: optionalUrl });

const Nearby = z.looseObject({
  name: z.string().min(1),
  distance: z.string().nullish(),
  time: z.string().nullish(),
  picture: optionalUrl,
  category: z.looseObject({ code: z.string(), name: z.looseObject({ en: z.string().optional() }) }).nullish(),
});

const Attachment = z.looseObject({ title: z.string(), url: z.url(), fileType: z.string() });

export const RawProject = z.looseObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().trim().min(1),
  status: z.enum(['available', 'sold_out', 'launch', 'pending']),
  completionStatus: z.enum(['under_construction', 'completed', 'ready_to_move', 'upcoming']),
  districtName: z.string().min(1),
  districtIds: list(z.string()),
  emirateName: z.string().min(1),
  developer: z.looseObject({ id: z.string(), name: z.string().trim().min(1), logo: optionalUrl }),
  location: z.looseObject({
    coordinates: z.tuple([num.min(51).max(57), num.min(22).max(27)], { error: 'coordinates must be [longitude, latitude] inside the UAE' }),
  }),
  currency: z.literal('AED'),
  priceUponRequest: z.boolean().nullish(),
  priceStart: num.nullish(),
  images: z.looseObject({
    featured: z.url(),
    exterior: list(z.url()),
    interior: list(z.url()),
    lobby: list(z.url()),
    architecture: list(z.url()),
    amenities: list(z.url()),
    general: list(z.url()),
    other: list(z.url()),
  }),
  description: z.string(),
  expectedCompletionDate: isoDateTime.nullish(),
  attachments: list(Attachment),
  amenities: list(Amenity),
  paymentPlans: list(PaymentPlan),
  unitTypes: list(z.string()),
  propertyTypes: list(z.string()),
  bedrooms: list(z.string()),
  bathrooms: list(z.string()),
  totalUnits: int.nullish(),
  unitStructures: list(Unit),
  hasPostHandover: z.boolean().nullish(),
  nearbyLocations: list(Nearby),
  isPublic: z.boolean(),
  isPrivate: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type RawProject = z.infer<typeof RawProject>;

export const RawDetailFile = z.looseObject({
  fetchedAt: isoDateTime,
  source: z.string(),
  count: int,
  projects: z.array(z.unknown()),
});

export const RawListItem = z.looseObject({
  id: z.string().min(1),
  minAvailablePrice: num.nullish(),
  maxAvailablePrice: num.nullish(),
  availableUnits: int.nullish(),
  totalUnits: int.nullish(),
});
export type RawListItem = z.infer<typeof RawListItem>;

export const MediaManifest = z.record(
  z.string(),
  z.object({
    // A file stored with the site (/media/...), or a picture prepared by the MBR API in its picture storage (https://...).
    src: z.string().refine((s) => s.startsWith('/media/') || s.startsWith('https://'), 'Expected /media/... or https://...'),
    width: int.positive(),
    height: int.positive(),
    kind: z.string(),
    /** Set when the portal file is too faint to read at tile size. The name is shown instead. */
    weak: z.boolean().optional(),
    fit: z.number().optional(),
  }),
);
export type MediaManifest = z.infer<typeof MediaManifest>;

const sameSiteText = z.string().min(1).refine((s) => {
  for (const match of s.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    const href = match[2] ?? '';
    if (!href.startsWith('/') || href.startsWith('//')) return false;
  }
  return true;
}, { message: 'links must be same-site paths starting with a single /' });

const PostTable = z.object({
  type: z.literal('table'),
  caption: z.string().min(1).optional(),
  headers: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.string().min(1)).min(1)).min(1),
}).refine((table) => table.rows.every((row) => row.length === table.headers.length), {
  message: 'each table row must have one cell per header',
});

export const PostBlock = z.union([
  sameSiteText,
  z.object({ type: z.literal('h2'), text: sameSiteText }),
  z.object({ type: z.enum(['ul', 'ol']), items: z.array(sameSiteText).min(1) }),
  PostTable,
  z.object({
    type: z.literal('faq'),
    items: z.array(z.object({ q: z.string().min(1), a: sameSiteText })).min(1),
  }),
]);

export const RawPost = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers and dashes'),
  title: z.string().min(1),
  seoTitle: z.string().min(1).optional(),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  date: z.iso.date(),
  body: z.array(PostBlock).min(1),
  image: z.string().nullish(),
  imageAlt: z.string().nullish(),
});
export const RawPosts = z.array(RawPost);
