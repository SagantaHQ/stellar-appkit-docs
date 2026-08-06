# Stellar AppKit Documentation

Documentation site for [Stellar AppKit](https://github.com/SagantaHQ/stellar-appkit) — built with [Astro Starlight](https://starlight.astro.build/), deployed on Cloudflare Pages.

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

Output is in `dist/`.

## Deploy to Cloudflare Pages

Connect this repo to Cloudflare Pages with:
- **Framework preset**: Astro
- **Build command**: `bun install && bun run build`
- **Output directory**: `dist`

No Cloudflare adapter needed — the docs site is fully static HTML, served directly from the CDN. No Workers, no SSR, no nodejs_compat flag required.
