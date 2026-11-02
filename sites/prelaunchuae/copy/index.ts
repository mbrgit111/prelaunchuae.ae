import { home } from './home.ts';
import { pages } from './pages.ts';
import { legalPages } from './legal.ts';
import { marketFaqs } from './faq.ts';
import { areaFaqs, areaIntro, developerIntro, homesPhrase, projectDescription, projectFaqs, projectIntro } from './templates.ts';
import { seo } from './seo.ts';

export const copy = { home, pages, legalPages, marketFaqs, projectIntro, projectDescription, projectFaqs, developerIntro, areaIntro, areaFaqs, homesPhrase, seo };
export type SiteCopy = typeof copy;
