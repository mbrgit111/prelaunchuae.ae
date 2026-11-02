# Fonts

Two files, the PrelaunchUAE brand pair (Brand Guidelines v1.0, section 05):

- `Sora-var.woff2` (headlines, figures, wordmark): Sora variable font, weights 100 to 800, Latin only. SemiBold for headings, ExtraBold for hero lines.
- `Manrope-var.woff2` (text and interface): Manrope variable font, weights 200 to 800, Latin only.

Both by their authors on Google Fonts, SIL Open Font License 1.1 (free for commercial use; licence texts are in the brand kit's fonts folder).
Trimmed to Latin with fontTools `pyftsubset` from PrelaunchUAE-Brand-Kit/fonts, self-hosted and loaded with `next/font/local` (preloaded,
`font-display: swap`, size-adjusted fallbacks so the swap causes no layout shift).
