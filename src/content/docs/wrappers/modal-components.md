---
title: Framework Modal Components
description: Each framework wrapper ships a typed component wrapping the underlying saganta-appkit-modal Web Component — React, Vue, Solid, and Svelte.
---

Each framework wrapper (`/react`, `/vue`, `/solid`, `/svelte`) ships a typed component wrapping the underlying `<saganta-appkit-modal>` Web Component. Use these in place of the raw custom element when you want typed props, automatic client wiring from the same context as the hooks, and event forwarding as native framework events.

## Why this exists

The underlying modal is a Web Component — it works in any framework, but feels unidiomatic. In React you'd have to manage `useRef`, manually set `element.client = appkit`, and listen for `CustomEvent`s. In Vue you'd need a `<saganta-appkit-modal>` tag in your template with manual `onMounted` wiring. The framework modal components wrap all of that behind a normal typed component with the same API surface across all four frameworks.

## The one-line setup requirement

**Always import `@saganta/stellar-appkit-ui-web` once at your app entry point** to register the `<saganta-appkit-modal>` custom element:

```ts
// app entry — e.g. main.tsx, main.ts, +layout.svelte
import '@saganta/stellar-appkit-ui-web';
```

The framework modal components deliberately do NOT import the Web Component class themselves. That class `extends HTMLElement`, which is undefined in pure-Node SSR contexts — importing it at module top-level would crash server-side rendering. Keeping the registration as an explicit side-effect import lets bundlers tree-shake the Web Component code out of server bundles.

## React

```tsx
import { useRef } from 'react';
import {
  StellarAppKitProvider,
  StellarAppKitModal,
  useAppKit,
} from '@saganta/stellar-appkit-ui-web/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit-ui-web/react';
import { createFreighterConnector } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web'; // registers <saganta-appkit-modal>

export function App() {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      connectors: [createFreighterConnector()],
      appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
    }}>
      <ModalHost />
    </StellarAppKitProvider>
  );
}

function ModalHost() {
  const ref = useRef<StellarAppKitModalHandle>(null);
  return (
    <>
      <StellarAppKitModal
        ref={ref}
        mode="auto"
        theme="dark"
        onConnect={(session) => console.log('connected', session.address)}
        onDisconnect={({ walletId }) => console.log('disconnected', walletId)}
        onError={(err) => console.error('modal error', err)}
      />
      <button onClick={() => ref.current?.open()}>Connect wallet</button>
    </>
  );
}
```

The component uses `forwardRef` and `useImperativeHandle` to expose `open()`, `close()`, and `element` on the ref. The client is read from the same context as the hooks (`useAppKit()`), so the modal stays in sync with `<StellarAppKitProvider>` automatically.

## Vue

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { provideStellarAppKit, StellarAppKitModal } from '@saganta/stellar-appkit-ui-web/vue';
  import { createFreighterConnector } from '@saganta/stellar-appkit';
  import '@saganta/stellar-appkit-ui-web';

  provideStellarAppKit({
    network: 'TESTNET',
    connectors: [createFreighterConnector()],
    appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
  });

  const modal = ref<InstanceType<typeof StellarAppKitModal>>();

  function open() {
    modal.value?.open();
  }
</script>

<template>
  <StellarAppKitModal
    ref="modal"
    mode="auto"
    theme="dark"
    @connect="(session) => console.log('connected', session.address)"
    @disconnect="({ walletId }) => console.log('disconnected', walletId)"
    @error="(err) => console.error('modal error', err)"
  />
  <button @click="open">Connect wallet</button>
</template>
```

The component uses `defineComponent` with `expose()` for the imperative handle. Events are forwarded as Vue emits (`@connect`, `@disconnect`, `@error`), so you can listen to them with standard `@event-name` syntax in templates. The client is read from the same `APPKIT_INJECTION_KEY` as the composables — set via `provideStellarAppKit()` or `app.use(StellarAppKitPlugin, ...)`.

## Solid

```tsx
import {
  StellarAppKitProvider,
  StellarAppKitModal,
} from '@saganta/stellar-appkit-ui-web/solid';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit-ui-web/solid';
import { createFreighterConnector } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';

function ModalHost() {
  let handle: StellarAppKitModalHandle | undefined;
  return (
    <>
      <StellarAppKitModal
        ref={(h) => (handle = h)}
        mode="auto"
        theme="dark"
        onConnect={(session) => console.log('connected', session.address)}
        onDisconnect={({ walletId }) => console.log('disconnected', walletId)}
        onError={(err) => console.error('modal error', err)}
      />
      <button onClick={() => handle?.open()}>Connect wallet</button>
    </>
  );
}

