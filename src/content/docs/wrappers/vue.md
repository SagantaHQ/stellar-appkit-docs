---
title: Vue
description: Complete guide to using Stellar AppKit with Vue 3 — plugin, composables, modal component, signing, SIWS, Soroban, theming, and SSR.
---

This guide covers everything you need to build a Stellar dApp frontend with Vue 3: installing the SDK, embedding the modal UI, connecting wallets, signing transactions, SIWS authentication, Soroban contract calls, theming, and SSR considerations. Every code block is copy-pasteable.

## Installation

```bash
npm install vue @saganta/stellar-appkit
```

That's it — all wallet SDKs (`@stellar/stellar-sdk`, `@stellar/freighter-api`, `@albedo-link/intent`, `@creit.tech/xbull-wallet-connect`, `@ledgerhq/*`, `@walletconnect/sign-client`) and gesture libraries (`@use-gesture/vanilla`, `motion`) are bundled as regular dependencies of `@saganta/stellar-appkit`. They're installed automatically, version-locked to known-working ranges, and tree-shaken out of your bundle if you don't use the corresponding connector.

Vue is a peer dependency (not bundled) because your app already has its own Vue instance — having two copies of Vue would cause reactive state to not sync between components.

You also need to register the `<saganta-appkit-modal>` custom element once at your app entry — this is a side-effect import that's required for the `<StellarAppKitModal>` Vue component to work:

```ts
// main.ts
import '@saganta/stellar-appkit/ui-web';
```

This import registers the Web Component with the browser's `customElements` registry. It's separate from the Vue wrapper so the wrapper stays SSR-safe (the Web Component class extends `HTMLElement`, which is undefined in pure-Node contexts).

## Full working example

This is the minimum to get a working wallet connect flow with the modal UI embedded:

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import '@saganta/stellar-appkit/ui-web'; // registers <saganta-appkit-modal>

createApp(App).mount('#app');
```

```vue
<!-- App.vue -->
<script setup lang="ts">
  import { provideStellarAppKit, StellarAppKitModal } from '@saganta/stellar-appkit/vue';
  import { createFreighterConnector, createAlbedoConnector } from '@saganta/stellar-appkit';

  provideStellarAppKit({
    network: 'TESTNET',
    connectors: [createFreighterConnector(), createAlbedoConnector()],
    appMetadata: {
      name: 'My App',
      domain: 'app.example.com',
      uri: 'https://app.example.com',
    },
  });
</script>

<template>
  <Header />
  <StellarAppKitModal mode="auto" theme="dark" />
</template>
```

```vue
<!-- Header.vue -->
<script setup lang="ts">
  import { ref } from 'vue';
  import { useConnect, useSession } from '@saganta/stellar-appkit/vue';
  import type { StellarAppKitModal } from '@saganta/stellar-appkit/vue';

  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  const modal = ref<InstanceType<typeof StellarAppKitModal>>();

  function shortAddress(addr?: string) {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }
</script>

<template>
  <header v-if="isConnected">
    <span>{{ shortAddress(session?.address) }}</span>
    <button @click="modal?.open()">Wallet</button>
  </header>
  <header v-else>
    <button :disabled="isConnecting" @click="modal?.open()">
      {{ isConnecting ? 'Connecting...' : 'Connect wallet' }}
    </button>
  </header>
</template>
```

That's a complete wallet connect flow. The `<StellarAppKitModal>` component handles the entire UI — wallet selection, connecting state, network mismatch recovery, transaction preview, and the connected view (balance, history, account switching). Clicking "Connect wallet" opens the modal; once connected, the same button opens the connected view where the user can disconnect or switch accounts.

## Setting up the client

There are two ways to set up the `StellarAppKit` client: as a Vue plugin (app-wide) or via `provide()` (per-component-tree).

### Plugin form (recommended for app-wide use)

```ts
// main.ts
import { createApp } from 'vue';
import { StellarAppKitPlugin } from '@saganta/stellar-appkit/vue';
import { createFreighterConnector } from '@saganta/stellar-appkit';
import App from './App.vue';
import '@saganta/stellar-appkit/ui-web';

