---
title: Installation
description: Install Stellar AppKit — one command, everything bundled.
---

## Install the core package

```bash
npm install @saganta/stellar-appkit
```

That's it. All wallet SDKs, the Stellar SDK, and the gesture libraries are bundled as regular dependencies — installed automatically, version-locked to known-working ranges, and tree-shaken out of your bundle if you don't use the corresponding connector.

## What's bundled (no manual install needed)

| Package | Used by | Tree-shaken if |
|---|---|---|
| `@stellar/stellar-sdk` | Core — transaction building, Soroban RPC, contract spec | Never (core needs it) |
| `@stellar/freighter-api` | `createFreighterConnector()` | Freighter connector not imported |
| `@albedo-link/intent` | `createAlbedoConnector()` | Albedo connector not imported |
| `@creit.tech/xbull-wallet-connect` | `createXBullConnector()` | xBull connector not imported |
| `@ledgerhq/hw-app-str` + `hw-transport-webhid` + `hw-transport-webusb` | `createLedgerConnector()` | Ledger connector not imported |
| `@walletconnect/sign-client` | `createWalletConnectConnector()` | WalletConnect connector not imported |
| `@use-gesture/vanilla` + `motion` | `<saganta-appkit-modal>` bottom-sheet mode | Bottom-sheet mode not used |

Every connector lazy-imports its SDK inside its `connect()` / `signTransaction()` methods, so bundlers only include the SDK code if the connector is actually called. The gesture libraries are lazy-imported inside the modal's `setupBottomSheetGestures()`, only called when `mode === 'bottomsheet'`.

## Register the UI Web Component

The `<saganta-appkit-modal>` Web Component is included in the core package at the `/ui-web` subpath. Import it once at your app entry to register the custom element:

```ts
import '@saganta/stellar-appkit-ui-web';
```

This is a side-effect import — it registers `<saganta-appkit-modal>` with the browser's `customElements` registry. It's separate from the main entry so the framework wrappers stay SSR-safe (the Web Component class extends `HTMLElement`, which is undefined in pure-Node contexts).

## Install a framework wrapper (optional, peer dependency)

If you prefer hooks and typed components over the raw Web Component, install the wrapper for your framework. Frameworks are **peer dependencies** (not bundled) because your app already has its own framework instance — having two copies of React (for example) breaks hooks:

```bash
npm install react react-dom      # for @saganta/stellar-appkit-ui-web/react
npm install vue                  # for @saganta/stellar-appkit-ui-web/vue
npm install solid-js             # for @saganta/stellar-appkit-ui-web/solid
npm install svelte               # for @saganta/stellar-appkit-ui-web/svelte
```

Each wrapper is a separate subpath export — bundlers only ship the framework code you actually import. A React app never ships Vue or Svelte code.

### Why frameworks are peer deps but wallet SDKs aren't

The wallet SDKs and gesture libraries don't have a singleton constraint — the library is the only thing that imports them, so bundling a copy is safe. Frameworks are different: React's `useState` hook checks internal state on the React instance, and if there are two copies of React in the bundle, the hook call from one copy doesn't match the renderer from the other. Keeping frameworks as peer deps lets the app's single framework instance satisfy the wrapper.

## Installing the dev version from git

For testing an in-development version before it's published to npm, see the [Git install guide](https://github.com/SagantaHQ/stellar-appkit#installing-the-dev-version-directly-from-git) in the README.

## Verifying the install

Quick check that everything works:

```ts
import { StellarAppKit, createFreighterConnector } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  connectors: [createFreighterConnector()],
  appMetadata: { name: 'Test', domain: 'localhost', uri: 'http://localhost:3000' },
});

console.log('StellarAppKit ready:', appkit.network);
```

If this runs without `Cannot find module` errors, the install is correct. If you see a missing-module error, your `node_modules` is likely stale — run `rm -rf node_modules && npm install`.
