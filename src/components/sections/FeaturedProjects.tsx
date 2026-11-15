import { copy } from '@/site';
import { featuredProjects, getProjects } from '@/data';
import { ProjectCard } from '../ui/ProjectCard';
import { Section } from '../ui/Section';
import { Head, More } from './MoreSections';

/** Recently launched: new launches first, newest first, one per developer. Six cards; a swipe row on phones. */
export async function FeaturedProjects() {
  const f = copy.home.featured;
  const list = (await featuredProjects()).filter((p) => p.status !== 'sold-out').slice(0, 6);
  if (!list.length) return null;
  return (
    <Section id="featured" labelledBy="h-featured" tone="white">
      <Head
        id="h-featured"
        label={f.label}
        title={f.title}
        accent={f.accent}
        intro={`Six to start with, one per developer. Then compare all ${(await getProjects()).length.toLocaleString('en-US')} launches.`}
      />
      <ul className="swipe-row grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} defer /></li>)}
      </ul>
      <More href="/projects">{f.action}</More>
    </Section>
  );
}
