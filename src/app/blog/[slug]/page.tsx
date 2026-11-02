import type { Metadata } from 'next';
import { PostRoute, postMetadata, postStaticParams } from '@/lib/content/post-route';

// Built the first time it is asked for, then kept for 10 minutes, and refreshed at once when the desk publishes (/api/revalidate).
export const revalidate = 600;
export const dynamicParams = true;

export const generateStaticParams = () => postStaticParams('blog');
export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => postMetadata((await params).slug, 'blog');

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  return <PostRoute slug={(await params).slug} kind="blog" />;
}
