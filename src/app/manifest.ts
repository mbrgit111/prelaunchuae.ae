import type { MetadataRoute } from 'next';
import { config } from '@/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.name,
    short_name: config.name,
    description: config.description,
    start_url: '/',
    display: 'browser',
    background_color: '#F4EFE6',
    theme_color: config.themeColor,
    icons: [
      { src: '/android-chrome-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
