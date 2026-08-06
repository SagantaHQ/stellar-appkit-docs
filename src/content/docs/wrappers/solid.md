---
title: Solid
description: Complete guide to using Stellar AppKit with SolidJS — provider, hooks, modal component, signing, SIWS, Soroban, theming, and SSR.
---

This guide covers everything you need to build a Stellar dApp frontend with SolidJS: installing the SDK, embedding the modal UI, connecting wallets, signing transactions, SIWS authentication, Soroban contract calls, theming, and SSR considerations. Every code block is copy-pasteable.

## Installation

```bash
npm install solid-js @saganta/stellar-appkit
```

That's it — all wallet SDKs (`@stellar/stellar-sdk`, `@stellar/freighter-api`, `@albedo-link/intent`, `@creit.tech/xbull-wallet-connect`, `@ledgerhq/*`, `@walletconnect/sign-client`) and gesture libraries (`@use-gesture/vanilla`, `motion`) are bundled as regular dependencies of `@saganta/stellar-appkit`. They're installed automatically, version-locked to known-working ranges, and tree-shaken out of your bundle if you don't use the corresponding connector.

Solid is a peer dependency (not bundled) because your app already has its own Solid runtime — having two copies would break reactivity.

You also need to register the `<saganta-appkit-modal>` custom element once at your app entry — this is a side-effect import that's required for the `<StellarAppKitModal>` Solid component to work:

```tsx
// entry.tsx (or index.tsx)
import '@saganta/stellar-appkit/ui-web';
```

This import registers the Web Component with the browser's `customElements` registry. It's separate from the Solid wrapper so the wrapper stays SSR-safe (the Web Component class extends `HTMLElement`, which is undefined in pure-Node contexts).

## Full working example

This is the minimum to get a working wallet connect flow with the modal UI embedded:

```tsx
// entry.tsx
import { render } from 'solid-js/web';
import { App } from './App';
import '@saganta/stellar-appkit/ui-web'; // registers <saganta-appkit-modal>

render(() => <App />, document.getElementById('root')!);
```

```tsx
// App.tsx
import {
  StellarAppKitProvider,
  StellarAppKitModal,
} from '@saganta/stellar-appkit/solid';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/solid';
import {
  createFreighterConnector,
  createAlbedoConnector,
} from '@saganta/stellar-appkit';
import { Header } from './Header';
import type { JSX } from 'solid-js';

export function App(): JSX.Element {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      connectors: [createFreighterConnector(), createAlbedoConnector()],
      appMetadata: {
        name: 'My App',
        domain: 'app.example.com',
        uri: 'https://app.example.com',
      },
    }}>
      <Header />
      <StellarAppKitModal mode="auto" theme="dark" />
    </StellarAppKitProvider>
  );
}
```

```tsx
// Header.tsx
import { useConnect, useSession } from '@saganta/stellar-appkit/solid';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/solid';
import type { JSX } from 'solid-js';

export function Header(): JSX.Element {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  let modal: StellarAppKitModalHandle | undefined;

  const shortAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  };

  return (
    <header>
      <Show when={isConnected()} fallback={
        <button disabled={isConnecting()} onClick={() => modal?.open()}>
          {isConnecting() ? 'Connecting...' : 'Connect wallet'}
        </button>
      }>
        <span>{shortAddress(session()?.address)}</span>
        <button onClick={() => modal?.open()}>Wallet</button>
      </Show>
    </header>
  );
}
```

That's a complete wallet connect flow. The `<StellarAppKitModal>` component handles the entire UI — wallet selection, connecting state, network mismatch recovery, transaction preview, and the connected view (balance, history, account switching). Clicking "Connect wallet" opens the modal; once connected, the same button opens the connected view where the user can disconnect or switch accounts.

## Embedding the UI

The `<StellarAppKitModal>` component wraps the underlying `<saganta-appkit-modal>` Web Component. Mount it once anywhere inside your `<StellarAppKitProvider>` tree — typically in the root layout, next to your app shell:

