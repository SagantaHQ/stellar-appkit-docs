---
title: React
description: Complete guide to using Stellar AppKit with React — provider, hooks, modal component, signing, SIWS, Soroban, theming, and SSR.
---

This guide covers everything you need to build a Stellar dApp frontend with React: installing the SDK, embedding the modal UI, connecting wallets, signing transactions, SIWS authentication, Soroban contract calls, theming, and SSR considerations. Every code block is copy-pasteable.

## Installation

```bash
npm install react react-dom @saganta/stellar-appkit
```

That's it — all wallet SDKs (`@stellar/stellar-sdk`, `@stellar/freighter-api`, `@albedo-link/intent`, `@creit.tech/xbull-wallet-connect`, `@ledgerhq/*`, `@walletconnect/sign-client`) and gesture libraries (`@use-gesture/vanilla`, `motion`) are bundled as regular dependencies of `@saganta/stellar-appkit`. They're installed automatically, version-locked to known-working ranges, and tree-shaken out of your bundle if you don't use the corresponding connector.

React is a peer dependency (not bundled) because your app already has its own React instance — having two copies of React breaks hooks.

You also need to register the `<stellar-appkit-modal>` custom element once at your app entry — this is a side-effect import that's required for the `<StellarAppKitModal>` React component to work:

```ts
// main.tsx (or whatever your app entry is)
import '@saganta/stellar-appkit-ui-web';
```

This import registers the Web Component with the browser's `customElements` registry. It's separate from the React wrapper so the wrapper stays SSR-safe (the Web Component class extends `HTMLElement`, which is undefined in pure-Node contexts).

## Full working example

This is the minimum to get a working wallet connect flow with the modal UI embedded:

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '@saganta/stellar-appkit-ui-web'; // registers <stellar-appkit-modal>

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```tsx
// App.tsx
import {
  StellarAppKitProvider,
  StellarAppKitModal,
  useConnect,
  useSession,
} from '@saganta/stellar-appkit-ui-web/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit-ui-web/react';
import { useRef } from 'react';
import {
  createFreighterConnector,
  createAlbedoConnector,
} from '@saganta/stellar-appkit';

export function App() {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      connectors: [createFreighterConnector(), createAlbedoConnector()],
      appMetadata: {
        name: 'My App',
        url: 'https://app.example.com',
      },
    }}>
      <Header />
      <StellarAppKitModal mode="auto" theme="dark" />
    </StellarAppKitProvider>
  );
}

function Header() {
  const { isConnected, isConnecting, connect } = useConnect();
  const session = useSession();
  const modalRef = useRef<StellarAppKitModalHandle>(null);

  if (isConnected) {
    return (
      <header>
        <span>{shortAddress(session?.address)}</span>
        <button onClick={() => modalRef.current?.open()}>Wallet</button>
      </header>
    );
  }

  return (
    <header>
      <button
        disabled={isConnecting}
        onClick={() => modalRef.current?.open()}
      >
        {isConnecting ? 'Connecting...' : 'Connect wallet'}
      </button>
    </header>
  );
}

function shortAddress(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
```

That's a complete wallet connect flow. The `<StellarAppKitModal>` component handles the entire UI — wallet selection, connecting state, network mismatch recovery, transaction preview, and the connected view (balance, history, account switching). Clicking "Connect wallet" opens the modal; once connected, the same button opens the connected view where the user can disconnect or switch accounts.

## Embedding the UI

The `<StellarAppKitModal>` component wraps the underlying `<stellar-appkit-modal>` Web Component. Mount it once anywhere inside your `<StellarAppKitProvider>` tree — typically in the root layout, next to your app shell:

```tsx
<StellarAppKitProvider config={...}>
  <StellarAppKitModal mode="auto" theme="dark" />
  <YourApp />
</StellarAppKitProvider>
```

The modal is positioned `fixed` and overlays the entire viewport, so its placement in the React tree doesn't affect layout — it just needs to be inside the provider so it can read the `StellarAppKit` client from context.

### Presentation modes

The `mode` prop controls how the modal is presented:

| Mode | Behavior |
|---|---|
| `auto` (default) | Modal on desktop (≥600px viewport), bottom-sheet on mobile |
| `modal` | Always centered modal with overlay |
| `bottom-sheet` | Always draggable bottom-sheet (mobile-style) |
| `inline` | Embedded in-page, no overlay — always visible. Useful for dashboards or sidebar widgets |

