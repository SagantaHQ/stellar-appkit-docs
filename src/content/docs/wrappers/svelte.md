---
title: Svelte
description: Complete guide to using Stellar AppKit with Svelte — stores, modal action, signing, SIWS, Soroban, theming, and SSR. Works in Svelte 4 and Svelte 5.
---

This guide covers everything you need to build a Stellar dApp frontend with Svelte: installing the SDK, embedding the modal UI, connecting wallets, signing transactions, SIWS authentication, Soroban contract calls, theming, and SSR considerations. Works in both Svelte 4 (stores) and Svelte 5 (runes + stores). Every code block is copy-pasteable.

## Installation

```bash
npm install svelte @saganta/stellar-appkit @stellar/stellar-sdk
```

Then install the wallet SDKs for the connectors you want to support:

```bash
npm install @stellar/freighter-api              # Freighter
npm install @albedo-link/intent                 # Albedo (no install required for users)
npm install @creit.tech/xbull-wallet-connect    # xBull
npm install @ledgerhq/hw-app-str @ledgerhq/hw-transport-webhid  # Ledger
npm install @walletconnect/sign-client          # WalletConnect (QR pairing)
```

You also need to register the `<saganta-appkit-modal>` custom element once at your app entry — this is a side-effect import that's required for the `use:stellarmodal` action (and any raw `<saganta-appkit-modal>` element in your templates) to work:

```ts
// main.ts (or +layout.ts for SvelteKit)
import '@saganta/stellar-appkit/ui-web';
```

This import registers the Web Component with the browser's `customElements` registry. It's separate from the Svelte wrapper so the wrapper stays SSR-safe (the Web Component class extends `HTMLElement`, which is undefined in pure-Node contexts).

## Full working example

This is the minimum to get a working wallet connect flow with the modal UI embedded:

```ts
// main.ts
import App from './App.svelte';
import '@saganta/stellar-appkit/ui-web'; // registers <saganta-appkit-modal>

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { setStellarAppKitContext } from '@saganta/stellar-appkit/svelte';
  import { createFreighterConnector, createAlbedoConnector } from '@saganta/stellar-appkit';
  import Header from './Header.svelte';

  // Set up the client ONCE at app init. Module-level singleton — persists across navigations.
  setStellarAppKitContext({
    network: 'TESTNET',
    connectors: [createFreighterConnector(), createAlbedoConnector()],
    appMetadata: {
      name: 'My App',
      domain: 'app.example.com',
      uri: 'https://app.example.com',
    },
  });
</script>

<Header />

<!-- The modal — use:stellarmodal wires up the client automatically -->
<saganta-appkit-modal use:stellarmodal mode="auto" theme="dark"></saganta-appkit-modal>
```

```svelte
<!-- Header.svelte -->
<script lang="ts">
  import { useConnect, useSession } from '@saganta/stellar-appkit/svelte';
  import { openModal } from '@saganta/stellar-appkit/svelte';

  const { isConnected, isConnecting } = useConnect();
  const session = useSession();

  function shortAddress(addr?: string) {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }
</script>

{#if $isConnected}
  <header>
    <span>{shortAddress($session?.address)}</span>
    <button on:click={() => openModal()}>Wallet</button>
  </header>
{:else}
  <header>
    <button disabled={$isConnecting} on:click={() => openModal()}>
      {$isConnecting ? 'Connecting...' : 'Connect wallet'}
    </button>
  </header>
{/if}
```

That's a complete wallet connect flow. The `use:stellarmodal` action wires up the modal to the `StellarAppKit` client; the modal handles the entire UI — wallet selection, connecting state, network mismatch recovery, transaction preview, and the connected view (balance, history, account switching).

## Why a Svelte action (not a component)

The other framework wrappers (React/Vue/Solid) ship a `<StellarAppKitModal>` component that wraps the underlying Web Component. Svelte is different — Svelte renders unknown lowercase tags (like `<saganta-appkit-modal>`) as-is in templates, so a wrapper component would just add an extra layer of indirection without buying anything.

