import type { Site } from '../types.ts';
import { config } from './site.config.ts';
import { contact } from './contact.ts';
import { compliance } from './compliance.ts';
import { testimonials } from './testimonials.ts';
import { copy } from './copy/index.ts';

const site: Site = {
  config,
  contact,
  compliance,
  testimonials,
  copy,
  // Covers chosen by what they show, from the projects listed today: a street-level exterior for the home page, a
  // building with a landscaped base for the area guide, a coastal one for About. The developer with most projects is featured (featuredDeveloper: null).
  imagery: { hero: 'celeste', guide: 'dolce-residences-by-wyndham', about: 'flora-bay-residences', featuredDeveloper: null },
};
export default site;
