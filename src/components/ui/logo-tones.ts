// How each stored developer logo (public/media/logo/<id>.webp) can be shown on the dark tile. Measured with sharp
// (stats().isOpaque) on 15 Nov 2026, after scripts/fit-logo.mjs had made the files:
// - SEE_THROUGH: the ground was cleared, so the white silhouette (.logo-mono) shows the whole mark, whatever its colour.
// - DARK_PLATE: light type that fit-logo flattened onto #161616, the tile's own colour. A silhouette would turn these into
//   blank white boxes, so they are shown as they are (.logo-plate).
// A logo in neither list (one added by a later image sync) keeps its own colours on a light tile, which reads for any file.
// To be replaced by a flag that sync-images writes into data/media-manifest.json.
export const SEE_THROUGH: ReadonlySet<string> = new Set([
  '048a762375f83a30', '055f255b62a75482', '05cc38614ab87389', '08528c091b18be73', '0ddec133b7da5d75', '10c6843630173bee', '122ca6d7dd1076d0',
  '13ba3d1a88ca7bb3', '1729c1cbf248519b', '18f9e778322f9637', '1c2c3d596026d9f6', '1f6717542cc3069e', '2ddb4eb77628d6df', '2eb7a53760c7b629',
  '2f6592204a4184f2', '323c6958976ca686', '3898d1665be91f87', '3c2a8e796c26598f', '3f1b60320847b1d3', '4b66f2ac2d19ae67', '4ee909674581219e',
  '50fa6851565945b3', '5312d4848e59fcf3', '55a8b83c192473fa', '564cd4c1ed81fec5', '5d168e6d93cfa815', '5eb59da4af219552', '5efe2c3d076cb175',
  '622465b6e39bbbf4', '63525fdcbf317f9e', '674c4e42afcfaccb', '68175284a70975a6', '6d055e7e4282fe81', '6d96151b30806125', '6d9d3959f62a079e',
  '6e7af41d1c407bf5', '6f35b92c8ae77f9b', '6ff73874d0245e44', '71261fccc5bc02d8', '71823ab5d1b8e8bd', '736e9bbf9b9e04c6', '7754f2ff3a814fe4',
  '7b818e641abe262a', '8545c0d87a8adf21', '8dbe7b1d3f6fab65', '900c9462344563fa', '92529421fc955158', '944ac7194addbec2', '94629dd347e482d7',
  '95eb3c3030daa2f3', '98deb0775d9aa7dc', '9c4975b3cdc1c1a1', 'a130497815412f8b', 'a3bdb0ed021c4858', 'a94346b25858c1cd', 'aacbee5e69239f4f',
  'acb0294c57b11784', 'b87eff36febbe7bc', 'be730f1da6af398e', 'beac649a937e2e2e', 'bf5c67a50a9608a4', 'c208b14d5f349cb9', 'c4afa628c4cce1be',
  'c63885c4ad22d186', 'c979e61d4a193931', 'ca5d15f216d0c43b', 'd75c2a0a9345555c', 'd841ef0f01a4dd85', 'd8aa35f469fed082', 'd9868cbcc369ca9c',
  'df57bca8a31e64d7', 'dfa4e84e9b51bf66', 'dfe2d6e611851586', 'e9d492479d9a1b27', 'f4f71cefca8d4962', 'f5bfd68302f267f3', 'f908ed580eae7ca4',
  'fb0dd4657a6577c3', 'fb112df1317cd2dc',
]);
export const DARK_PLATE: ReadonlySet<string> = new Set([
  '109ec159070a6bef', '16da6dc994712968', '32d340a8c062149d', '4e5a036d26709557', '51407a41841247f8', 'a121076c8204dec6', 'a9c76fc14589519e',
  'ac544434c3db308a', 'b24feb48314b0383', 'c579244eed72f310', 'c6e864d803471b53', 'cf50005f1f1e02ff', 'df7b6d586742d10f', 'e6136280c07641cc',
  'ecf7213edf117d9e', 'fc4292826b7e79e9',
]);
