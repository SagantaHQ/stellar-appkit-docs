---
title: WalletConnect
description: WalletConnect v2 relay adapter — QR pairing, mobile deep-linking, covers Hana, Lobstr, Hot Wallet, and any WC-compatible Stellar wallet.
---

## Overview

The WalletConnect connector is the bridge to **every Stellar wallet that isn't a browser extension** — Hana, Lobstr, Hot Wallet, and any mobile wallet that supports the Stellar WalletConnect namespace. Instead of injecting into the page, WalletConnect establishes a relay session via a QR code (desktop) or deep link (mobile).

WalletConnect is **not included in the default connector set** because it requires a `projectId` from your [WalletConnect Cloud](https://cloud.walletconnect.com/) dashboard. You must add it explicitly.

## Setup

### 1. Get a WalletConnect projectId

Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/), create a project, and copy the `projectId`. It's free.

### 2. Create the connector

```ts
import {
  StellarAppKit,
  createWalletConnectConnector,
  defaultConnectors,
  Networks,
} from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  connectors: [
    // Include the default browser-side wallets (Freighter, Albedo, xBull, Ledger)
    ...defaultConnectors(),
    // Add WalletConnect for Hana, Lobstr, Hot Wallet, etc.
    createWalletConnectConnector({
      projectId: 'your-wc-cloud-project-id',
      metadata: {
        name: 'My App',
        description: 'A Stellar dApp',
        url: 'https://app.example.com',
        icons: ['https://app.example.com/icon.png'],
      },
      networkPassphrase: Networks.TESTNET,
      // onUri is OPTIONAL — the modal renders the QR code automatically
      // using better-qr. Only set it if you're building your own UI.
    }),
  ],
  appMetadata: { name: 'My App' },
});
```

### 3. QR code rendering (automatic with the modal)

When using `<stellar-appkit-modal>` (recommended), the QR code is rendered **automatically** — the modal intercepts the pairing URI via `setOnUri()` and renders it as an inline SVG using [`better-qr`](https://www.npmjs.com/package/better-qr). You don't need to install a QR library or write any QR rendering code.

The modal's connecting view shows:
1. "Generating pairing code…" briefly while the WC relay generates the URI
2. The QR code SVG (in a white rounded frame, with the wallet logo centered)
3. "Scan with WalletConnect" + "Open Hana, Lobstr, or Hot Wallet and scan this QR code to connect."
4. "Open in wallet app" deep link button (for mobile)
5. "Copy URI" button (with "Copied!" feedback)

**If you're NOT using the modal** (building your own UI), set `onUri` to render the QR yourself:

```tsx
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

createWalletConnectConnector({
  // ...
  onUri: (uri) => setQrUri(uri),
  networkPassphrase: Networks.TESTNET,
});

// In your component:
{qrUri && <QRCodeSVG value={qrUri} size={256} />}
```

## Supported wallets

Any wallet that implements the [Stellar WalletConnect namespace](https://github.com/WalletConnect/walletconnect-registry) works with this connector:

| Wallet | Platform | Notes |
|---|---|---|
| **Hana Wallet** | Browser extension + mobile | SDF's wallet, supports `stellar_signXDR` and `stellar_signMessage` |
| **Lobstr** | Mobile (iOS/Android) | One of the most popular Stellar mobile wallets |
| **Hot Wallet** | Mobile | Supports signing via WalletConnect relay |
| **Any WC-compatible wallet** | Any | If it speaks the Stellar WC namespace, it works |

### Hana Wallet specifics

[Hana Wallet](https://hanawallet.io/) is the Stellar Development Foundation's wallet (formerly Stellar Term wallet). It's available as a browser extension and a mobile app.

- **Browser extension**: Hana also injects into the page, but it does not currently expose a SEP-43 browser-extension API the way Freighter does. Use it via WalletConnect instead.
- **Mobile app**: Connect via WalletConnect QR pairing — the user scans the QR code with the Hana app.
- **Signing**: Hana supports `stellar_signXDR` (transaction signing) and `stellar_signMessage` (message signing) over the WalletConnect relay.
- **Network**: Hana supports both Testnet and Mainnet — make sure your `networkPassphrase` matches the network the user has selected in their Hana app.

## Flow

1. `connect()` calls `SignClient.init()` and `client.connect()` — returns a pairing URI
2. The URI is surfaced via the `onUri` callback — your app renders it as a QR code (desktop) or triggers a deep link (mobile)
3. The user opens their wallet app (Hana, Lobstr, etc.) and scans the QR code, or taps the deep link on mobile
4. The wallet approves the connection, and the `session_settled` event fires
5. `connect()` resolves with the wallet's address

## Supported methods

- `stellar_signXDR` — transaction signing
- `stellar_signMessage` — message signing (with fallback error if unsupported)
- `stellar_getAddress` / `stellar_getNetwork` — session info

## Session persistence

The WalletConnect session topic is persisted via the injected `ConnectStorage` (localStorage by default). On `restore()`, the connector checks if the session is still active via `client.session.get(topic)` and reconnects if so. Sessions expire after 7 days by default (configurable in your WalletConnect Cloud project settings).

## `@walletconnect/sign-client` and `better-qr` are bundled

You do **not** need to install `@walletconnect/sign-client` or `better-qr` separately — they're bundled dependencies of `@saganta/stellar-appkit` and `@saganta/stellar-appkit-ui-web` respectively. They're installed automatically and version-locked to known-working ranges. They're lazy-imported inside the connector's methods, so they're tree-shaken out of your bundle if you don't use the WalletConnect connector.

## Deep linking on mobile

When using `<stellar-appkit-modal>`, the modal automatically renders a "Open in wallet app" deep link button alongside the QR code. On mobile, the user can tap this to open their wallet app directly instead of scanning the QR code.

**If you're building your own UI** (no modal), you can trigger a deep link manually:

```ts
createWalletConnectConnector({
  // ...
  onUri: (uri) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = uri; // deep link to wallet app
    } else {
      setQrUri(uri); // render QR on desktop
    }
  },
  networkPassphrase: Networks.TESTNET,
});
```

The URI format `wc:<topic>@2?relay-protocol=<protocol>&symKey=<key>` is automatically recognized by WalletConnect-compatible wallets.