```tsx
{/* Desktop modal + mobile bottom-sheet (default) */}
<StellarAppKitModal mode="auto" />

{/* Always a bottom-sheet, even on desktop */}
<StellarAppKitModal mode="bottomsheet" />

{/* Embedded inline — no overlay, always visible */}
<StellarAppKitModal mode="inline" />
```

For `inline` mode, the modal renders in place — make sure its parent has a defined width and height, because the modal will fill its container.

### Theming

The `theme` prop picks one of the built-in palettes:

```tsx
<StellarAppKitModal theme="dark" />   {/* default — editorial dark mode */}
<StellarAppKitModal theme="light" />  {/* light mode */}
```

For deeper customization, override individual CSS custom properties on the host element via the `style` prop:

```tsx
<StellarAppKitModal
  theme="dark"
  style={{
    '--sak-color-bg': '#0B0D0E',
    '--sak-color-surface': '#14171A',
    '--sak-color-accent': '#6EE7B7',
    '--sak-color-text': '#F5F6F7',
    '--sak-radius-lg': '20px',
    '--sak-font-display': 'Geist Sans, sans-serif',
  } as React.CSSProperties}
/>
```

See [Theming](/core/theming/) for the full token list.

### All modal props

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'auto' \| 'modal' \| 'bottomsheet' \| 'inline'` | `'auto'` | Presentation mode |
| `theme` | `'dark' \| 'light'` | `'dark'` | Built-in theme |
| `branding` | `'default' \| 'minimal' \| 'hidden'` | `'default'` | Branding mode for the wallet list view |
| `logoSrc` | `string` | — | URL to a custom logo image |
| `title` | `string` | `'Connect a wallet'` | Title shown at the top |
| `autoRetryNetwork` | `boolean` | `false` | Auto-poll the wallet's network after a `NetworkMismatchError` |
| `stellarExpertAvatars` | `boolean` | `false` | Fetch avatars from Stellar Expert for connected accounts |

## Triggering open / close

The modal doesn't open automatically — you trigger it from your own button. Use a `ref` to grab the imperative handle:

```tsx
import { useRef } from 'react';
import { StellarAppKitModal } from '@saganta/stellar-appkit-ui-web/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit-ui-web/react';

function Header() {
  const modalRef = useRef<StellarAppKitModalHandle>(null);

  return (
    <>
      <button onClick={() => modalRef.current?.open()}>
        Connect wallet
      </button>

      {/* Also possible: programmatic close from anywhere with the ref */}
      <button onClick={() => modalRef.current?.close()}>
        Force close
      </button>

      <StellarAppKitModal ref={modalRef} mode="auto" theme="dark" />
    </>
  );
}
```

The imperative handle exposes:

```ts
interface StellarAppKitModalHandle {
  /** Open the modal. No-op in inline mode. */
  open(): Promise<void>;
  /** Close the modal. No-op in inline mode. */
  close(): void;
  /** The underlying Web Component DOM node — escape hatch for advanced use. */
  readonly element: HTMLElement & { client: StellarAppKit | null };
}
```

The `open()` call is async because it refreshes the wallet list (calling `getReachability()` on each connector) before showing the modal. You don't have to await it — the modal opens immediately with a loading state, then populates the list as reachability checks resolve.

### Auto-opening on transaction preview

If a `signTransaction()` call goes through the preview flow (the default), the modal opens automatically to show the preview UI — you don't need to call `open()` yourself. This is wired up inside the Web Component's `client` setter, which assigns `client.onPreviewTransaction = (preview) => this.showTransactionPreview(preview)`.

## Listening to events

The `<StellarAppKitModal>` component forwards the underlying Web Component's events as React callback props:

```tsx
<StellarAppKitModal
  mode="auto"
  onConnect={(session) => {
    console.log('Wallet connected:', session.address);
    // e.g. redirect to dashboard, fire analytics event
  }}
  onDisconnect={({ walletId }) => {
    console.log('Wallet disconnected:', walletId);
    // e.g. redirect to landing page
  }}
  onError={(err) => {
    console.error('Wallet error:', err);
    // err is a ConnectError — check err.code for SEP-43 error codes
  }}