```tsx
<StellarAppKitProvider config={...}>
  <StellarAppKitModal mode="auto" theme="dark" />
  <YourApp />
</StellarAppKitProvider>
```

The modal is positioned `fixed` and overlays the entire viewport, so its placement in the Solid tree doesn't affect layout — it just needs to be inside the provider so it can read the `StellarAppKit` client from context.

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
<StellarAppKitModal mode="bottom-sheet" />

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
  } as JSX.CSSProperties}
/>
```

See [Theming](/core/theming/) for the full token list.

### All modal props

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'auto' \| 'modal' \| 'bottom-sheet' \| 'inline'` | `'auto'` | Presentation mode |
| `theme` | `'dark' \| 'light'` | `'dark'` | Built-in theme |
| `branding` | `'default' \| 'minimal' \| 'hidden'` | `'default'` | Branding mode for the wallet list view |
| `logoSrc` | `string` | — | URL to a custom logo image |
| `title` | `string` | `'Connect a wallet'` | Title shown at the top |
| `autoRetryNetwork` | `boolean` | `false` | Auto-poll the wallet's network after a `NetworkMismatchError` |
| `stellarExpertAvatars` | `boolean` | `false` | Fetch avatars from Stellar Expert for connected accounts |

## Triggering open / close

The modal doesn't open automatically — you trigger it from your own button. Solid doesn't have `forwardRef`, so the `<StellarAppKitModal>` component accepts a `ref` **callback prop** that's called with the imperative handle once the host element mounts:

```tsx
import { StellarAppKitModal } from '@saganta/stellar-appkit/solid';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/solid';
import type { JSX } from 'solid-js';

export function WalletButton(): JSX.Element {
  let handle: StellarAppKitModalHandle | undefined;

  return (
    <>
      <button onClick={() => handle?.open()}>Connect wallet</button>

      {/* Also possible: programmatic close from anywhere with the handle */}
      <button onClick={() => handle?.close()}>Force close</button>

      <StellarAppKitModal
        ref={(h) => (handle = h)}
        mode="auto"
        theme="dark"
      />
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

The `<StellarAppKitModal>` component forwards the underlying Web Component's events as Solid callback props:

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

You can also subscribe to the same events reactively via hooks (see below), which is more idiomatic in Solid.

## Available hooks

All hooks must be called inside a `<StellarAppKitProvider>` tree. They read the `StellarAppKit` client from context and return reactive accessors (Solid's `() => T` pattern).

| Hook | Returns | Re-renders on |
|---|---|---|
| `useAppKit()` | The `StellarAppKit` client instance | — (the client is stable) |
| `useStatus()` | `() => 'idle' \| 'selecting' \| 'connecting' \| 'connected' \| 'error'` | Status change |
| `useSession()` | `() => ConnectSession \| null` | Connect / disconnect / switch |
| `useSessions()` | `() => ConnectSession[]` | Any session change |
| `useAddress()` | `() => string \| null` | Session change |
| `usePendingSignCount()` | `() => number` | Sign queue change |
| `useConnect()` | `{ connect, disconnect, switchAccount, isConnected, isConnecting, error }` (accessors) | Status + error |
| `useSignTransaction()` | `{ sign, isSigning, data, error }` (accessors) | Sign lifecycle |
| `useSignMessage()` | `{ sign, isSigning, data, error }` (accessors) | Sign lifecycle |
| `useSignIn()` | `{ sign, isSigning, data, error }` (accessors) | Sign lifecycle |
| `useSoroban({ rpcUrl, networkPassphrase })` | `{ soroban, invoke, previewInvoke, estimateFee, contract, status, ... }` | Invoke lifecycle |
| `usePreviewTransaction()` | `{ preview, respond, isPending }` (accessors) | Preview pending / resolved |
| `usePreviewAuthEntry()` | `{ preview, respond, isPending }` (accessors) | Preview pending / resolved |

Remember: in Solid, reactive values are functions — call them to read the current value (`isConnected()`, `session()?.address`). This is the same as any other Solid hook.

## Connection management

```tsx
import { useConnect, useAddress } from '@saganta/stellar-appkit/solid';
import type { JSX } from 'solid-js';

