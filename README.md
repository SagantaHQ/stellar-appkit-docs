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

Output is in `dist/client/`.

## Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist/client
```

Or connect this repo to Cloudflare Pages with:
- **Build command**: `bun install && bun run build`
- **Output directory**: `dist/client`