/>
```

You can also subscribe to the same events reactively via hooks (see below), which is more idiomatic in React.

## Available hooks

All hooks must be called inside a `<StellarAppKitProvider>` tree. They read the `StellarAppKit` client from context and re-render on the relevant state slice.

| Hook | Returns | Re-renders on |
|---|---|---|
| `useAppKit()` | The `StellarAppKit` client instance | Every status/session/queue change |
| `useStatus()` | `'idle' \| 'selecting' \| 'connecting' \| 'connected' \| 'error'` | Status change |
| `useSession()` | Active `ConnectSession \| null` | Connect / disconnect / switch |
| `useSessions()` | All connected sessions array | Any session change |
| `useAddress()` | Active session's address (or `null`) | Session change |
| `usePendingSignCount()` | Number of queued sign requests | Sign queue change |
| `useConnect()` | `{ connect, disconnect, switchAccount, isConnected, isConnecting, error }` | Status + error |
| `useSignTransaction()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSignMessage()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSignIn()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSoroban({ rpcUrl, networkPassphrase })` | `{ soroban, invoke, previewInvoke, estimateFee, contract, status, ... }` | Invoke lifecycle |
| `usePreviewTransaction()` | `{ preview, respond, isPending }` | Preview pending / resolved |
| `usePreviewAuthEntry()` | `{ preview, respond, isPending }` | Preview pending / resolved |
| `useSiwsSession()` | `SiwsSession \| null` (v1.7.0+) | SIWS session set / cleared / expired |
| `useIsAuthenticated()` | `boolean` (v1.7.0+) | SIWS session change |
| `useLocale()` | `LocaleCode` (v1.8.0+) | Locale change |
| `useSetLocale()` | `(locale: LocaleCode) => Promise<void>` (v1.8.0+) | Stable (function reference) |

## SIWS session hooks (v1.7.0+)

When you pass `siws` config to the provider, the modal automatically runs the SIWS flow on connect. Use these hooks to read the session state reactively:

```tsx
import {
  useSiwsSession,
  useIsAuthenticated,
  useAppKit,
} from '@saganta/stellar-appkit-ui-web/react';

function AuthStatus() {
  const session = useSiwsSession();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated || !session) {
    return <span>Not signed in</span>;
  }

  return (
    <span>
      Signed in as {session.address.slice(0, 8)}…
      (expires {new Date(session.expiry).toLocaleString()})
    </span>
  );
}

function SignOutButton() {
  const appkit = useAppKit();
  return <button onClick={() => appkit.signOut()}>Sign out</button>;
}
```

For the full SIWS flow — `SiwsConfig`, session lifecycle methods (`setSiwsSession`, `clearSiwsSession`, `signOut`, `requireAuth`, `validateSession`, `reauthenticate`), and the `siwsSessionChange` event — see the [Sign-In With Stellar](/core/siws/) guide.

## Internationalization hooks (v1.8.0+)

```tsx
import { useLocale, useSetLocale } from '@saganta/stellar-appkit-ui-web/react';
import type { LocaleCode } from '@saganta/stellar-appkit';

function LanguageSwitcher() {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value as LocaleCode)}>
      <option value="en">English</option>
      <option value="zh-CN">简体中文</option>
      <option value="ja">日本語</option>
      <option value="es">Español</option>
      {/* ... 21 more locales */}
    </select>
  );
}
```

See the [Internationalization](/core/i18n/) guide for the full list of 25 supported locales, ICU MessageFormat details, and the core `setLocale()` / `getLocale()` / `t()` API.

## Connection management

```tsx
import { useConnect, useSession, useAddress } from '@saganta/stellar-appkit-ui-web/react';

