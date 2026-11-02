import Link from 'next/link';
import { copy } from '@/site';
import { featuredProjects, getProjects } from '@/data';
import { Icon } from '../ui/Icon';
import { ProjectCard } from '../ui/ProjectCard';
import { Section } from '../ui/Section';

/** 5 · Recently launched: new launches first, newest first, one per developer. */
export async function FeaturedProjects() {
  const f = copy.home.featured;
  const list = (await featuredProjects()).filter((p) => p.status !== 'sold-out').slice(0, 6);
  if (!list.length) return null;
  return (
    <Section
      id="featured"
      tone="sand"
      label={f.label}
      title={f.title}
      intro={`Six to start with, one per developer. Then compare all ${(await getProjects()).length.toLocaleString('en-US')} launches.`}
      action={<Link href="/projects" className="link-accent">{f.action} <Icon name="arrow-right" className="size-4" /></Link>}
    >
      <ul className="swipe-row grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} defer /></li>)}
      </ul>
    </Section>
  );
}
