import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getProject } from '@/data';
import { statusLabel } from '@/components/ui/ProjectCard';
import imageLoader from '@/lib/image-loader';

// Per-project share image in the brand template (Midnight Ink ground, light grid, Sora name). Drawn the first time a link is
// shared, then cached for a week, so the build does not draw some 2,400 images up front.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'PrelaunchUAE project';
export const revalidate = 604800;

const GRID = `url("data:image/svg+xml;base64,${Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M20 16v8M16 20h8' stroke='#A9B4C2' stroke-opacity='0.22' stroke-width='1.25'/></svg>").toString('base64')}")`;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProject((await params).slug);
  if (!p) return new Response('Not found', { status: 404 });
  const root = process.cwd();
  const [light, medium, sans, sansBold, logo] = await Promise.all([
    readFile(path.join(root, 'src/og/Sora-600.ttf')),
    readFile(path.join(root, 'src/og/Sora-800.ttf')),
    readFile(path.join(root, 'src/og/Manrope-500.ttf')),
    readFile(path.join(root, 'src/og/Manrope-700.ttf')),
    readFile(path.join(root, 'public/brand/prelaunchuae-horizontal-reversed.svg')),
  ]);
  // The cover is fetched from this site itself (public files are not inside the server function on Vercel).
  let cover: string | null = null;
  if (p.cover) {
    try {
      const h = await headers();
      const host = h.get('x-forwarded-host') ?? h.get('host');
      const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
      // A cover the MBR API prepared is fetched from its picture storage (a mid-size width is plenty here).
      const address = p.cover.src.startsWith('https://') ? imageLoader({ src: p.cover.src, width: 828 }) : `${proto}://${host}${p.cover.src}`;
      const res = await fetch(address, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(String(res.status));
      const jpg = await sharp(Buffer.from(await res.arrayBuffer())).resize(520, 630, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
      cover = `data:image/jpeg;base64,${jpg.toString('base64')}`;
    } catch {
      cover = null; // the share image still draws, without the picture
    }
  }
  const price = p.status === 'sold-out' ? 'Sold out' : p.priceFrom ? `From AED ${p.priceFrom.toLocaleString('en-US')}` : 'Price on request';
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', background: '#0B1F33', backgroundImage: GRID, color: '#F4EFE6', fontFamily: 'Manrope' }}>
        <div style={{ width: 680, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 56px 52px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;base64,${logo.toString('base64')}`} width={380} height={67} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 19, fontWeight: 700, letterSpacing: 2, color: '#A9B4C2', textTransform: 'uppercase' }}>
              <div style={{ width: 12, height: 12, background: '#E07A2E', transform: 'rotate(45deg)' }} />
              {`${statusLabel[p.status]} · ${p.communityName}`}
            </div>
            <div style={{ display: 'flex', fontFamily: 'Sora', fontSize: p.name.length > 28 ? 50 : 62, fontWeight: 800, letterSpacing: -1, lineHeight: 1.04 }}>{p.name}</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#A9B4C2' }}>{`By ${p.developerName}`}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 26, fontWeight: 700 }}>
            <div style={{ display: 'flex', padding: '12px 22px', borderRadius: 6, background: '#E07A2E', color: '#0B1F33', whiteSpace: 'nowrap' }}>{price}</div>
            {p.handover.label ? <div style={{ display: 'flex', color: '#A9B4C2', fontWeight: 500 }}>{p.completion === 'ready' ? 'Ready' : `Completion ${p.handover.label}`}</div> : null}
          </div>
        </div>
        <div style={{ width: 520, height: 630, display: 'flex', position: 'relative', background: '#163554' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover ? <img src={cover} width={520} height={630} style={{ objectFit: 'cover' }} alt="" /> : null}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 88, height: 88, background: '#E07A2E' }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Sora', data: light, weight: 600, style: 'normal' },
        { name: 'Sora', data: medium, weight: 800, style: 'normal' },
        { name: 'Manrope', data: sans, weight: 500, style: 'normal' },
        { name: 'Manrope', data: sansBold, weight: 700, style: 'normal' },
      ],
    },
  );
}
