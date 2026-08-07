---
title: Quick Start
description: Get a working wallet connect flow in about ten lines of code.
---

## Basic setup

```ts
import { StellarAppKit } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web'; // registers <stellar-appkit-modal>

// connectors is optional — defaults to Freighter, Albedo, xBull, Ledger
// domain + uri are optional too — auto-derived from window.location in the browser
const appkit = new StellarAppKit({
  network: 'PUBLIC',
  appMetadata: { name: 'Example App' },
});

const modal = document.querySelector('stellar-appkit-modal');
modal.client = appkit; // wires up the UI — preview, balance, history, network mismatch recovery

connectButton.addEventListener('click', () => modal.open());

await appkit.restore(); // resume a persisted session on page load, if any
```

```html
<stellar-appkit-modal mode="auto" theme="dark" title="Connect a wallet"></stellar-appkit-modal>
```

That's a working wallet connect flow with:
- Modal (desktop) / bottom-sheet (mobile) / inline (embedded) presentation
- Default open/close animations (`scale-blur` for modal, `slide-up` for bottom-sheet) — no config needed
- Transaction preview with risk flags before every signature
- Connected view with XLM balance, transaction history, and explorer links
- Wallet list with "Installed" badge for ready-to-use wallets
- Cross-tab session sync

## Zero-config defaults

If you omit `connectors` from the `StellarAppKit` config, the SDK auto-registers every bundled browser-side wallet that doesn't require constructor-time configuration:

- **Freighter** — browser extension
- **Albedo** — popup-based, no install required
- **xBull** — browser extension + PWA
- **Ledger** — WebHID/WebUSB hardware wallet

**WalletConnect is excluded** from defaults because it requires a `projectId` from your WalletConnect Cloud dashboard. Pass an explicit `connectors` list to include it:

```ts
import {
  StellarAppKit,
  createWalletConnectConnector,
  defaultConnectors,
} from '@saganta/stellar-appkit';
import { Networks } from '@stellar/stellar-sdk';

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

## Auto-derived `domain` and `uri`

The `appMetadata` config accepts just `{ name }` — `domain` and `uri` are **optional** and auto-derived from `window.location` in the browser:

- `domain` ← `window.location.hostname` (e.g. `"app.example.com"`)
- `uri` ← `window.location.origin` (e.g. `"https://app.example.com"`)

```ts
// Minimal — domain + uri auto-derived from the current page URL
const appkit = new StellarAppKit({
  network: 'TESTNET',
  appMetadata: { name: 'Example App' },
});
```

If you pass them explicitly, they're auto-formatted:
- `domain` with a protocol (`"https://example.com"`) → stripped to `"example.com"`
- `uri` without a protocol (`"example.com"`) → prefixed with `"https://"`

```ts
// These are all equivalent after normalization:
appMetadata: { name: 'Example App' }                                              // auto-derived
appMetadata: { name: 'Example App', domain: 'example.com', uri: 'https://example.com' }  // explicit
appMetadata: { name: 'Example App', domain: 'https://example.com', uri: 'example.com' }  // auto-formatted
```

In SSR/Node.js (no `window`), `domain` and `uri` remain `undefined` if not passed. Pass them explicitly for server-side `signIn()` flows.

## Customizing animations

The modal ships with sensible default animations, but you can override them per-modal via HTML attributes or globally via the `StellarAppKit` config:

```html
<!-- Per-modal: implode animation for both open and close -->
<stellar-appkit-modal animation="implode"></stellar-appkit-modal>

<!-- Per-modal: separate open and close animations -->
<stellar-appkit-modal animation-open="slide-left" animation-close="fade"></stellar-appkit-modal>
```

```ts
// Global: set in the StellarAppKit config
const appkit = new StellarAppKit({
  network: 'PUBLIC',
  modal: { animation: 'scale-blur' },  // default for all modals attached to this client
});
```

Available presets: `none`, `fade`, `scale`, `scale-blur` (default for modal), `slide-up` (default for bottom-sheet), `slide-left`, `implode`. All are zero-dependency WAAPI and respect `prefers-reduced-motion`. See the [Modal docs](/ui/modal/) for full details.

## Next steps

- [Wallet Connection](/core/wallet-connection/) — sessions, account switching, network mismatch recovery
- [Transaction Preview](/core/transaction-preview/) — risk flags, contract badges, fee estimates
- [Soroban Integration](/core/soroban/) — typed contract clients, RPC failover, invoke pipeline
- [Framework Wrappers](/wrappers/react/) — React, Vue, Solid, Svelte hooks
- [Modal](/ui/modal/) — full attributes reference, animation presets, default connectors