const app = createApp(App);
app.use(StellarAppKitPlugin, {
  network: 'TESTNET',
  connectors: [createFreighterConnector()],
  appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
  restoreOnMount: true, // default — restores any persisted session on install
});
app.mount('#app');
```

### Provide form (for per-route or per-component clients)

```vue
<!-- App.vue -->
<script setup lang="ts">
  import { provideStellarAppKit } from '@saganta/stellar-appkit/vue';
  import { createFreighterConnector } from '@saganta/stellar-appkit';

  // Call inside setup() — provides the client to all descendants
  provideStellarAppKit({
    network: 'TESTNET',
    connectors: [createFreighterConnector()],
    appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
  });
</script>
```

The plugin form is simpler — use it unless you need different StellarAppKit instances in different parts of the app (e.g. a Testnet playground alongside a Mainnet dashboard).

## Embedding the UI

The `<StellarAppKitModal>` component wraps the underlying `<saganta-appkit-modal>` Web Component. Mount it once anywhere inside the component tree where `provideStellarAppKit()` was called — typically in the root layout, next to your app shell:

```vue
<template>
  <StellarAppKitModal mode="auto" theme="dark" />
  <RouterView />
</template>
```

The modal is positioned `fixed` and overlays the entire viewport, so its placement in the Vue tree doesn't affect layout — it just needs to be inside the provide tree so it can read the `StellarAppKit` client via `inject()`.

### Presentation modes

The `mode` prop controls how the modal is presented:

| Mode | Behavior |
|---|---|
| `auto` (default) | Modal on desktop (≥600px viewport), bottom-sheet on mobile |
| `modal` | Always centered modal with overlay |
| `bottom-sheet` | Always draggable bottom-sheet (mobile-style) |
| `inline` | Embedded in-page, no overlay — always visible. Useful for dashboards or sidebar widgets |

```vue
<!-- Desktop modal + mobile bottom-sheet (default) -->
<StellarAppKitModal mode="auto" />

<!-- Always a bottom-sheet, even on desktop -->
<StellarAppKitModal mode="bottom-sheet" />

<!-- Embedded inline — no overlay, always visible -->
<StellarAppKitModal mode="inline" />
```

For `inline` mode, the modal renders in place — make sure its parent has a defined width and height, because the modal will fill its container.

### Theming

The `theme` prop picks one of the built-in palettes:

```vue
<StellarAppKitModal theme="dark" />   <!-- default — editorial dark mode -->
<StellarAppKitModal theme="light" />  <!-- light mode -->
```

For deeper customization, override individual CSS custom properties on the host element via the `:style` prop:

```vue
<StellarAppKitModal
  theme="dark"
  :style="{
    '--sak-color-bg': '#0B0D0E',
    '--sak-color-surface': '#14171A',
    '--sak-color-accent': '#6EE7B7',
    '--sak-color-text': '#F5F6F7',
    '--sak-radius-lg': '20px',
    '--sak-font-display': 'Geist Sans, sans-serif',
  }"
/>
```

See [Theming](/core/theming/) for the full token list.

### All modal props

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'auto' \| 'modal' \| 'bottom-sheet' \| 'inline'` | `'auto'` | Presentation mode |
| `theme` | `'dark' \| 'light'` | `'dark'` | Built-in theme |
| `branding` | `'default' \| 'minimal' \| 'hidden'` | `'default'` | Branding mode for the wallet list view |
| `logo-src` | `string` | — | URL to a custom logo image |
| `title` | `string` | `'Connect a wallet'` | Title shown at the top |
| `auto-retry-network` | `boolean` | `false` | Auto-poll the wallet's network after a `NetworkMismatchError` |
| `stellar-expert-avatars` | `boolean` | `false` | Fetch avatars from Stellar Expert for connected accounts |

## Triggering open / close

The modal doesn't open automatically — you trigger it from your own button. Use a template ref to grab the imperative handle:

```vue
<!-- WalletButton.vue -->
<script setup lang="ts">
  import { ref } from 'vue';
  import { StellarAppKitModal } from '@saganta/stellar-appkit/vue';
  import type { StellarAppKitModal as StellarAppKitModalType } from '@saganta/stellar-appkit/vue';

  const modal = ref<InstanceType<typeof StellarAppKitModalType>>();
</script>

<template>
  <button @click="modal?.open()">Connect wallet</button>

  <!-- Also possible: programmatic close from anywhere with the ref -->
  <button @click="modal?.close()">Force close</button>

  <StellarAppKitModal ref="modal" mode="auto" theme="dark" />
</template>
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

The `<StellarAppKitModal>` component forwards the underlying Web Component's events as Vue emits:

```vue
<StellarAppKitModal
  mode="auto"
  @connect="(session) => {
    console.log('Wallet connected:', session.address);
    // e.g. redirect to dashboard, fire analytics event
  }"
  @disconnect="({ walletId }) => {
    console.log('Wallet disconnected:', walletId);
    // e.g. redirect to landing page
  }"
  @error="(err) => {
    console.error('Wallet error:', err);
    // err is a ConnectError — check err.code for SEP-43 error codes
  }"
/>
```

You can also subscribe to the same events reactively via composables (see below), which is more idiomatic in Vue.

## Available composables

All composables must be called inside a component tree where `provideStellarAppKit()` was called (or after `app.use(StellarAppKitPlugin, ...)`). They `inject()` the client and return reactive refs.

| Composable | Returns | Re-renders on |
|---|---|---|
| `useAppKit()` | The `StellarAppKit` client instance | Every status/session/queue change |
| `useStatus()` | `Ref<'idle' \| 'selecting' \| 'connecting' \| 'connected' \| 'error'>` | Status change |
| `useSession()` | `Readonly<Ref<ConnectSession \| null>>` | Connect / disconnect / switch |
| `useSessions()` | `Readonly<Ref<ConnectSession[]>>` | Any session change |
| `useAddress()` | `ComputedRef<string \| null>` | Session change |
| `usePendingSignCount()` | `Ref<number>` | Sign queue change |
| `useConnect()` | `{ connect, disconnect, switchAccount, isConnected, isConnecting, error }` | Status + error |
| `useSignTransaction()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSignMessage()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSignIn()` | `{ sign, isSigning, data, error }` | Sign lifecycle |
| `useSoroban({ rpcUrl, networkPassphrase })` | `{ soroban, invoke, previewInvoke, estimateFee, contract, status, ... }` | Invoke lifecycle |
| `usePreviewTransaction()` | `{ preview, respond, isPending }` | Preview pending / resolved |
| `usePreviewAuthEntry()` | `{ preview, respond, isPending }` | Preview pending / resolved |

Returned refs are `shallowRef` + `shallowReadonly` to avoid Vue's deep reactivity overhead on the (potentially large) session objects. Treat them as you would any other ref — `{{ session?.address }}` in templates, `session.value?.address` in script.

## Connection management

```vue
<!-- WalletButton.vue -->
<script setup lang="ts">
  import { useConnect, useAddress } from '@saganta/stellar-appkit/vue';

  const { connect, disconnect, isConnected, isConnecting, error } = useConnect();
  const address = useAddress();

  function shortAddress(addr?: string) {
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }
</script>

<template>
  <div v-if="isConnected">
    <span>{{ shortAddress(address) }}</span>
    <button @click="disconnect()">Disconnect</button>
  </div>
  <button
    v-else
    :disabled="isConnecting"
    @click="connect('freighter')"
  >
    {{ isConnecting ? 'Connecting...' : 'Connect Freighter' }}
  </button>
</template>
```

### Connecting multiple wallets

The underlying `StellarAppKit` client supports keeping multiple wallets connected at the API level — connecting a second wallet doesn't replace the first. **Note:** the built-in `<saganta-appkit-modal>` UI is single-wallet — connecting a new wallet through the modal replaces the previous one in the UI, even though the underlying API keeps both sessions alive. The multi-session API is intended for apps that build their own wallet management UI on top of the client.

```vue
<script setup lang="ts">
  import { useConnect, useSessions } from '@saganta/stellar-appkit/vue';

  const { connect, switchAccount } = useConnect();
  const sessions = useSessions(); // Readonly<Ref<ConnectSession[]>>

  // Connect Freighter, then Ledger — both stay connected at the API level
  await connect('freighter');
  await connect('ledger');

  // sessions.value is [freighterSession, ledgerSession]
  // The active one (returned by useSession()) is the most recently connected

  // Switch active back to Freighter without disconnecting Ledger
  await switchAccount('freighter');