export function WalletButton(): JSX.Element {
  const { connect, disconnect, isConnected, isConnecting, error } = useConnect();
  const address = useAddress();

  const shortAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  };

  return (
    <Show
      when={isConnected()}
      fallback={
        <button disabled={isConnecting()} onClick={() => connect('freighter')}>
          {isConnecting() ? 'Connecting...' : 'Connect Freighter'}
        </button>
      }
    >
      <div>
        <span>{shortAddress(address())}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    </Show>
  );
}
```

### Connecting multiple wallets

The underlying `StellarAppKit` client supports keeping multiple wallets connected at the API level — connecting a second wallet doesn't replace the first. **Note:** the built-in `<saganta-appkit-modal>` UI is single-wallet — connecting a new wallet through the modal replaces the previous one in the UI, even though the underlying API keeps both sessions alive. The multi-session API is intended for apps that build their own wallet management UI on top of the client.

```tsx
const { connect, switchAccount } = useConnect();
const sessions = useSessions();

// Connect Freighter, then Ledger — both stay connected at the API level
await connect('freighter');
await connect('ledger');

// sessions() is [freighterSession, ledgerSession]
// The active one (returned by useSession()()) is the most recently connected

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
import { useSignTransaction } from '@saganta/stellar-appkit/solid';
import type { JSX } from 'solid-js';

export function SignButton(props: { xdr: string }): JSX.Element {
  const { sign, isSigning, data, error } = useSignTransaction();

  return (
    <>
      <button disabled={isSigning()} onClick={() => sign(props.xdr)}>
        {isSigning() ? 'Check your wallet...' : 'Sign transaction'}
      </button>

      <p class="error">{String(error())}</p>
      <p>Signed! Hash: {data()?.hash}</p>
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
import { useSignMessage, useSignIn } from '@saganta/stellar-appkit/solid';

function MessageSigner() {
  const { sign, isSigning, data } = useSignMessage();
  return (
    <button disabled={isSigning()} onClick={() => sign('Hello, Stellar!')}>
      Sign message
    </button>
  );
  // data()?.signedMessage — the raw signed bytes
  // data()?.signedData — base64 of the exact bytes the wallet signed (for SIWS verification)
}

function SignInButton() {
  const { sign, isSigning, data } = useSignIn();
  return (
    <button
      disabled={isSigning()}
      onClick={() => sign({
        statement: 'Sign in to My App',
        nonce: await fetch('/api/nonce').then(r => r.text()),
      })}
    >
      Sign in
    </button>
  );
  // data()?.message — the SIWS message string that was signed
  // data()?.signedMessage — the signed message bytes
  // data()?.signedData — base64 of the exact bytes (pass this to verifySiws server-side)
  // data()?.signerAddress — the address that signed
}
```

See [Sign-In With Stellar](/core/siws/) for the server-side verification flow.

## Soroban contract calls

```tsx
import { useSoroban } from '@saganta/stellar-appkit/solid';
import { Networks } from '@stellar/stellar-sdk';
import type { JSX } from 'solid-js';

export function TokenTransfer(props: {
  from: string;
  to: string;
  amount: bigint;
}): JSX.Element {
  const { invoke, status, lastResult, error } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });

  return (
    <>
      <button
        disabled={status() === 'invoking'}
        onClick={() => invoke({
          contractId: 'CBETT2CX...',
          method: 'transfer',
          args: [props.from, props.to, props.amount],
        })}
      >
        {status() === 'invoking' ? 'Submitting...' : `Transfer ${props.amount}`}
      </button>

      <Show when={status() === 'success' && lastResult()}>
        <p>Submitted! Hash: {lastResult()!.hash}</p>
      </Show>
      <Show when={status() === 'error'}>
        <p class="error">{String(error())}</p>
      </Show>
    </>
  );
}
```

The `invoke()` call runs the full pipeline: build → simulate → prepare → sign → submit → poll. The modal opens automatically for the sign step (with a Soroban-specific preview showing balance deltas and fee estimate).

For typed contract clients, RPC failover, and lower-level escape hatches, see [Soroban Integration](/core/soroban/).

## Custom transaction preview UI

If you don't want to use the built-in modal's preview view, you can render your own with the `usePreviewTransaction` hook:

```tsx
import { usePreviewTransaction } from '@saganta/stellar-appkit/solid';
import { Show, For } from 'solid-js';
import type { JSX } from 'solid-js';

