---
title: Wallet Connection
description: Connect wallets, manage sessions, switch accounts, and handle network mismatches.
---

## Connecting a wallet

```ts
await appkit.connect('freighter');
```

The `connect()` method:
1. Checks the wallet's reachability (`available`, `locked`, `not-installed`, `unavailable`)
2. Calls the wallet's `connect()` method (which may open a popup or extension prompt)
3. Validates the wallet's network matches the app's configured network
4. Stores the session and emits a `connect` event

## `appMetadata` (v1.5.0+ — WalletConnect standard)

`appMetadata` is your app's identity. It follows the [WalletConnect/Reown metadata standard](https://docs.reown.com/advanced/walletconnect-metadata) — the **same object** is used for three purposes:

1. **SIWS messages** — `domain` is derived from `url` (protocol + path stripped), `uri` = `url`
2. **WalletConnect session proposals** — passed directly as the WC `metadata` field
3. **Modal transaction preview** — `icons[0]` is shown as the app icon in the preview header

```ts
const appkit = new StellarAppKit({
  network: 'TESTNET',
  appMetadata: {
    name: 'My App',                    // required
    description: 'A Stellar dApp',     // optional — shown in WC session proposal
    url: 'https://app.example.com',    // optional — derived from window.location if omitted
    icons: ['https://app.example.com/icon.png'],  // optional — used as modal preview icon
  },
});
```

Only `name` is required. When `url` is omitted in a browser environment, it's derived from `window.location.origin`. In SSR (Next.js server components, etc.), pass `url` explicitly — `window` isn't available during render.

### Migration from v1.4.x (old shape)

Before v1.5.0, `appMetadata` used `{ name, domain?, uri? }`. The v1.5.0 change to the WC standard means:

| Old (v1.4.x) | New (v1.5.0+) |
|---|---|
| `name` | `name` (unchanged) |
| `domain: 'app.example.com'` | `url: 'https://app.example.com'` (domain is derived) |
| `uri: 'https://app.example.com'` | `url` (uri = url) |
| — | `description?: string` (new — WC standard) |
| — | `icons?: string[]` (new — WC standard, used as modal preview icon) |

The `StellarAppKit` constructor normalizes the metadata and injects it into WalletConnect connectors via `_setAppMetadata()`, so you only need to pass it once at the top level.

## Account picker (hardware wallets)

Ledger exposes multiple accounts via derivation paths. When connecting, the modal automatically shows an account picker:

```ts
const accounts = await appkit.registry.getOrThrow('ledger').listAccounts();
await appkit.switchAccount('ledger', accounts[2].address);
```

## Advanced: multi-session API

The underlying `StellarAppKit` client supports keeping multiple wallets connected at the API level — connecting a second wallet doesn't replace the first, and `switchAccount(walletId)` flips the active one without disconnecting:

```ts
await appkit.connect('freighter');
await appkit.connect('ledger'); // both connected; Ledger is active

appkit.sessions;                          // every connected session
appkit.session;                           // the active one
await appkit.switchAccount('freighter');  // back to Freighter, Ledger stays connected
```

**Note:** the built-in `<stellar-appkit-modal>` UI is single-wallet — connecting a new wallet through the modal replaces the previous one in the UI, even though the underlying API keeps both sessions alive. The multi-session API is intended for apps that build their own wallet management UI on top of the client. If you're using the modal, treat the connect flow as single-wallet.

## Network mismatch recovery

```ts
import { NetworkMismatchError } from '@saganta/stellar-appkit';

try {
  await appkit.connect('freighter');
} catch (err) {
  if (err instanceof NetworkMismatchError) {
    console.log(`Wallet is on ${err.actualNetwork}, app needs ${err.expectedNetwork}`);
  }
}

// Or resolve it automatically — polls until the user switches:
await appkit.connect('freighter', { autoRetryNetworkMismatch: true });
```

## Cross-tab session sync

Sessions persist across browser tabs automatically via `BroadcastChannel`. Connecting or disconnecting in one tab reflects in every other open tab of the same origin.

Disable with `syncAcrossTabs: false` in the config.

## Reachability

```ts
await appkit.getWalletReachability('freighter');
// 'available' | 'locked' | 'not-installed' | 'unavailable'
```

## Events

```ts
appkit.on('connect', (session) => { /* ... */ });
appkit.on('disconnect', ({ walletId }) => { /* ... */ });
appkit.on('sessionsChanged', (sessions) => { /* ... */ });
appkit.on('accountSwitch', ({ walletId, address }) => { /* ... */ });
appkit.on('networkChange', (network) => { /* ... */ });
appkit.on('signQueueChange', (count) => { /* ... */ });
appkit.on('siwsSessionChange', (session) => { /* ... */ }); // v1.7.0+
appkit.on('error', (err) => { /* ... */ });
```

## Signature request queueing

Concurrent `signTransaction` / `signAuthEntry` / `signMessage` / `signIn` calls are queued and resolved in order rather than racing the wallet extension:

```ts
appkit.pendingSignCount; // number of sign requests currently queued
```

## `defaultConnectors()` (v1.0.6+)

Returns the default browser-side connector set: Freighter, Albedo, xBull, and Ledger. WalletConnect is **not** included by default because it requires a `projectId`.

```ts
import { StellarAppKit, defaultConnectors, createWalletConnectConnector, Networks } from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  connectors: [
    ...defaultConnectors(),
    createWalletConnectConnector({
      projectId: 'your-wc-cloud-project-id',
      networkPassphrase: Networks.TESTNET,
    }),
  ],
});
```

### xBull web wallet fallback (v1.3.0+)

xBull's connector always returns `'available'` for reachability — if the extension isn't installed, it falls back to the xBull web wallet (opens in a new tab). This means xBull always appears in the wallet picker, even without the extension.
