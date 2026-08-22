# Cloudflare Pages deployment

Club Craft is a static React/Vite site. Its runtime assets are committed under `client/public`, so no Manus storage endpoint, runtime plugin, or platform secret is required for a normal production build.

## Local development

Run `pnpm install`, then use `pnpm dev` for the local Vite server. Run `pnpm check` before committing. `pnpm build:pages` produces the exact static output that Cloudflare Pages serves.

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| Production branch | `feat/reggae-quality` or your chosen release branch |
| Build command | `pnpm build:pages` |
| Build output directory | `dist/public` |
| Node version | 20 or newer |

The committed `_redirects` file keeps client-side routes on the SPA entry point. The committed `_headers` file makes models, thumbnails, and brand assets cacheable without depending on a platform runtime.

## Static assets

| Asset family | Source in the repository |
|---|---|
| SYSTM logo and favicon | `client/public/assets/brand/` |
| Onboarding speaker previews | `client/public/assets/onboarding/` |
| Speaker GLB models | `client/public/models/speakers/` |

Do not replace these paths with external storage URLs. New static assets should be committed under `client/public/assets` (or `client/public/models` for GLB files) and referenced from the site with absolute paths such as `/assets/brand/systm-mark.png`.