</script>
```

### Network mismatch recovery

If the user's wallet is on a different network than your app expects (e.g. wallet is on Public, app is on Testnet), `connect()` throws a `NetworkMismatchError`. You can either handle it manually or use the auto-retry option:

```vue
<script setup lang="ts">
  import { useConnect } from '@saganta/stellar-appkit/vue';
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

```vue
<!-- SignButton.vue -->
<script setup lang="ts">
  import { useSignTransaction } from '@saganta/stellar-appkit/vue';

  const props = defineProps<{ xdr: string }>();
  const { sign, isSigning, data, error } = useSignTransaction();
</script>

<template>
  <button :disabled="isSigning" @click="sign(props.xdr)">
    {{ isSigning ? 'Check your wallet...' : 'Sign transaction' }}
  </button>

  <p v-if="error" class="error">{{ String(error) }}</p>
  <p v-if="data">Signed! Hash: {{ data.hash }}</p>
</template>
```

By default, `sign()` goes through the preview flow — the modal opens automatically with a human-readable breakdown of the transaction (operations decoded, risk flags, fee estimate, balance deltas). The user approves or rejects in the modal, then the wallet's own signature prompt appears. If you've already shown a preview elsewhere and want to skip the modal:

```ts
await sign(xdr, { skipPreview: true });
```

### Signing messages and SIWS

```vue
<!-- MessageSigner.vue -->
<script setup lang="ts">
  import { useSignMessage, useSignIn } from '@saganta/stellar-appkit/vue';

  const { sign: signMsg, isSigning: isSigningMsg, data: msgData } = useSignMessage();
  const { sign: signIn, isSigning: isSigningIn, data: signInData } = useSignIn();
</script>

<template>
  <button :disabled="isSigningMsg" @click="signMsg('Hello, Stellar!')">
    Sign message
  </button>
  <!-- msgData.signedMessage — the raw signed bytes -->
  <!-- msgData.signedData — base64 of the exact bytes the wallet signed (for SIWS verification) -->

  <button
    :disabled="isSigningIn"
    @click="signIn({
      statement: 'Sign in to My App',
      nonce: await fetch('/api/nonce').then(r => r.text()),
    })"
  >
    Sign in
  </button>
  <!-- signInData.message — the SIWS message string that was signed -->
  <!-- signInData.signedMessage — the signed message bytes -->
  <!-- signInData.signedData — base64 of the exact bytes (pass this to verifySiws server-side) -->
  <!-- signInData.signerAddress — the address that signed -->
</template>
```

See [Sign-In With Stellar](/core/siws/) for the server-side verification flow.

## Soroban contract calls

```vue
<!-- TokenTransfer.vue -->
<script setup lang="ts">
  import { useSoroban } from '@saganta/stellar-appkit/vue';
  import { Networks } from '@stellar/stellar-sdk';

  const props = defineProps<{
    from: string;
    to: string;
    amount: bigint;
  }>();

  const { invoke, status, lastResult, error } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });
</script>

<template>
  <button
    :disabled="status === 'invoking'"
    @click="invoke({
      contractId: 'CBETT2CX...',
      method: 'transfer',
      args: [props.from, props.to, props.amount],
    })"
  >
    {{ status === 'invoking' ? 'Submitting...' : `Transfer ${props.amount}` }}
  </button>

  <p v-if="status === 'success' && lastResult">Submitted! Hash: {{ lastResult.hash }}</p>
  <p v-if="status === 'error'" class="error">{{ String(error) }}</p>
</template>
```

The `invoke()` call runs the full pipeline: build → simulate → prepare → sign → submit → poll. The modal opens automatically for the sign step (with a Soroban-specific preview showing balance deltas and fee estimate).

For typed contract clients, RPC failover, and lower-level escape hatches, see [Soroban Integration](/core/soroban/).

## Custom transaction preview UI

If you don't want to use the built-in modal's preview view, you can render your own with the `usePreviewTransaction` composable:

```vue
<!-- CustomPreview.vue -->
<script setup lang="ts">
  import { usePreviewTransaction } from '@saganta/stellar-appkit/vue';

  const { preview, respond, isPending } = usePreviewTransaction();
</script>

<template>
  <div v-if="isPending && preview" class="preview-overlay">
    <h3>Review transaction</h3>
    <ul>
      <li v-for="(op, i) in preview.operations" :key="i">{{ op.summary }}</li>
    </ul>
    <ul v-if="preview.riskFlags.length > 0" class="warnings">
      <li
        v-for="(flag, i) in preview.riskFlags"
        :key="i"
        :class="flag.severity"
      >{{ flag.message }}</li>
    </ul>
    <p v-if="preview.feeEstimate">Fee: {{ preview.feeEstimate.totalFeeXlm }} XLM</p>
    <div class="actions">
      <button @click="respond(false)">Reject</button>
      <button @click="respond(true)">Approve</button>
    </div>
  </div>
</template>
```

`usePreviewTransaction()` installs `client.onPreviewTransaction` under the hood — when `signTransaction()` is called, the client pauses and waits for `respond(approve)` before proceeding to the wallet. If you use this composable, you don't need the modal at all (but you can use both — the modal will defer to your custom preview when `onPreviewTransaction` is set).

## Theming

There are three layers of theming:

1. **Built-in theme** — pass `theme="dark"` or `theme="light"` to `<StellarAppKitModal>`.
2. **CSS custom properties** — override individual tokens via the `:style` prop (see [Embedding the UI](#theming) above).
3. **Custom CSS** — target the host element with `saganta-appkit-modal { ... }` in your global stylesheet. Styles cross the shadow boundary for the host element itself.

See [Theming](/core/theming/) for the full token list and examples.

## SSR (Nuxt, Astro, Vite SSR)

The Vue wrapper is fully SSR-safe — the plugin and composables don't touch `window`, `document`, or `localStorage` during setup. The `StellarAppKit` instance accesses storage lazily (only on actual `connect()` / `restore()` calls), so server-side render won't crash.

The one thing you need to handle: the `import '@saganta/stellar-appkit/ui-web'` side-effect must run only in the browser, not on the server. In Nuxt 3:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  plugins: [
    // Client-only plugin that registers the Web Component
    { src: '~/plugins/stellar-appkit-client.ts', mode: 'client' },
  ],
});
```

```ts
// plugins/stellar-appkit.ts (universal — sets up the client)
import { StellarAppKitPlugin } from '@saganta/stellar-appkit/vue';
import { createFreighterConnector } from '@saganta/stellar-appkit';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(StellarAppKitPlugin, {
    network: 'TESTNET',
    connectors: [createFreighterConnector()],
    appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
  });
});
```

```ts
// plugins/stellar-appkit-client.ts (client-only — registers the Web Component)
import '@saganta/stellar-appkit/ui-web';

export default defineNuxtPlugin(() => {
  // The side-effect import above registers <saganta-appkit-modal>
});
```

For pages that need the wallet client on the server (e.g. to verify a SIWS session cookie), use the raw `StellarAppKit` class directly — don't try to use the composables outside of a Vue setup() context.

## TypeScript

All types are exported from `@saganta/stellar-appkit/vue`:

```ts
import type {
  StellarAppKitConfig,
  StellarAppKitModalProps,
  StellarAppKitModalHandle,
  StellarAppKitModalEvents,
} from '@saganta/stellar-appkit/vue';
```

The composables are fully typed — `useSignTransaction()` returns `{ sign, isSigning, data: Ref<SignTransactionResult | null>, error: Ref<unknown> }`, `useSoroban()` returns the full Soroban surface with typed `InvokeOptions` and `InvokeResult`, etc. You usually don't need to import the types explicitly; they flow through the composables.

## Reference

- [Available composables](#available-composables) — full table above
- [Modal props](#all-modal-props) — full table above
- [Framework Modal Components](/wrappers/modal-components/) — the `<StellarAppKitModal>` component reference
- [Wallet Connection](/core/wallet-connection/) — connection management details (network mismatch, account switching, cross-tab sync)
- [Transaction Preview](/core/transaction-preview/) — risk flags, contract badges, fee estimates
- [Soroban Integration](/core/soroban/) — typed contract clients, RPC failover, auth-entry signing
- [Sign-In With Stellar](/core/siws/) — SIWS message format and server-side verification
- [Theming](/core/theming/) — full CSS custom property reference
- [API Reference](/reference/api/) — `StellarAppKit`, `SorobanConnection`, `verifySiws`
- [Error Handling](/reference/errors/) — `ConnectError` codes, `NetworkMismatchError`