Svelte **actions** (`use:stellarmodal`) are the idiomatic pattern for enhancing a DOM node — they're plain TS functions that take the node and return a destroy callback. This keeps the wrapper zero-runtime-overhead and avoids needing a Svelte compiler step in the build (the rest of the wrapper is plain TS, so it tree-shakes cleanly).

If you really want a component-style API, you can wrap it yourself:

```svelte
<!-- Modal.svelte -->
<script lang="ts">
  import { stellarmodal } from '@saganta/stellar-appkit/svelte';
  export let mode: 'auto' | 'modal' | 'bottom-sheet' | 'inline' = 'auto';
  export let theme: 'dark' | 'light' = 'dark';
</script>

<saganta-appkit-modal use:stellarmodal {mode} {theme}></saganta-appkit-modal>
```

But the action-on-raw-element pattern is what the docs recommend.

## Embedding the UI

The `<saganta-appkit-modal>` element with `use:stellarmodal` is the modal. Place it once in your root layout:

```svelte
<!-- +layout.svelte (SvelteKit) or App.svelte -->
<script lang="ts">
  import { setStellarAppKitContext, stellarmodal } from '@saganta/stellar-appkit/svelte';
  import '@saganta/stellar-appkit/ui-web';

  setStellarAppKitContext({ network: 'TESTNET', connectors: [...] });
</script>

<saganta-appkit-modal use:stellarmodal mode="auto" theme="dark"></saganta-appkit-modal>
<slot />
```

The modal is positioned `fixed` and overlays the entire viewport, so its placement in the Svelte tree doesn't affect layout — it just needs the `use:stellarmodal` action so it can read the `StellarAppKit` client from the module-level singleton.

### Presentation modes

The `mode` attribute controls how the modal is presented:

| Mode | Behavior |
|---|---|
| `auto` (default) | Modal on desktop (≥600px viewport), bottom-sheet on mobile |
| `modal` | Always centered modal with overlay |
| `bottom-sheet` | Always draggable bottom-sheet (mobile-style) |
| `inline` | Embedded in-page, no overlay — always visible. Useful for dashboards or sidebar widgets |

```svelte
<!-- Desktop modal + mobile bottom-sheet (default) -->
<saganta-appkit-modal use:stellarmodal mode="auto"></saganta-appkit-modal>

<!-- Always a bottom-sheet, even on desktop -->
<saganta-appkit-modal use:stellarmodal mode="bottom-sheet"></saganta-appkit-modal>

<!-- Embedded inline — no overlay, always visible -->
<saganta-appkit-modal use:stellarmodal mode="inline"></saganta-appkit-modal>
```

For `inline` mode, the modal renders in place — make sure its parent has a defined width and height, because the modal will fill its container.

### Theming

The `theme` attribute picks one of the built-in palettes:

```svelte
<saganta-appkit-modal use:stellarmodal theme="dark"></saganta-appkit-modal>   <!-- default -->
<saganta-appkit-modal use:stellarmodal theme="light"></saganta-appkit-modal>
```

For deeper customization, override individual CSS custom properties on the host element via the `style` attribute:

```svelte
<saganta-appkit-modal
  use:stellarmodal
  theme="dark"
  style="
    --sak-color-bg: #0B0D0E;
    --sak-color-surface: #14171A;
    --sak-color-accent: #6EE7B7;
    --sak-color-text: #F5F6F7;
    --sak-radius-lg: 20px;
    --sak-font-display: 'Geist Sans', sans-serif;
  "
></saganta-appkit-modal>
```

See [Theming](/core/theming/) for the full token list.

### All modal attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `mode` | `auto` \| `modal` \| `bottom-sheet` \| `inline` | `auto` | Presentation mode |
| `theme` | `dark` \| `light` | `dark` | Built-in theme |
| `branding` | `default` \| `minimal` \| `hidden` | `default` | Branding mode for the wallet list view |
| `logo-src` | image URL | — | URL to a custom logo image |
| `title` | string | `'Connect a wallet'` | Title shown at the top |
| `auto-retry-network` | `true` \| `false` | `false` | Auto-poll the wallet's network after a `NetworkMismatchError` |
| `stellar-expert-avatars` | `true` \| `false` | `false` | Fetch avatars from Stellar Expert for connected accounts |