export function CustomPreview(): JSX.Element {
  const { preview, respond, isPending } = usePreviewTransaction();

  return (
    <Show when={isPending() && preview()}>
      {(p) => (
        <div class="preview-overlay">
          <h3>Review transaction</h3>
          <ul>
            <For each={p().operations}>
              {(op) => <li>{op.summary}</li>}
            </For>
          </ul>
          <Show when={p().riskFlags.length > 0}>
            <ul class="warnings">
              <For each={p().riskFlags}>
                {(flag) => <li class={flag.severity}>{flag.message}</li>}
              </For>
            </ul>
          </Show>
          <Show when={p().feeEstimate}>
            <p>Fee: {p().feeEstimate!.totalFeeXlm} XLM</p>
          </Show>
          <div class="actions">
            <button onClick={() => respond(false)}>Reject</button>
            <button onClick={() => respond(true)}>Approve</button>
          </div>
        </div>
      )}
    </Show>
  );
}
```

`usePreviewTransaction()` installs `client.onPreviewTransaction` under the hood — when `signTransaction()` is called, the client pauses and waits for `respond(approve)` before proceeding to the wallet. If you use this hook, you don't need the modal at all (but you can use both — the modal will defer to your custom preview when `onPreviewTransaction` is set).

## Theming

There are three layers of theming:

1. **Built-in theme** — pass `theme="dark"` or `theme="light"` to `<StellarAppKitModal>`.
2. **CSS custom properties** — override individual tokens via the `style` prop (see [Embedding the UI](#theming) above).
3. **Custom CSS** — target the host element with `saganta-appkit-modal { ... }` in your global stylesheet. Styles cross the shadow boundary for the host element itself.

See [Theming](/core/theming/) for the full token list and examples.

## SSR (Solid Start, Astro)

The Solid wrapper is SSR-safe — the provider constructs the client in `onMount` (not during render) to avoid touching `localStorage` during SSR. The composables are safe to call during SSR — they return initial values until the client is mounted.

The one thing you need to handle: the `import '@saganta/stellar-appkit/ui-web'` side-effect must run only in the browser, not on the server. In Solid Start:

```tsx
// entry-client.tsx
import '@saganta/stellar-appkit/ui-web'; // registers <saganta-appkit-modal>
import { mount, StartClient } from 'solid-start/entry-client';

mount(() => <StartClient />, document.getElementById('app')!);
```

For pages that need the wallet client on the server (e.g. to verify a SIWS session cookie), use the raw `StellarAppKit` class directly — don't try to use the hooks outside of a Solid component tree.

## TypeScript

All types are exported from `@saganta/stellar-appkit/solid`:

```ts
import type {
  StellarAppKitProviderConfig,
  StellarAppKitModalProps,
  StellarAppKitModalHandle,
  StellarAppKitModalEvents,
  StellarAppKitModalComponentProps,
} from '@saganta/stellar-appkit/solid';
```

The hooks are fully typed — `useSignTransaction()` returns `{ sign, isSigning: Accessor<boolean>, data: Accessor<SignTransactionResult | null>, error: Accessor<unknown> }`, `useSoroban()` returns the full Soroban surface with typed `InvokeOptions` and `InvokeResult`, etc. You usually don't need to import the types explicitly; they flow through the hooks.

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
