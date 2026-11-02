import { describe, expect, it } from 'vitest';
import { storedPictures } from '../src/data/read';
import { MediaManifest } from '../src/data/schema';
import imageLoader, { pictureUrl } from '../src/lib/image-loader';

describe('pictures prepared by the MBR API (no rebuild needed)', () => {
  const COVER = 'https://media.example.ae/rem/1/0123456789abcdef0123/1920.webp#w=384,828,1280,1920';
  const SMALL = 'https://media.example.ae/rem/1/aaaaaaaaaaaaaaaaaaaa/828.webp#w=384,828';
  const LOGO = 'https://media.example.ae/rem/1/bbbbbbbbbbbbbbbbbbbb/logo.webp';

  it('picks the saved width at or just above the size asked for, never one that was not saved', () => {
    expect(imageLoader({ src: COVER, width: 640 })).toBe('https://media.example.ae/rem/1/0123456789abcdef0123/828.webp');
    expect(imageLoader({ src: COVER, width: 1200 })).toBe('https://media.example.ae/rem/1/0123456789abcdef0123/1280.webp');
    expect(imageLoader({ src: COVER, width: 3840 })).toBe('https://media.example.ae/rem/1/0123456789abcdef0123/1920.webp');
    expect(imageLoader({ src: SMALL, width: 1600 })).toBe('https://media.example.ae/rem/1/aaaaaaaaaaaaaaaaaaaa/828.webp');
    expect(imageLoader({ src: LOGO, width: 640 })).toBe(LOGO);
    expect(pictureUrl(COVER)).toBe('https://media.example.ae/rem/1/0123456789abcdef0123/1920.webp');
  });

  it('keeps the site’s own covers and their small copies as before', () => {
    expect(imageLoader({ src: '/media/cover/0123456789abcdef.webp', width: 640 })).toBe('/media/cover/0123456789abcdef-sm.webp');
    expect(imageLoader({ src: '/media/cover/0123456789abcdef.webp', width: 1920 })).toBe('/media/cover/0123456789abcdef.webp');
    expect(imageLoader({ src: '/brand/logo.svg', width: 256 })).toBe('/brand/logo.svg');
  });

  it('turns the API’s ready pictures into picture-list entries, and leaves out anything malformed', () => {
    const entries = storedPictures({
      'https://files.remapp.ae/a.jpg': { src: 'https://media.example.ae/rem/1/x/1920.webp', width: 1920, height: 1080, kind: 'cover', widths: [384, 828, 1280, 1920] },
      'https://files.remapp.ae/logo.png': { src: 'https://media.example.ae/rem/1/y/logo.webp', width: 300, height: 120, kind: 'logo', widths: [], weak: true },
      'https://files.remapp.ae/plain-http.jpg': { src: 'http://media.example.ae/z.webp', width: 10, height: 10, widths: [384] },
      'https://files.remapp.ae/no-size.jpg': { src: 'https://media.example.ae/rem/1/w/384.webp', widths: [384] },
    });
    expect(entries).toEqual({
      'https://files.remapp.ae/a.jpg': { src: 'https://media.example.ae/rem/1/x/1920.webp#w=384,828,1280,1920', width: 1920, height: 1080, kind: 'cover' },
      'https://files.remapp.ae/logo.png': { src: 'https://media.example.ae/rem/1/y/logo.webp', width: 300, height: 120, kind: 'logo', weak: true },
    });
    expect(MediaManifest.safeParse(entries).success).toBe(true);
  });
});