function WalletButton() {
  const { connect, disconnect, isConnected, isConnecting, error } = useConnect();
  const address = useAddress();

  if (isConnected) {
    return (
      <div>
        <span>{shortAddress(address)}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <button disabled={isConnecting} onClick={() => connect('freighter')}>
      {isConnecting ? 'Connecting...' : 'Connect Freighter'}
    </button>
  );
}
```

### Connecting multiple wallets

The underlying `StellarAppKit` client supports keeping multiple wallets connected at the API level — connecting a second wallet doesn't replace the first. **Note:** the built-in `<stellar-appkit-modal>` UI is single-wallet — connecting a new wallet through the modal replaces the previous one in the UI, even though the underlying API keeps both sessions alive. The multi-session API is intended for apps that build their own wallet management UI on top of the client.

```tsx
const { connect, sessions, switchAccount } = useConnect();
const allSessions = useSessions();

// Connect Freighter, then Ledger — both stay connected at the API level
await connect('freighter');
await connect('ledger');

// `sessions` from useSessions() is [freighterSession, ledgerSession]
// The active one (returned by useSession()) is the most recently connected

// Switch active back to Freighter without disconnecting Ledger
await switchAccount('freighter');
```

### Network mismatch recovery

If the user's wallet is on a different network than your app expects (e.g. wallet is on Public, app is on Testnet), `connect()` throws a `NetworkMismatchError`. You can either handle it manually or use the auto-retry option:

```tsx
import { NetworkMismatchError } from '@saganta/stellar-appkit';

const { connect } = useConnect();

try {
  await connect('freighter');
} catch (err) {
  if (err instanceof NetworkMismatchError) {
    console.log(`Wallet is on ${err.actualNetwork}, app needs ${err.expectedNetwork}`);
    console.log('Ask the user to switch networks in their wallet extension');
  }
}

// Or: auto-poll until the user switches networks
await connect('freighter', { autoRetryNetworkMismatch: true });
```

## Signing transactions

```tsx
import { useSignTransaction } from '@saganta/stellar-appkit-ui-web/react';

function SignButton({ xdr }: { xdr: string }) {
  const { sign, isSigning, data, error } = useSignTransaction();

  return (
    <>
      <button disabled={isSigning} onClick={() => sign(xdr)}>
        {isSigning ? 'Check your wallet...' : 'Sign transaction'}
      </button>

      {error && <p className="error">{String(error)}</p>}
      {data && <p>Signed! Hash: {data.hash}</p>}
    </>
  );
}
```

By default, `sign()` goes through the preview flow — the modal opens automatically with a human-readable breakdown of the transaction (operations decoded, risk flags, fee estimate, balance deltas). The user approves or rejects in the modal, then the wallet's own signature prompt appears. If you've already shown a preview elsewhere and want to skip the modal:

```tsx
await sign(xdr, { skipPreview: true });
```

### Signing messages and SIWS

```tsx
import { useSignMessage, useSignIn } from '@saganta/stellar-appkit-ui-web/react';

function MessageSigner() {
  const { sign, isSigning, data } = useSignMessage();
  return (
    <button disabled={isSigning} onClick={() => sign('Hello, Stellar!')}>
      Sign message
    </button>
  );
  // data.signedMessage — the raw signed bytes
  // data.signedData — base64 of the exact bytes the wallet signed (for SIWS verification)
}

function SignInButton() {
  const { sign, isSigning, data } = useSignIn();
  return (
    <button
      disabled={isSigning}
      onClick={() => sign({
        statement: 'Sign in to My App',
        nonce: await fetch('/api/nonce').then(r => r.text()),
      })}
    >
      Sign in
    </button>
  );
  // data.message — the SIWS message string that was signed
  // data.signedMessage — the signed message bytes
  // data.signedData — base64 of the exact bytes (pass this to verifySiws server-side)
  // data.signerAddress — the address that signed
}
```

See [Sign-In With Stellar](/core/siws/) for the server-side verification flow.

## Soroban contract calls

```tsx
import { useSoroban } from '@saganta/stellar-appkit-ui-web/react';
import { Networks } from '@saganta/stellar-appkit';

function TokenTransfer({ from, to, amount }: {
  from: string;
  to: string;
  amount: bigint;
}) {
  const { invoke, status, lastResult, error } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });

  return (
    <>
      <button
        disabled={status === 'invoking'}
        onClick={() => invoke({
          contractId: 'CBETT2CX...',
          method: 'transfer',
          args: [from, to, amount],
        })}
      >
        {status === 'invoking' ? 'Submitting...' : `Transfer ${amount}`}
      </button>

      {status === 'success' && lastResult && (
        <p>Submitted! Hash: {lastResult.hash}</p>
      )}
      {status === 'error' && <p className="error">{String(error)}</p>}
    </>
  );
}
```

The `invoke()` call runs the full pipeline: build → simulate → prepare → sign → submit → poll. The modal opens automatically for the sign step (with a Soroban-specific preview showing balance deltas and fee estimate).

For typed contract clients, RPC failover, and lower-level escape hatches, see [Soroban Integration](/core/soroban/).

## Custom transaction preview UI

If you don't want to use the built-in modal's preview view, you can render your own with the `usePreviewTransaction` hook:

```tsx
import { usePreviewTransaction } from '@saganta/stellar-appkit-ui-web/react';