## Triggering open / close

The modal doesn't open automatically — you trigger it from your own button. Use `bind:this` to get a reference to the DOM element, then call the `openModal()` and `closeModal()` helpers:

```svelte
<!-- WalletButton.svelte -->
<script lang="ts">
  import { stellarmodal, openModal, closeModal } from '@saganta/stellar-appkit/svelte';
  import '@saganta/stellar-appkit/ui-web';

  let modalEl: HTMLElement;
</script>

<button on:click={() => openModal(modalEl)}>Connect wallet</button>

<!-- Also possible: programmatic close from anywhere with the element ref -->
<button on:click={() => closeModal(modalEl)}>Force close</button>

<saganta-appkit-modal use:stellarmodal bind:this={modalEl} mode="auto" theme="dark"></saganta-appkit-modal>
```

The `openModal()` function calls the underlying Web Component's `open()` method, which:

1. Refreshes the wallet list (calling `getReachability()` on each connector).
2. Sets the modal's internal state to `wallet-list` (or `connected` if a session is already active).
3. Triggers the enter transition.

It returns a Promise that resolves when the modal is fully open. You don't have to await it — the modal opens immediately with a loading state, then populates the list as reachability checks resolve.

### Auto-opening on transaction preview

If a `signTransaction()` call goes through the preview flow (the default), the modal opens automatically to show the preview UI — you don't need to call `openModal()` yourself. This is wired up inside the Web Component's `client` setter, which assigns `client.onPreviewTransaction = (preview) => this.showTransactionPreview(preview)`.

## Listening to events

The underlying Web Component dispatches standard `CustomEvent`s. Svelte's `on:event-name` syntax picks them up directly on the `<saganta-appkit-modal>` element:

```svelte
<saganta-appkit-modal
  use:stellarmodal
  mode="auto"
  on:sc-connect={(e) => {
    const session = e.detail;
    console.log('Wallet connected:', session.address);
    // e.g. redirect to dashboard, fire analytics event
  }}
  on:sc-disconnect={(e) => {
    const { walletId } = e.detail;
    console.log('Wallet disconnected:', walletId);
    // e.g. redirect to landing page
  }}
  on:sc-error={(e) => {
    const err = e.detail;
    console.error('Wallet error:', err);
    // err is a ConnectError — check err.code for SEP-43 error codes
  }}
></saganta-appkit-modal>
```

You can also subscribe to the same events reactively via stores (see below), which is more idiomatic in Svelte.

## Available stores

All stores must be called after `setStellarAppKitContext()` has been called. They return Svelte writable stores (compatible with both Svelte 4 and 5).

The wrapper exports two naming conventions for each store: the `Store`-suffixed name (`useSessionStore`) and a short alias (`useSession`). They're identical — pick whichever you prefer. The short aliases match the React/Vue/Solid hook names for consistency.

| Store | Returns (`Readable<T>`) | Re-renders on |
|---|---|---|
| `useAppKit()` | The `StellarAppKit` client instance | — (the client is stable) |
| `useStatusStore()` / `useStatus()` | `'idle' \| 'selecting' \| 'connecting' \| 'connected' \| 'error'` | Status change |
| `useSessionStore()` / `useSession()` | `ConnectSession \| null` | Connect / disconnect / switch |
| `useSessionsStore()` / `useSessions()` | `ConnectSession[]` | Any session change |
| `useAddressStore()` / `useAddress()` | `string \| null` | Session change |
| `usePendingSignCountStore()` / `usePendingSignCount()` | `number` | Sign queue change |
| `useConnectStore()` / `useConnect()` | `{ connect, disconnect, switchAccount, isConnected, isConnecting, error }` | Status + error |
| `useSignTransactionStore()` / `useSignTransaction()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSignMessageStore()` / `useSignMessage()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSignInStore()` / `useSignIn()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSorobanStore()` / `useSoroban({ rpcUrl, networkPassphrase })` | `{ soroban, invoke, previewInvoke, estimateFee, contract, status, ... }` | Invoke lifecycle |
| `usePreviewTransactionStore()` / `usePreviewTransaction()` | `{ preview, respond, isPending }` | Preview pending / resolved |
| `usePreviewAuthEntryStore()` / `usePreviewAuthEntry()` | `{ preview, respond, isPending }` | Preview pending / resolved |

