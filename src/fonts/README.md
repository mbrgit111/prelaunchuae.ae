# Fonts

Two files, the PrelaunchUAE pair since the black + gold redesign (founder decision, 15 Nov 2026, after prelaunch.ae):

- `PlusJakartaSans-var.woff2` (headlines, figures): Plus Jakarta Sans variable font, weights 200 to 800, Latin only. 600 to 800 for headings, tight tracking.
- `Outfit-var.woff2` (text, interface, buttons, micro labels): Outfit variable font, weights 100 to 900, Latin only.

Both from Google Fonts, SIL Open Font License 1.1 (free for commercial use). The Latin-trimmed files are the ones prelaunch.ae
self-hosts (prelaunch-site/public/fonts/*-latin-var.woff2), copied here and loaded with `next/font/local` (preloaded,
`font-display: swap`, size-adjusted fallbacks so the swap causes no layout shift). CSS variables: `--font-jakarta`, `--font-outfit`.