export function App() {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      connectors: [createFreighterConnector()],
      appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
    }}>
      <ModalHost />
    </StellarAppKitProvider>
  );
}
```

Solid doesn't have `forwardRef` — instead, the component takes a `ref` **callback prop** that's called with the imperative handle once the host element mounts. This is the idiomatic Solid pattern for exposing imperative APIs.

## Svelte

Svelte uses a `use:stellarmodal` **action** on the raw `<saganta-appkit-modal>` element, rather than a wrapper component. This is the idiomatic Svelte pattern for wrapping a Web Component — Svelte already renders unknown lowercase tags (like `<saganta-appkit-modal>`) as-is, so a wrapper component would just add indirection without buying anything.

```svelte
<script lang="ts">
  import {
    setStellarAppKitContext,
    stellarmodal,
    openModal,
    closeModal,
    isStellarAppKitModal,
  } from '@saganta/stellar-appkit-ui-web/svelte';
  import { createFreighterConnector } from '@saganta/stellar-appkit';
  import '@saganta/stellar-appkit-ui-web';

  setStellarAppKitContext({
    network: 'TESTNET',
    connectors: [createFreighterConnector()],
    appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
  });

  let modalEl: HTMLElement;

  function open() {
    openModal(modalEl);
  }

  function handleConnect(e: CustomEvent) {
    console.log('connected', e.detail.address);
  }
</script>

<saganta-appkit-modal
  use:stellarmodal
  bind:this={modalEl}
  mode="auto"
  theme="dark"
  on:sc-connect={handleConnect}
  on:sc-disconnect={(e) => console.log('disconnected', e.detail.walletId)}
  on:sc-error={(e) => console.error('modal error', e.detail)}
/>
<button on:click={open}>Connect wallet</button>
```

The `use:stellarmodal` action:

1. Reads the `StellarAppKit` client from the module-level singleton (set via `setStellarAppKitContext()`).
2. Sets `element.client = client` — the Web Component's `client` setter wires up its internal event listeners, the preview handler, and the initial render.
3. Returns a `destroy()` callback that nulls the client reference (for cleanup when the element unmounts).

Because the action wraps the raw element, events are listened to with Svelte's standard `on:sc-connect` / `on:sc-disconnect` / `on:sc-error` syntax — no translation layer.

## Shared props

All four wrappers accept the same prop shape (defined in `src/ui-web/modal-props.ts`):

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'auto' \| 'modal' \| 'bottomsheet' \| 'inline'` | `'auto'` | Presentation mode — auto picks modal on desktop, bottom-sheet on mobile |
| `theme` | `'dark' \| 'light'` | `'dark'` | Built-in theme — override individual tokens via CSS custom properties |
| `branding` | `'default' \| 'minimal' \| 'hidden'` | `'default'` | Branding mode for the wallet list view |
| `logoSrc` | `string` | — | URL to a custom logo image |
| `title` | `string` | `'Connect a wallet'` | Title shown at the top of the modal |
| `autoRetryNetwork` | `boolean` | `false` | Auto-poll the wallet's network after a `NetworkMismatchError` |
| `stellarExpertAvatars` | `boolean` | `false` | Fetch avatar images from Stellar Expert for connected accounts |
| `animation` | `'none' \| 'fade' \| 'scale' \| 'scale-blur' \| 'slide-up' \| 'slide-left' \| 'implode'` | mode-based | Animation preset for both open and close. Default: `scale-blur` for modal, `slide-up` for bottom-sheet. |
| `animationOpen` | same as `animation` | inherits `animation` | Override for the open transition only |
| `animationClose` | same as `animation` | inherits `animation` | Override for the close transition only |

### Animation config priority

When multiple animation configs are present, they resolve in this order (highest → lowest):

1. `animationOpen` / `animationClose` props (per-direction override)
2. `animation` prop (single preset for both directions)
3. `StellarAppKit` config: `modal.animation` (programmatic, set at construction time)
4. Mode-based defaults: `scale-blur` for modal / desktop `auto`, `slide-up` for bottomsheet / mobile `auto`

All animations are zero-dependency WAAPI (Web Animations API) and respect `prefers-reduced-motion: reduce` automatically. See [Modal](/ui/modal/) for the full list of animation presets and their visual effect.

## Events