In Svelte 4 and 5, subscribe to a store with the `$` prefix: `$session`, `$isConnected`, etc. In Svelte 5 with runes, you can also use `get(session)` to read the value outside of a reactive context.

## Connection management

```svelte
<!-- WalletButton.svelte -->
<script lang="ts">
  import { useConnect, useAddress } from '@saganta/stellar-appkit/svelte';

  const { connect, disconnect, isConnected, isConnecting, error } = useConnect();
  const address = useAddress();

  function shortAddress(addr?: string) {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }
</script>

{#if $isConnected}
  <div>
    <span>{shortAddress($address)}</span>
    <button on:click={() => disconnect()}>Disconnect</button>
  </div>
{:else}
  <button disabled={$isConnecting} on:click={() => connect('freighter')}>
    {$isConnecting ? 'Connecting...' : 'Connect Freighter'}
  </button>
{/if}
```

### Connecting multiple wallets

The underlying `StellarAppKit` client supports keeping multiple wallets connected at the API level — connecting a second wallet doesn't replace the first. **Note:** the built-in `<saganta-appkit-modal>` UI is single-wallet — connecting a new wallet through the modal replaces the previous one in the UI, even though the underlying API keeps both sessions alive. The multi-session API is intended for apps that build their own wallet management UI on top of the client.

```svelte
<script lang="ts">
  import { useConnect, useSessions } from '@saganta/stellar-appkit/svelte';

  const { connect, switchAccount } = useConnect();
  const sessions = useSessions();

  // Connect Freighter, then Ledger — both stay connected at the API level
  async function connectBoth() {
    await connect('freighter');
    await connect('ledger');

    // $sessions is [freighterSession, ledgerSession]
    // The active one (returned by useSession()) is the most recently connected

    // Switch active back to Freighter without disconnecting Ledger
    await switchAccount('freighter');
  }
</script>
```

### Network mismatch recovery

If the user's wallet is on a different network than your app expects (e.g. wallet is on Public, app is on Testnet), `connect()` throws a `NetworkMismatchError`. You can either handle it manually or use the auto-retry option:

```svelte
<script lang="ts">
  import { useConnect } from '@saganta/stellar-appkit/svelte';
  import { NetworkMismatchError } from '@saganta/stellar-appkit';

  const { connect } = useConnect();

  async function handleConnect() {
    try {
      await connect('freighter');
    } catch (err) {
      if (err instanceof NetworkMismatchError) {
        console.log(`Wallet is on ${err.actualNetwork}, app needs ${err.expectedNetwork}`);
        console.log('Ask the user to switch networks in their wallet extension');
      }
    }
  }

  // Or: auto-poll until the user switches networks
  async function autoRetryConnect() {
    await connect('freighter', { autoRetryNetworkMismatch: true });
  }
</script>
```

## Signing transactions

```svelte
<!-- SignButton.svelte -->
<script lang="ts">
  import { useSignTransaction } from '@saganta/stellar-appkit/svelte';

  export let xdr: string;
  const { sign, isSigning, data, error } = useSignTransaction();
</script>

<button disabled={$isSigning} on:click={() => sign(xdr)}>
  {$isSigning ? 'Check your wallet...' : 'Sign transaction'}
</button>

{#if $error}
  <p class="error">{String($error)}</p>
{/if}
{#if $data}
  <p>Signed! Hash: {$data.hash}</p>
{/if}
```

By default, `sign()` goes through the preview flow — the modal opens automatically with a human-readable breakdown of the transaction (operations decoded, risk flags, fee estimate, balance deltas). The user approves or rejects in the modal, then the wallet's own signature prompt appears. If you've already shown a preview elsewhere and want to skip the modal:

```ts
await sign(xdr, { skipPreview: true });
```

### Signing messages and SIWS

