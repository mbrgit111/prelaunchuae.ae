import Link from 'next/link';
import { copy } from '@/site';
import { featuredProjects } from '@/data';
import { Icon } from '../ui/Icon';
import { ProjectCard } from '../ui/ProjectCard';
import { Section } from '../ui/Section';

/** 5 · Every project, new launches first. */
export async function FeaturedProjects() {
  const f = copy.home.featured;
  const list = await featuredProjects();
  if (!list.length) return null;
  return (
    <Section
      id="featured"
      tone="sand"
      label={f.label}
      title={f.title}
      intro={`All ${list.length.toLocaleString('en-US')} project${list.length === 1 ? '' : 's'}.`}
      action={<Link href="/projects" className="btn btn-secondary btn-sm">{f.action} <Icon name="arrow-right" className="size-4" /></Link>}
    >
      <ul className="swipe-row grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} defer /></li>)}
      </ul>
    </Section>
  );
}
