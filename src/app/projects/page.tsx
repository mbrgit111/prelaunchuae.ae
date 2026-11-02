import type { Metadata } from 'next';
import { copy } from '@/site';
import { getDevelopers, getProjects } from '@/data';
import { pageMetadata } from '@/lib/seo';
import { ProjectsListing } from '@/components/pages/ProjectsListing';

// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const [projects, developers] = await Promise.all([getProjects(), getDevelopers()]);
  return pageMetadata({
    ...copy.seo.projects({ projects: projects.length, developers: developers.length }),
    absoluteTitle: true,
    path: '/projects',
  });
}

export default function ProjectsPage() {
  return <ProjectsListing page={1} />;
}