All four wrappers forward the same three events fired by the underlying Web Component:

| Event | Payload | Description |
|---|---|---|
| `connect` | `ConnectSession` | Fired when a wallet connects (mirrors the client's `connect` event) |
| `disconnect` | `{ walletId: string }` | Fired when a wallet disconnects |
| `error` | `ConnectError` | Fired on client errors (rejected, network mismatch, etc.) |

**Per-framework event syntax:**

| Framework | Syntax |
|---|---|
| React | `onConnect={...}`, `onDisconnect={...}`, `onError={...}` (callback props) |
| Solid | `onConnect={...}`, `onDisconnect={...}`, `onError={...}` (callback props) |
| Vue | `@connect="..."`, `@disconnect="..."`, `@error="..."` (template emits) |
| Svelte | `on:sc-connect={...}`, `on:sc-disconnect={...}`, `on:sc-error={...}` (on the raw `<saganta-appkit-modal>` element) |

## Imperative handle

React, Solid, and Vue expose an imperative handle via `ref`:

```ts
interface StellarAppKitModalHandle {
  /** Open the modal. No-op in inline mode. */
  open(): Promise<void>;
  /** Close the modal. No-op in inline mode. Pass true to skip the WAAPI exit animation. */
  close(skipAnimation?: boolean): void;
  /** The underlying Web Component DOM node — escape hatch for advanced use. */
  readonly element: HTMLElement & { client: StellarAppKit | null };
}
```

Svelte uses standalone helper functions instead (since the `use:stellarmodal` action wraps the raw element directly, and Svelte's `bind:this` already gives you the DOM node):

```ts
import { openModal, closeModal, isStellarAppKitModal } from '@saganta/stellar-appkit-ui-web/svelte';

await openModal(modalEl);
closeModal(modalEl);

if (isStellarAppKitModal(someNode)) {
  // someNode is narrowed to HTMLElement & { client, open(), close() }
}
```

## Theming

The modal is themed via CSS custom properties on the host element — this works identically whether you use the framework component or the raw Web Component. See [Theming](/core/theming/) for the full token list.

React/Solid inline style:

```tsx
<StellarAppKitModal
  style={{
    '--sak-color-bg': '#0B0D0E',
    '--sak-color-accent': '#6EE7B7',
  } as React.CSSProperties}
/>
```

Vue inline style:

```vue
<StellarAppKitModal :style="{ '--sak-color-bg': '#0B0D0E', '--sak-color-accent': '#6EE7B7' }" />
```

Svelte (on the raw element):

```svelte
<saganta-appkit-modal use:stellarmodal style="--sak-color-bg: #0B0D0E; --sak-color-accent: #6EE7B7;" />
```

## SSR safety

The framework modal components are fully SSR-safe — they don't touch `window`, `document`, or `HTMLElement` at module load time. The custom element tag (`<saganta-appkit-modal>`) is rendered as-is during SSR, then hydrated on the client when `@saganta/stellar-appkit-ui-web` is imported.

If you're using Next.js, Astro, Nuxt, or SvelteKit, the modal component can be rendered in your root layout without any special handling. Just make sure the `import '@saganta/stellar-appkit-ui-web'` is in a client-side entry point (or a component that's only rendered on the client).

## Without a provider

If you want to use the modal without the framework provider (e.g. you already have a `StellarAppKit` instance from elsewhere), use the raw `<saganta-appkit-modal>` Web Component directly:

```ts
import '@saganta/stellar-appkit-ui-web';

const modal = document.querySelector('saganta-appkit-modal')!;
modal.client = appkit; // wire up the client manually
await modal.open();
```

The framework components are designed for the provider-based workflow. The raw element is the escape hatch.

## API reference

```ts
// React / Solid / Vue
import { StellarAppKitModal } from '@saganta/stellar-appkit-ui-web/react';
import { StellarAppKitModal } from '@saganta/stellar-appkit-ui-web/solid';
import { StellarAppKitModal } from '@saganta/stellar-appkit-ui-web/vue';

// Svelte (action + helpers)
import {
  stellarmodal,
  openModal,
  closeModal,
  isStellarAppKitModal,
} from '@saganta/stellar-appkit-ui-web/svelte';

// Shared types (from any wrapper)
import type {
  StellarAppKitModalProps,
  StellarAppKitModalHandle,
  StellarAppKitModalEvents,
} from '@saganta/stellar-appkit-ui-web/react'; // or /vue, /solid, /svelte
```