function CustomPreview() {
  const { preview, respond, isPending } = usePreviewTransaction();

  if (!isPending || !preview) return null;

  return (
    <div className="preview-overlay">
      <h3>Review transaction</h3>
      <ul>
        {preview.operations.map((op, i) => (
          <li key={i}>{op.summary}</li>
        ))}
      </ul>
      {preview.riskFlags.length > 0 && (
        <ul className="warnings">
          {preview.riskFlags.map((flag, i) => (
            <li key={i} className={flag.severity}>{flag.message}</li>
          ))}
        </ul>
      )}
      {preview.feeEstimate && (
        <p>Fee: {preview.feeEstimate.totalFeeXlm} XLM</p>
      )}
      <div className="actions">
        <button onClick={() => respond(false)}>Reject</button>
        <button onClick={() => respond(true)}>Approve</button>
      </div>
    </div>
  );
}
```

`usePreviewTransaction()` installs `client.onPreviewTransaction` under the hood — when `signTransaction()` is called, the client pauses and waits for `respond(approve)` before proceeding to the wallet. If you use this hook, you don't need the modal at all (but you can use both — the modal will defer to your custom preview when `onPreviewTransaction` is set).

## Theming

There are three layers of theming:

1. **Built-in theme** — pass `theme="dark"` or `theme="light"` to `<StellarAppKitModal>`.
2. **CSS custom properties** — override individual tokens via the `style` prop (see [Embedding the UI](#theming) above).
3. **Custom CSS** — target the host element with `stellar-appkit-modal { ... }` in your global stylesheet. Styles cross the shadow boundary for the host element itself.

See [Theming](/core/theming/) for the full token list and examples.

## SSR (Next.js, Remix, Astro)

The React wrapper is fully SSR-safe — the provider and hooks don't touch `window`, `document`, or `localStorage` during render. The `StellarAppKit` instance accesses storage lazily (only on actual `connect()` / `restore()` calls), so server-side render won't crash.

The one thing you need to handle: the `import '@saganta/stellar-appkit-ui-web'` side-effect must run only in the browser, not on the server. In Next.js App Router:

```tsx
// app/providers.tsx
'use client';

import { StellarAppKitProvider, StellarAppKitModal } from '@saganta/stellar-appkit-ui-web/react';
import '@saganta/stellar-appkit-ui-web'; // client-only — guarded by 'use client'
import { createFreighterConnector } from '@saganta/stellar-appkit';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      connectors: [createFreighterConnector()],
      appMetadata: { name: 'My App', url: 'https://app.example.com' },
    }}>
      <StellarAppKitModal mode="auto" theme="dark" />
      {children}
    </StellarAppKitProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

For pages that need the wallet client on the server (e.g. to verify a SIWS session cookie), use the raw `StellarAppKit` class directly — don't try to use the hooks outside of a React tree.

## TypeScript

All types are exported from `@saganta/stellar-appkit-ui-web/react`:

```ts
import type {
  StellarAppKitProviderConfig,
  StellarAppKitModalProps,
  StellarAppKitModalHandle,
  StellarAppKitModalEvents,
  StellarAppKitModalComponentProps,
  UseConnectResult,
  UseSignResult,
} from '@saganta/stellar-appkit-ui-web/react';
```

The hooks are fully typed — `useSignTransaction()` returns `UseSignResult<SignTransactionResult>`, `useSoroban()` returns the full Soroban surface with typed `InvokeOptions` and `InvokeResult`, etc. You usually don't need to import the types explicitly; they flow through the hooks.

## Reference

- [Available hooks](#available-hooks) — full table above
- [Modal props](#all-modal-props) — full table above
- [Framework Modal Components](/wrappers/modal-components/) — the `<StellarAppKitModal>` component reference
- [Wallet Connection](/core/wallet-connection/) — connection management details (network mismatch, account switching, cross-tab sync)
- [Transaction Preview](/core/transaction-preview/) — risk flags, contract badges, fee estimates
- [Soroban Integration](/core/soroban/) — typed contract clients, RPC failover, auth-entry signing
- [Sign-In With Stellar](/core/siws/) — SIWS message format and server-side verification
- [Theming](/core/theming/) — full CSS custom property reference
- [API Reference](/reference/api/) — `StellarAppKit`, `SorobanConnection`, `verifySiws`
- [Error Handling](/reference/errors/) — `ConnectError` codes, `NetworkMismatchError`
