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
} from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';
import { Networks } from '@stellar/stellar-sdk';

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
      onUri: (uri) => {
        // Display the URI as a QR code (desktop) or trigger a deep link (mobile).
        // The modal does NOT render the QR code for you — you need to render
        // it yourself, or use a QR library like `qrcode` or `qrcode.react`.
        showQRCode(uri);
      },
      networkPassphrase: Networks.TESTNET,
    }),
  ],
  appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
});
```

### 3. Render the QR code

The `onUri` callback fires when WalletConnect generates a pairing URI. You need to display it as a QR code so the user can scan it with their wallet app. The modal itself doesn't render the QR code — you provide the UI.

```tsx
import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

function WalletConnectQR() {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    // Pass the onUri callback to the connector
    // (or use a state management pattern to share it)
  }, []);

  if (!uri) return <div>Generating QR code…</div>;
  return <QRCode value={uri} size={256} />;
}
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

## `@walletconnect/sign-client` is bundled

You do **not** need to install `@walletconnect/sign-client` separately — it's a bundled dependency of `@saganta/stellar-appkit`, installed automatically and version-locked to a known-working range. It's lazy-imported inside the connector's methods, so it's tree-shaken out of your bundle if you don't use the WalletConnect connector.

## Deep linking on mobile

On mobile, instead of showing a QR code, you can trigger a deep link that opens the wallet app directly:

```ts
createWalletConnectConnector({
  // ...
  onUri: (uri) => {
    // Detect mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Open the wallet app via deep link
      window.location.href = uri;
    } else {
      // Show QR code on desktop
      setQrUri(uri);
    }
  },
});
```

The URI format `wc:<topic>@2?relay-protocol=<protocol>&symKey=<key>` is automatically recognized by WalletConnect-compatible wallets.
