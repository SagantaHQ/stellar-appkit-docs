---
title: Modal
description: The <stellar-appkit-modal> Web Component — modal, bottom-sheet, and inline presentation with zero-dependency WAAPI animations.
---

## Overview

`<stellar-appkit-modal>` is a Shadow DOM Web Component. Attach a `StellarAppKit` instance via the `.client` property, then call `.open()`. The modal ships with sensible default open/close animations — no configuration needed.

## Attributes

| Attribute | Values | Default |
|---|---|---|
| `mode` | `auto` \| `modal` \| `bottom-sheet` \| `bottomsheet` \| `inline` | `auto` (viewport-based) |
| `theme` | `dark` \| `light` \| `auto` | `dark` |
| `branding` | `show` \| `hide` | `show` |
| `logo-src` | image URL | — (falls back to `<slot name="logo">`) |
| `title` | string | contextual per view |
| `auto-retry-network` | `true` \| `false` | `false` |
| `stellar-expert-avatars` | `true` \| `false` | `false` |
| `explorer-url` | base URL | `https://stellarchain.io` (mainnet) / `https://testnet.stellarchain.io` (testnet) |
| `animation` | `none` \| `fade` \| `scale` \| `scale-blur` \| `slide-up` \| `slide-left` \| `implode` | mode-based (see below) |
| `animation-open` | same as `animation` | inherits `animation`, else mode-based default |
| `animation-close` | same as `animation` | inherits `animation`, else mode-based default |

## Methods

| Method | |
|---|---|
| `.client = appkit` | Required — attaches a `StellarAppKit` instance and wires up preview/events |
| `.open()` | Opens the modal/bottom-sheet (no-op in `inline` mode) |
| `.close(skipAnimation = false)` | Closes it. Pass `true` to skip the WAAPI exit animation (used internally by drag-to-dismiss). |

## Events

Fires standard `CustomEvent`s mirroring the client's events:
- `sc-connect` — a wallet connected
- `sc-disconnect` — a wallet disconnected
- `sc-error` — an error occurred

## Animation presets

The modal uses the native Web Animations API (WAAPI) for open/close transitions — zero dependencies, runs off the main thread for transform/opacity, supported in every modern browser.

| Preset | Open | Close | Default for |
|---|---|---|---|
| `none` | instant | instant | — |
| `fade` | opacity 0→1 | opacity 1→0 | — |
| `scale` | opacity 0→1, scale .92→1 | opacity 1→0, scale 1→.94 | — |
| `scale-blur` | opacity 0→1, scale .92→1, blur 12px→0 | opacity 1→0, scale 1→.94, blur 0→12px | `modal` (desktop) |
| `slide-up` | translateY 100%→0, opacity 0→1 | translateY 0→100%, opacity 1→0 | `bottomsheet` (mobile) |
| `slide-left` | translateX 80px→0, opacity 0→1 | translateX 0→80px, opacity 1→0 | — |
| `implode` | scale 1.25 + rotate 8deg + blur 20px → scale 1 | reverse, with -4deg rotation on exit | — |

### Default animations

When no `animation` / `animation-open` / `animation-close` attribute is set, the modal picks a sensible default based on `mode`:

- `mode="modal"` (or `auto` on desktop) → `scale-blur`
- `mode="bottomsheet"` (or `auto` on mobile) → `slide-up`
- `mode="inline"` → no animation (always rendered in place)

The close animation mirrors the open animation by default — closing a bottom-sheet slides it down rather than fading out.

### Configuration priority

The animation config is resolved in this order (highest → lowest):

1. HTML attributes `animation-open` / `animation-close` — per-direction override
2. HTML attribute `animation` — single preset for both directions
3. `StellarAppKit` config: `modal.animation` — programmatic, set at construction time
4. Mode-based defaults

```ts
// Programmatic config (option 3):
import { StellarAppKit } from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  modal: { animation: 'implode' },  // global default for all modals attached to this client
});
```

```html
<!-- Per-modal override (option 1 or 2): -->
<stellar-appkit-modal animation-open="slide-left" animation-close="fade"></stellar-appkit-modal>
<!-- OR single preset for both: -->
<stellar-appkit-modal animation="scale"></stellar-appkit-modal>
```

### Accessibility — `prefers-reduced-motion`

Every preset checks `prefers-reduced-motion: reduce` before running. If the user has reduced motion enabled in their OS settings, the preset returns `null` and the modal opens/closes instantly with no transition. The check is SSR-safe (returns `false` in Node.js).

### Coexistence with drag-to-dismiss

The bottom-sheet's drag gesture uses a **separate** custom spring engine (native Pointer Events + `requestAnimationFrame`, ~30 lines, zero dependencies). The two systems don't conflict:

- **WAAPI** handles programmatic open/close (button clicks, Escape key, `.close()` from code)
- **Spring** handles user-initiated drag-to-dismiss

When a drag-dismiss completes, the spring has already animated the panel off-screen — so `close(true)` is called with `skipAnimation=true` to bypass the WAAPI exit (otherwise it would jump back to translateY(0) and slide down again).

## Wallet list — "Installed" badge

The wallet list shows an **"Installed"** badge (accent-colored pill with a dot) next to every wallet that's ready to use. Wallets that aren't installed show an **"Install"** button instead. Locked, unavailable, or connecting wallets still show their status text.

This makes it instantly clear which wallets are usable vs. which need installation, without forcing the user to click each row.

## Default connectors (zero-config)

If you omit `connectors` from the `StellarAppKit` config, the SDK auto-registers every bundled browser-side wallet that doesn't require constructor-time configuration:

- Freighter
- Albedo
- xBull
- Ledger

**WalletConnect is excluded** from defaults because it requires a `projectId` from your WalletConnect Cloud dashboard. Pass an explicit `connectors` list to include it:

```ts
import {
  StellarAppKit,
  createWalletConnectConnector,
  defaultConnectors,
} from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'PUBLIC',
  connectors: [
    ...defaultConnectors(),
    createWalletConnectConnector({
      projectId: 'your-wc-project-id',
      networkPassphrase: Networks.PUBLIC,
    }),
  ],
});
```

`defaultConnectors()` is exported so you can extend rather than replace the default set.
