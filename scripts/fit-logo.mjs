// Tightens a developer logo so the mark fills the frame.
// Portal files are square plates (often black) with a small mark in the middle. A fixed tile then
// crops the plate and the name disappears. This trims the flat border and keeps the mark.
import sharp from 'sharp';

// Version of the logo recipe. Raise it to make every logo again on the next sync.
const LOGO_FIT = 2;

// Largest frame a logo is shown in is about 192 x 80 px (hero) or 156 x 88 px (strip); twice that keeps phones sharp.
const LOGO_MAX = { width: 384, height: 176 };

function lum(p) {
  return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
}

/** Edge-connected flat plate becomes transparent. The mark itself stays. */
function clearPlate(data, w, h, channels, isBg) {
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = y * w + x;
    if (seen[k]) return;
    const i = k * channels;
    if (!isBg([data[i], data[i + 1], data[i + 2], data[i + 3]])) return;
    seen[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const k = stack.pop();
    const x = k % w;
    const y = (k - x) / w;
    data[k * channels + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}

/** Returns a webp buffer of the trimmed mark, plus its pixel size. */
export async function fitLogo(input) {
  const base = sharp(input).rotate();
  const { data, info } = await base.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const cornerPts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  const at = (x, y) => {
    const i = (y * w + x) * channels;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const corners = cornerPts.map(([x, y]) => at(x, y));
  const bg = [0, 1, 2, 3].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length));
  const dist = (p) => Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]);
  const isBg = (p) => p[3] < 18 || dist(p) < 26;
  clearPlate(data, w, h, channels, isBg);

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let content = 0;
  let lumSum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * channels;
      const p = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (p[3] < 18) continue;
      content++;
      lumSum += lum(p);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const tooSmall = content < w * h * 0.004 || boxW < 8 || boxH < 8;
  if (tooSmall) {
    const fallback = await sharp(input).rotate().resize({ width: LOGO_MAX.width, height: LOGO_MAX.height, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    return { buffer: fallback.data, width: fallback.info.width, height: fallback.info.height, trimmed: false, weak: true };
  }

  const pad = Math.max(4, Math.round(Math.max(boxW, boxH) * 0.06));
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(w, maxX + 1 + pad);
  const bottom = Math.min(h, maxY + 1 + pad);
  const fill = content / (boxW * boxH);
  const bgLum = lum(bg);
  const avg = lumSum / content;
  // White or gold type that was sitting on a dark plate. A filled light badge (DAMAC disc) is left transparent.
  const lightType = bgLum < 48 && avg > 100 && fill < 0.5;
  let pipeline = sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract({
    left,
    top,
    width: right - left,
    height: bottom - top,
  });
  if (lightType) pipeline = pipeline.flatten({ background: '#161616' });
  const extracted = await pipeline
    .resize({ width: LOGO_MAX.width, height: LOGO_MAX.height, fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 86, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true });
  return {
    buffer: extracted.data,
    width: extracted.info.width,
    height: extracted.info.height,
    trimmed: true,
    weak: false,
    plate: lightType,
    stats: { avg: +avg.toFixed(1), fill: +fill.toFixed(2), bgLum: +bgLum.toFixed(1) },
  };
}

export { LOGO_FIT };
