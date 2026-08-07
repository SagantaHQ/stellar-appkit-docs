---
title: Bundle Size
description: Tree-shaking guarantees — only ship what you import.
---

## Tree-shaking

Every connector is independently tree-shakeable. Framework wrappers are separate subpath exports — a React app never ships Vue or Svelte code.

| Import | What ships |
|---|---|
| `@saganta/stellar-appkit` | Core client + types (~40kb initial) |
| `@saganta/stellar-appkit-ui-web` | Modal Web Component (separate chunk) |
| `@saganta/stellar-appkit-ui-web/react` | React hooks (only if imported) |
| `@saganta/stellar-appkit-ui-web/vue` | Vue composables (only if imported) |
| `@saganta/stellar-appkit-ui-web/solid` | Solid hooks (only if imported) |
| `@saganta/stellar-appkit-ui-web/svelte` | Svelte stores (only if imported) |

## What you don't import = 0kb

- Wallet SDKs you don't use (Freighter, Albedo, xBull, Ledger, WalletConnect) — each connector lazy-imports its underlying SDK inside its methods, so importing the connector factory doesn't pull in the SDK until you actually call `connect()` or `signTransaction()`.
- Framework wrappers you don't use
- No gesture libraries — the bottom-sheet drag-to-dismiss uses a custom 30-line spring engine built on native Pointer Events + `requestAnimationFrame` (no `@use-gesture/vanilla` or `motion` needed)
- No animation libraries — open/close transitions use native WAAPI (Web Animations API), which is built into every modern browser

## Zero runtime dependencies (UI package)

`@saganta/stellar-appkit-ui-web` has **zero runtime dependencies**:

- **Drag-to-dismiss spring** — custom 30-line engine on native Pointer Events + `requestAnimationFrame`
- **Open/close animations** — native WAAPI (Web Animations API), supported in Chrome 84+, Firefox 75+, Safari 13.1+
- **Icons** — inline SVG strings, no icon font or external assets
- **Wallet icons** — bundled as base64 data URIs for Freighter/xBull/Hana; remote URLs for others (cached on first open via `Image()` preload)

The only things the UI package depends on are its peer dependencies (your framework of choice — React, Vue, Solid, or Svelte), and those are optional: use the raw Web Component directly with no framework at all.

## Lazy-loaded

`@stellar/stellar-sdk` (~1.4MB) is a separate chunk that only loads on the first actual sign or Soroban call — not part of the initial bundle.

Each wallet connector's underlying SDK (`@stellar/freighter-api`, `@albedo-link/intent`, `@creit.tech/xbull-wallet-connect`, `@ledgerhq/*`, `@walletconnect/sign-client`) is also lazy-imported inside the connector's methods. Importing `createFreighterConnector()` doesn't pull `@stellar/freighter-api` into your bundle until you actually call `connect()`.

## Verifying

Use your bundler's analyzer to verify:

```bash
# Vite
npx vite-bundle-visualizer

# webpack
npx webpack-bundle-analyzer
```

## Demo site bundle

The live demos site ([demos.stellar-appkit.saganta.com](https://demos.stellar-appkit.saganta.com)) runs on Cloudflare Workers via OpenNext. The Worker bundle is kept under 3 MiB (Cloudflare's limit) using `serverExternalPackages` + `edgeExternals` in `next.config.ts` + `open-next.config.ts` to externalize heavy server-side dependencies.
