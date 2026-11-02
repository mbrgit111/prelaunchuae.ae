import type { Metadata } from 'next';
import { PostRoute, postMetadata, postStaticParams } from '@/lib/content/post-route';

export const revalidate = 600;
export const dynamicParams = true;

export const generateStaticParams = () => postStaticParams('news');
export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => postMetadata((await params).slug, 'news');

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  return <PostRoute slug={(await params).slug} kind="news" />;
}
