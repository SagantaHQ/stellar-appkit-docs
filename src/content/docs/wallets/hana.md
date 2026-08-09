---
title: Hana Wallet
description: Connect Hana Wallet (SDF's wallet) via WalletConnect — browser extension and mobile app.
---

## Overview

[Hana Wallet](https://hanawallet.io/) is the Stellar Development Foundation's wallet (formerly Stellar Term wallet). It's available as a browser extension and a mobile app (iOS/Android). Hana supports transaction signing (`stellar_signXDR`) and message signing (`stellar_signMessage`) over the WalletConnect v2 relay.

## Connection method

Hana does **not** expose a SEP-43 browser-extension API the way Freighter does. Instead, you connect to it via **WalletConnect** — the same relay used by Lobstr, Hot Wallet, and other mobile Stellar wallets.

This means you need to:

1. Add the WalletConnect connector to your `StellarAppKit` config (it's not in the default set)
2. Render a QR code (desktop) or trigger a deep link (mobile) when the `onUri` callback fires
3. The user scans the QR code with the Hana mobile app, or the deep link opens the Hana browser extension

## Setup

```ts
import {
  StellarAppKit,
  createWalletConnectConnector,
  defaultConnectors,
  Networks,
} from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';

const appkit = new StellarAppKit({
  network: 'TESTNET', // or 'PUBLIC' for Mainnet
  connectors: [
    // Default browser-side wallets (Freighter, Albedo, xBull, Ledger)
    ...defaultConnectors(),
    // WalletConnect — enables Hana, Lobstr, Hot Wallet, etc.
    createWalletConnectConnector({
      projectId: 'your-wc-cloud-project-id',
      metadata: {
        name: 'My App',
        description: 'A Stellar dApp using Hana Wallet',
        url: 'https://app.example.com',
        icons: ['https://app.example.com/icon.png'],
      },
      networkPassphrase: Networks.TESTNET,
      // onUri is OPTIONAL — the modal renders the QR code automatically
    }),
  ],
  appMetadata: { name: 'My App' },
});
```

## Getting a WalletConnect projectId

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the `projectId` — it's a UUID string
4. Paste it into `createWalletConnectConnector({ projectId: '...' })`

The projectId is free and is used to route pairing requests through WalletConnect's relay infrastructure.

## QR code rendering (automatic with the modal)

When using `<stellar-appkit-modal>` (recommended), the QR code is rendered **automatically** — the modal intercepts the pairing URI via `setOnUri()` and renders it as an inline SVG using [`better-qr`](https://www.npmjs.com/package/better-qr). You don't need to install a QR library or write any QR rendering code.

The modal's connecting view shows:
1. "Generating pairing code…" briefly
2. The QR code SVG with the wallet logo centered
3. "Scan with WalletConnect" + instructions
4. "Open in wallet app" deep link button (for mobile)
5. "Copy URI" button

**If you're NOT using the modal** (building your own UI), install a QR library and render it yourself:

```bash
npm install qrcode.react
```

```tsx
import { QRCodeSVG } from 'qrcode.react';

// In your connector config:
createWalletConnectConnector({
  // ...
  onUri: (uri) => setQrUri(uri),
  networkPassphrase: Networks.TESTNET,
});

// In your component:
{qrUri && <QRCodeSVG value={qrUri} size={256} />}
```

## Mobile deep linking

When using the modal, a "Open in wallet app" deep link button is rendered automatically alongside the QR code. On mobile, the user can tap it to open Hana directly.

**If you're building your own UI**, trigger the deep link manually:

```ts
onUri: (uri) => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = uri; // deep link to Hana
  } else {
    setQrUri(uri); // render QR on desktop
  }
},
```

## Signing

Once connected, Hana supports:

- **`signTransaction(xdr)`** — signs a transaction XDR and returns the signed XDR + signer address
- **`signMessage(message)`** — signs an arbitrary message (used by SIWS)
- **`signAuthEntry(xdr)`** — signs a Soroban auth entry (if supported by the Hana version)

All signing goes through the WalletConnect relay, so there's a slight latency (~1-2s) compared to browser-extension wallets that communicate directly via `window.postMessage`.

## Network selection

Hana supports both Testnet and Mainnet. Make sure your `networkPassphrase` matches the network the user has selected in their Hana app. If they don't match, you'll get a `NetworkMismatchError` — use the `autoRetryNetworkMismatch: true` option on `connect()` to let the user switch networks in their app and have the SDK auto-retry.

## Session persistence

The WalletConnect session topic is persisted in `localStorage`. On page reload, `appkit.restore()` checks if the session is still active and reconnects automatically. Sessions expire after 7 days by default.

## Links

- [Hana Wallet website](https://hanawallet.io/)
- [Hana Wallet on Chrome Web Store](https://chromewebstore.google.com/detail/hana-wallet/ecmgpnimhjjepdcpdldnchbjjbhmafmm)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [WalletConnect docs](https://docs.walletconnect.com/)
