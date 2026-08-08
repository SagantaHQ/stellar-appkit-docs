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
  Networks,
} from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'PUBLIC',
  connectors: [
    ...defaultConnectors(),
    createWalletConnectConnector({
      projectId: 'your-wc-project-id',
      networkPassphrase: Networks.PUBLIC,
      // onUri is optional — the modal renders the QR code automatically
    }),
  ],
});
```

`defaultConnectors()` is exported so you can extend rather than replace the default set.

## `appMetadata` (v1.5.0+ — WalletConnect standard)

`appMetadata` follows the [WalletConnect/Reown metadata standard](https://docs.reown.com/advanced/walletconnect-metadata). Only `name` is required — `url` is auto-derived from `window.location` in the browser:

```ts
// Minimal — url auto-derived from the current page URL
const appkit = new StellarAppKit({
  network: 'TESTNET',
  appMetadata: { name: 'Example App' },
});
```

The same object is used for three purposes:
1. **SIWS messages** — `domain` is derived from `url` (protocol + path stripped), `uri` = `url`
2. **WalletConnect session proposals** — passed directly as the WC `metadata` field
3. **Modal transaction preview** — `icons[0]` is shown as the app icon

```ts
// Full shape (v1.5.0+):
appMetadata: {
  name: 'Example App',                    // required
  description: 'A Stellar dApp',          // optional — shown in WC session proposal
  url: 'https://app.example.com',         // optional — auto-derived in browser, required in SSR
  icons: ['https://app.example.com/icon.png'],  // optional — modal preview app icon
}
```

> **Migration from v1.4.x:** the old shape was `{ name, domain?, uri? }`. The v1.5.0 change to the WC standard replaces `domain`/`uri` with `url` (domain is derived), and adds `description` + `icons`. See the [Wallet Connection](/core/wallet-connection/) guide for the full migration table.

In SSR/Node.js (no `window`), `url` remains `undefined` if not passed. Pass it explicitly for server-side `signIn()` flows.

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
