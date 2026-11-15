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
  // The home slideshow follows celeste with five launches from well-known developers (Binghatti, Emaar, Aldar, DAMAC,
  // Meraas), each with a stored cover in data/media-manifest.json; one is in Abu Dhabi so the slides are not all Dubai.
  imagery: {
    hero: 'celeste',
    heroes: ['palm-01-by-binghatti', 'alva-the-valley', 'the-canopies-sanctuary', 'damac-islands-2-mauritius', 'solaya-7'],
    guide: 'dolce-residences-by-wyndham',
    about: 'flora-bay-residences',
    featuredDeveloper: null,
  },
};
export default site;
