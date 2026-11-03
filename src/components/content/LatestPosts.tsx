import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Section } from '@/components/ui/Section';
import { getProjectPosts, latestPosts } from '@/lib/content';
import type { ListFilter } from '@/lib/content/lists';
import type { PostCard } from '@/lib/content/types';
import { ArticleGrid } from './ArticleCard';

type Props = { id?: string; label: string; title: string; action?: string; tone?: 'white' | 'sand' };

async function safely(load: () => Promise<PostCard[]>): Promise<PostCard[]> {
  try {
    return await load();
  } catch {
    return []; // an extra block on someone else's page never takes the page down
  }
}

function Block({ cards, id, label, title, action = 'All articles', tone = 'white' }: Props & { cards: PostCard[] }) {
  if (cards.length === 0) return null;
  return (
    <Section id={id} tone={tone} label={label} title={title} action={<Link href="/blog" className="btn btn-secondary btn-sm">{action} <Icon name="arrow-right" className="size-4" /></Link>}>
      <ArticleGrid cards={cards} headingLevel="h3" />
    </Section>
  );
}

/** The newest articles, for the home page and the community guide. Hidden when there are none. */
export async function LatestPosts(props: Props & { count?: number; filter?: ListFilter }) {
  return <Block {...props} cards={await safely(() => latestPosts(props.count ?? 3, props.filter ?? {}))} />;
}

/** Articles that name this project in the desk. Hidden when there are none. */
export async function ProjectPosts({ slug, name, ...props }: Omit<Props, 'label' | 'title'> & { slug: string; name: string }) {
  return <Block {...props} label="Reading" title={`Guides that mention ${name}`} cards={await safely(() => getProjectPosts(slug, 3))} />;
}
