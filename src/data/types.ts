/** Clean, typed records the whole site reads. Built from the portal JSON by normalise.ts. */

export interface MediaImage {
  src: string; // local file under /media, made by scripts/sync-images.mjs
  width: number;
  height: number;
  alt: string;
  /** Portal file is too faint to read. Show the developer name instead of the picture. */
  weak?: boolean;
}

export type ProjectStatus = 'new-launch' | 'available' | 'coming-soon' | 'sold-out';
export type Completion = 'under-construction' | 'ready' | 'upcoming';
export type PropertyType = 'apartment' | 'townhouse' | 'villa' | 'commercial';
export type DocumentKind = 'brochure' | 'floor-plans' | 'other';

export interface UnitRow {
  type: string; // "Apartments", "Townhouse"...
  bedrooms: string | null; // "Studio", "1", "1.5", "2"...
  priceFrom: number | null; // AED
  priceTo: number | null;
  areaFrom: number | null; // sq ft
  areaTo: number | null;
  floorPlan: MediaImage | null;
}

export interface PlanStep {
  title: string;
  percent: number | null;
  isFee: boolean;
  fixedAmount: number | null; // AED, for fixed fees
}

export interface PlanMilestone {
  title: string;
  percent: number | null;
  payments: number | null;
  steps: PlanStep[];
}

export interface PaymentPlan {
  title: string;
  isDefault: boolean;
  split: { booking: number; construction: number; handover: number; postHandover: number };
  instalments: { booking: number | null; construction: number | null; handover: number | null; postHandover: number | null };
  milestones: PlanMilestone[];
}

export interface Amenity {
  name: string;
  description: string | null;
  image: MediaImage | null;
}

export interface NearbyPlace {
  name: string;
  category: string | null; // "Airports", "Schools"...
  categoryCode: string | null;
  distance: string | null; // as supplied, e.g. "2.5 km"
  time: string | null; // as supplied, e.g. "5 min"
  picture: MediaImage | null;
}

export interface GalleryImage {
  group: string; // "Exterior", "Interior", "Lobby", "Location and site plans", "Other"
  image: MediaImage;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  completion: Completion;
  isTeaser: boolean; // announced, details to follow
  developerSlug: string;
  developerName: string;
  communityName: string; // "Dubai South"
  emirate: string;
  location: { lat: number; lng: number };
  currency: 'AED';
  priceFrom: number | null; // cheapest available unit, else the headline price; null when sold out or unknown
  priceTo: number | null; // highest available unit
  priceSource: 'available' | 'headline' | 'units' | null; // 'units' = cheapest price in the developer's unit table
  handover: { label: string | null; date: string | null; year: number | null };
  propertyTypes: PropertyType[];
  propertyTypeLabels: string[];
  bedrooms: string[]; // "0" = studio, then "1", "1.5"...
  bedroomsLabel: string | null; // "Studio to 3 bedrooms"
  bathrooms: string[];
  totalUnits: number | null;
  availableUnits: number | null;
  units: UnitRow[];
  paymentPlans: PaymentPlan[];
  paymentPlanLabel: string | null; // "10/25/65" or "Several payment plans"
  hasPostHandover: boolean;
  cover: MediaImage | null;
  gallery: GalleryImage[];
  amenities: Amenity[];
  nearby: NearbyPlace[];
  documents: DocumentKind[];
  createdAt: string;
  updatedAt: string;
}

export interface Developer {
  slug: string;
  name: string;
  logo: MediaImage | null;
  projectSlugs: string[];
}

export interface PostHeading { type: 'h2'; text: string }
export interface PostList { type: 'ul' | 'ol'; items: string[] }
export interface PostTable { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
export interface PostFaq { type: 'faq'; items: { q: string; a: string }[] }
/** A paragraph is a plain string. Other blocks keep headings, lists, tables and FAQs. Strings may contain same-site links written as [label](/path). */
export type PostBlock = string | PostHeading | PostList | PostTable | PostFaq;

export interface Post {
  slug: string;
  title: string;
  seoTitle?: string;
  excerpt: string;
  category: string;
  date: string;
  body: PostBlock[];
  image: string | null;
  imageAlt: string | null;
}

export interface DataIssue {
  code: 'price-mismatch' | 'price-implausible' | 'media-unavailable' | 'plan-total' | 'teaser' | 'no-price' | 'no-property-type' | 'multi-district' | 'media-missing' | 'out-of-scope' | 'duplicate-description' | 'no-permit';
  project: string | null;
  message: string;
}

export interface SiteData {
  fetchedAt: string;
  projects: Project[];
  developers: Developer[];
  posts: Post[];
  issues: DataIssue[];
}
