// Which stored developer logos (public/media/logo/<id>.webp) need the dark tile. Measured with sharp on 16 Nov 2026,
// after scripts/fit-logo.mjs had made the files:
// - light type that fit-logo flattened onto #161616 (fully opaque), and
// - light marks on a see-through ground (they would vanish on white).
// Every other logo, including the many marks that sit on their own white circle, shows in its own colours on a white tile.
// No filter is applied: a white silhouette turned the circle files into plain grey discs.
// To be replaced by a flag that sync-images writes into data/media-manifest.json.
export const ON_DARK: ReadonlySet<string> = new Set([
  // flattened onto #161616
  '109ec159070a6bef', '16da6dc994712968', '32d340a8c062149d', '4e5a036d26709557', '51407a41841247f8', 'a121076c8204dec6', 'a9c76fc14589519e',
  'ac544434c3db308a', 'b24feb48314b0383', 'c579244eed72f310', 'c6e864d803471b53', 'cf50005f1f1e02ff', 'df7b6d586742d10f', 'e6136280c07641cc',
  'ecf7213edf117d9e', 'fc4292826b7e79e9',
  // light mark, see-through ground
  '2f6592204a4184f2', '3f1b60320847b1d3', '92529421fc955158', '98deb0775d9aa7dc', 'a94346b25858c1cd', 'c63885c4ad22d186',
]);