```svelte
<!-- MessageSigner.svelte -->
<script lang="ts">
  import { useSignMessage, useSignIn } from '@saganta/stellar-appkit/svelte';

  const { sign: signMsg, isSigning: isSigningMsg, data: msgData } = useSignMessage();
  const { sign: signIn, isSigning: isSigningIn, data: signInData } = useSignIn();
</script>

<button disabled={$isSigningMsg} on:click={() => signMsg('Hello, Stellar!')}>
  Sign message
</button>
<!-- $msgData.signedMessage — the raw signed bytes -->
<!-- $msgData.signedData — base64 of the exact bytes the wallet signed (for SIWS verification) -->

<button
  disabled={$isSigningIn}
  on:click={() => signIn({
    statement: 'Sign in to My App',
    nonce: await fetch('/api/nonce').then(r => r.text()),
  })}
>
  Sign in
</button>
<!-- $signInData.message — the SIWS message string that was signed -->
<!-- $signInData.signedMessage — the signed message bytes -->
<!-- $signInData.signedData — base64 of the exact bytes (pass this to verifySiws server-side) -->
<!-- $signInData.signerAddress — the address that signed -->
```

See [Sign-In With Stellar](/core/siws/) for the server-side verification flow.

## Soroban contract calls

```svelte
<!-- TokenTransfer.svelte -->
<script lang="ts">
  import { useSoroban } from '@saganta/stellar-appkit/svelte';
  import { Networks } from '@stellar/stellar-sdk';

  export let from: string;
  export let to: string;
  export let amount: bigint;

  const { invoke, status, lastResult, error } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });
</script>

<button
  disabled={$status === 'invoking'}
  on:click={() => invoke({
    contractId: 'CBETT2CX...',
    method: 'transfer',
    args: [from, to, amount],
  })}
>
  {$status === 'invoking' ? 'Submitting...' : `Transfer ${amount}`}
</button>

{#if $status === 'success' && $lastResult}
  <p>Submitted! Hash: {$lastResult.hash}</p>
{/if}
{#if $status === 'error'}
  <p class="error">{String($error)}</p>
{/if}
```

The `invoke()` call runs the full pipeline: build → simulate → prepare → sign → submit → poll. The modal opens automatically for the sign step (with a Soroban-specific preview showing balance deltas and fee estimate).

For typed contract clients, RPC failover, and lower-level escape hatches, see [Soroban Integration](/core/soroban/).

## Custom transaction preview UI

If you don't want to use the built-in modal's preview view, you can render your own with the `usePreviewTransaction` store:

```svelte
<!-- CustomPreview.svelte -->
<script lang="ts">
  import { usePreviewTransaction } from '@saganta/stellar-appkit/svelte';

  const { preview, respond, isPending } = usePreviewTransaction();
</script>

{#if $isPending && $preview}
  <div class="preview-overlay">
    <h3>Review transaction</h3>
    <ul>
      {#each $preview.operations as op}
        <li>{op.summary}</li>
      {/each}
    </ul>
    {#if $preview.riskFlags.length > 0}
      <ul class="warnings">
        {#each $preview.riskFlags as flag}
          <li class={flag.severity}>{flag.message}</li>
        {/each}
      </ul>
    {/if}
    {#if $preview.feeEstimate}
      <p>Fee: {$preview.feeEstimate.totalFeeXlm} XLM</p>
    {/if}
    <div class="actions">
      <button on:click={() => respond(false)}>Reject</button>
      <button on:click={() => respond(true)}>Approve</button>
    </div>
  </div>
{/if}
```

`usePreviewTransaction()` installs `client.onPreviewTransaction` under the hood — when `signTransaction()` is called, the client pauses and waits for `respond(approve)` before proceeding to the wallet. If you use this store, you don't need the modal at all (but you can use both — the modal will defer to your custom preview when `onPreviewTransaction` is set).

## Theming

There are three layers of theming:

1. **Built-in theme** — pass `theme="dark"` or `theme="light"` to the `<saganta-appkit-modal>` element.
2. **CSS custom properties** — override individual tokens via the `style` attribute (see [Embedding the UI](#theming) above).
3. **Custom CSS** — target the host element with `saganta-appkit-modal { ... }` in your global stylesheet. Styles cross the shadow boundary for the host element itself.

See [Theming](/core/theming/) for the full token list and examples.

## SSR (SvelteKit, Astro)

The Svelte wrapper is fully SSR-safe — `setStellarAppKitContext()` constructs the client lazily, and storage access is deferred to actual `connect()` / `restore()` calls. The stores return initial values until the client is mounted.

The one thing you need to handle: the `import '@saganta/stellar-appkit/ui-web'` side-effect must run only in the browser, not on the server. In SvelteKit:

```ts
// src/hooks.client.ts
import '@saganta/stellar-appkit/ui-web'; // registers <saganta-appkit-modal>

export {} // hooks.client.ts must export something to be valid
```

Or, if you prefer, gate the import inside a component:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { setStellarAppKitContext, stellarmodal } from '@saganta/stellar-appkit/svelte';
  import { createFreighterConnector } from '@saganta/stellar-appkit';

  setStellarAppKitContext({
    network: 'TESTNET',
    connectors: [createFreighterConnector()],
    appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
  });

  // Register the Web Component only in the browser
  onMount(() => {
    import('@saganta/stellar-appkit/ui-web');
  });
</script>

<saganta-appkit-modal use:stellarmodal mode="auto" theme="dark"></saganta-appkit-modal>
<slot />
```

For pages that need the wallet client on the server (e.g. to verify a SIWS session cookie), use the raw `StellarAppKit` class directly — don't try to use the stores outside of a Svelte component context.

## Svelte 4 vs Svelte 5

The wrapper works in both. The stores-based API (`useSessionStore`, `useConnectStore`, etc.) is the primary API and works in both versions — Svelte 5 still supports stores.

For Svelte 5 with runes, the short aliases (`useSession`, `useConnect`) are also exported. These are identical to the `Store`-suffixed versions — they're just shorter to type. In Svelte 5 runes mode, you'd typically use them like this:

```svelte
<script lang="ts">
  // Svelte 5 runes mode
  import { useSession } from '@saganta/stellar-appkit/svelte';

  const session = useSession(); // Readable<ConnectSession | null>

  // In runes mode you can also use $state for local state and $derived for derived values,
  // but the wallet state comes from the store — subscribe with $ prefix:
  let address = $derived($session?.address ?? null);
</script>

{#if address}
  <p>Connected as {address}</p>
{/if}
```

## TypeScript

All types are exported from `@saganta/stellar-appkit/svelte`:

```ts
import type {
  StellarAppKitConfig,
  StellarAppKitModalProps,
  StellarAppKitModalHandle,
  StellarAppKitModalEvents,
} from '@saganta/stellar-appkit/svelte';
```

The stores are fully typed — `useSignTransaction()` returns `{ sign, isSigning: Readable<boolean>, data: Readable<SignTransactionResult | null>, error: Readable<unknown> }`, `useSoroban()` returns the full Soroban surface with typed `InvokeOptions` and `InvokeResult`, etc. You usually don't need to import the types explicitly; they flow through the stores.

The `stellarmodal` action, `openModal()`, `closeModal()`, and `isStellarAppKitModal()` are also exported as runtime values.

## Reference

- [Available stores](#available-stores) — full table above
- [Modal attributes](#all-modal-attributes) — full table above
- [Framework Modal Components](/wrappers/modal-components/) — the `use:stellarmodal` action reference
- [Wallet Connection](/core/wallet-connection/) — connection management details (network mismatch, account switching, cross-tab sync)
- [Transaction Preview](/core/transaction-preview/) — risk flags, contract badges, fee estimates
- [Soroban Integration](/core/soroban/) — typed contract clients, RPC failover, auth-entry signing
- [Sign-In With Stellar](/core/siws/) — SIWS message format and server-side verification
- [Theming](/core/theming/) — full CSS custom property reference
- [API Reference](/reference/api/) — `StellarAppKit`, `SorobanConnection`, `verifySiws`
- [Error Handling](/reference/errors/) — `ConnectError` codes, `NetworkMismatchError`
