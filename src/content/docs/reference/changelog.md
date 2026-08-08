---
title: Changelog
description: Release history for Stellar AppKit.
---

## v1.6.0

### Breaking changes (SIWS config expansion)
- **`verify` now returns `SiwsSession | null | undefined`** instead of `boolean`. The returned session is validated (address + network + expiry) before being accepted.
- **`session` callback added** — called immediately after wallet connect to check for an existing valid session. If the session's address + network match the connected wallet and it's not expired, sign-in is skipped entirely.
- **`signout` callback added** — logs the user out from the server. Called before wallet disconnect when `signoutOnDisconnect` is `true` (default).
- **`signoutOnDisconnect` option added** — when `true` (default), calls `signout()` before disconnecting the wallet. When `false`, the server session stays alive.

### New features
- **`SiwsSession` type** — `{ network, address, expiry, metadata? }`. Stored on the client via `appkit.siwsSession` (getter with auto-expiry check).
- **`appkit.siwsSession`** — getter that returns the current SIWS session, or `null` if not authenticated or expired.
- **`appkit.setSiwsSession(session)`** — setter (called internally by the modal after successful verify).
- **`appkit.clearSiwsSession()`** — clears the local session + calls `signout()` if configured. Called automatically on wallet disconnect.
- **Session validation** — after `verify()` returns a session, the SDK validates that `address` matches the connected wallet, `network` matches, and `expiry` is in the future. If any check fails, the user sees a specific error message.
- **Session skip** — if `session()` returns a valid session matching the connected wallet, the entire nonce → sign → verify flow is skipped.

### Security improvements (suggested)
- **Address binding**: the returned session's `address` must match the connected wallet's address — prevents session hijacking between wallets.
- **Network binding**: the session's `network` must match the connected wallet's network — prevents testnet/mainnet confusion.
- **Expiry check**: sessions past their `expiry` timestamp are treated as expired — the `siwsSession` getter auto-clears expired sessions.
- **Signout on disconnect**: `signoutOnDisconnect: true` (default) ensures the server session is invalidated when the user disconnects their wallet — prevents orphaned server sessions.

All 155 tests pass.

---

## v1.5.0

### Breaking changes
- **`appMetadata` now follows the WalletConnect/Reown metadata standard.** Changed from `{ name, domain?, uri? }` to `{ name, description?, url?, icons? }`. The same object is:
  - Fed directly to WalletConnect as its `metadata` (no need for separate WC `metadata` option)
  - Used for SIWS: `domain` is derived from `url` (strip protocol+path), `uri` = `url`
  - Used for the modal's transaction preview app icon (`icons[0]`)

  ```ts
  const appkit = new StellarAppKit({
    network: 'TESTNET',
    appMetadata: {
      name: 'My App',
      description: 'A Stellar dApp',
      url: 'https://saganta.com',
      icons: ['https://saganta.com/icon.png'],
    },
  });
  ```

  Only `name` is required. When `url` is omitted, derived from `window.location.origin` (browser). The `StellarAppKit` constructor injects the normalized `appMetadata` into WalletConnect connectors via `_setAppMetadata()`.

All 155 tests pass.

---

## v1.4.2

### Documentation
- README, SKILL.md, llms.txt, ARCHITECTURE.md all updated for v1.2.5–v1.4.1 features:
  - Automatic SIWS authentication flow (`siws` config with `statement`, `nonce`, `verify`, `disconnectOnFail`)
  - `disconnectOnFail` behavior (deferred disconnect to modal close, not immediate)
  - xBull web wallet fallback (always `'available'`)
  - WalletConnect `metadata` + `networkPassphrase` optional
  - Wallet tile icons as CSS `background-image` (no flash)
  - Outline "Installed" badge (border + muted text + accent dot)
  - Bottomsheet drag fixed (`touch-action: none`)
  - `max-width: 100vw` on overlay/panel
  - Albedo logo (sea blue "A")
  - Freighter/xBull/Hana/WalletConnect/Ledger icons as base64 data URIs
- ARCHITECTURE.md: new sections §8.16 (SIWS flow), §8.17 (xBull web wallet), §8.18 (WC metadata/networkPassphrase optional)

All 155 tests pass.

---

## v1.4.1

### Bug fixes
- **`disconnectOnFail` behavior fixed.** Previously, when SIWS failed, the wallet was disconnected immediately — the user couldn't retry. Now:
  - **`disconnectOnFail: true` (default)**: The wallet stays connected while the user sees the error + "Try again" button. Only when the user **closes the modal** (X button, drag-to-dismiss, Escape, overlay click) and SIWS hasn't succeeded, the wallet is disconnected. This ensures the auth flow was completed before the wallet session is kept.
  - **`disconnectOnFail: false`**: The wallet is never disconnected, even if SIWS fails and the user closes the modal. The wallet stays connected without auth.

All 155 tests pass.

---

## v1.4.0

### New features
- **Automatic SIWS authentication flow.** Added `siws?: SiwsConfig` to the `StellarAppKit` config. When set, the modal automatically triggers a Sign-In With Stellar flow immediately after the wallet connects — without closing the wallet UI. The flow:
  1. Show "Fetching nonce…" → calls `siwsConfig.nonce()`
  2. Show "Approve the sign-in request in [Wallet]" → calls `signIn()` (wallet prompts)
  3. Show "Verifying your signature…" → calls `siwsConfig.verify(result, nonce)`
  4. If `verify` returns `true` → connected view (success)
  5. If any step fails → extracts error message from any error type (Error, string, object with `message` property), shows SIWS error view with the message + "Try again" button, and if `disconnectOnFail` is `true` (default), disconnects the wallet entirely.

  ```ts
  const appkit = new StellarAppKit({
    network: 'TESTNET',
    siws: {
      statement: 'Sign in to My App',
      disconnectOnFail: true, // default
      nonce: async () => {
        const res = await fetch('/api/siws/nonce');
        return res.text();
      },
      verify: async (data, nonce) => {
        const res = await fetch('/api/siws/verify', {
          method: 'POST',
          body: JSON.stringify({ ...data, nonce }),
        });
        return res.ok;
      },
    },
  });
  ```

- **Error message extraction.** Errors from any step (nonce fetch, sign, verify) are extracted from any error type — `Error.message`, `ConnectError.message`, plain strings, objects with `message` or `reason` properties — so the user always sees a meaningful message in the SIWS error view.

- **Haptic feedback on SIWS success/failure** (Android, no-op on iOS Safari).

All 155 tests pass.

---

## v1.3.0

### Breaking changes (WalletConnect API simplification)
- **`metadata` is now optional** on `createWalletConnectConnector()`. When omitted, derived from `window.location` (browser): `name` from hostname, `url` from origin. When provided, follows the Reown/WalletConnect metadata style. This means you can now write:
  ```ts
  createWalletConnectConnector({ projectId: '...' })
  ```
  instead of being forced to pass `metadata: { name, description, url, icons }`.
- **`networkPassphrase` is now optional** on `createWalletConnectConnector()`. When omitted, derived from the `StellarAppKit` config's `network` field via the `Networks` map (e.g. `'TESTNET'` → `Networks.TESTNET`). The `StellarAppKit` constructor injects the network into the WC connector via `_setNetwork()`.

### Changes
- **xBull always available** — `getReachability()` now returns `'available'` even when the extension isn't detected, because the xBull SDK bridge falls back to the xBull web wallet (`https://wallet.xbull.app`) automatically. Previously returned `'not-installed'`, which showed an "Install" button instead of letting the user connect via the web wallet.

All 155 tests pass.

---

## v1.2.5

### Changes
- **Wallet tile icons now fill the tile** — changed `background-size` from `28px 28px` to `cover` so the icon fills the tile edge-to-edge, matching the parent's `border-radius: 10px` + `overflow: hidden`.
- **Bottomsheet drag fixed** — changed `touch-action` from `pan-y` to `none` on the panel. `pan-y` allowed the browser to intercept vertical touches for page scrolling, which stole the pointer events from the drag handler. `none` forces the browser to hand all touch events to the panel's pointer handlers, so the drag follows the finger exactly.
- **Albedo logo created** — stylized "A" on a sea blue (`#0066B2`) background. Updated in both the connector's `meta.icon` and the modal's `walletIcons` fallback.

### Demos site
- **Nav title is now "Stellar AppKit" only** — removed the "Demos" suffix
- **Removed the "Demos" nav link** — the brand logo already links to home

All 155 tests pass.

---

## v1.2.4

### Changes
- **Freighter icon updated** with official brand PNG (128×128, base64-encoded). Updated in both the connector's `meta.icon` (was a remote URL) and the modal's `walletIcons` fallback map. No external request — loads instantly.

All 155 tests pass.

---

## v1.2.3

### Changes
- **xBull and Hana icons updated** with official brand PNGs (128×128, base64-encoded). Both the connector `meta.icon` (xBull) and the modal's `walletIcons` fallback map are updated. No external URL — loads instantly.
- **Modal/bottomsheet max-width capped at `100vw`** — uses `min(380px, 100vw)` for modal and `min(560px, 100vw)` for bottomsheet. Also added `max-width: 100vw` and `overflow-x: clip` to the overlay. This prevents the modal from overflowing horizontally when the host page has bad CSS that causes x-axis overflow.

All 155 tests pass.

---

## v1.2.2

### Changes
- **Animation code reverted to v1.1.2 approach** — WAAPI is the primary animation mechanism (smoother, supports custom presets like implode/slide-left). CSS `data-open` transitions are a **fallback** for mobile where WAAPI doesn't fire reliably. `data-open="true"` is set immediately after `render()` so the CSS transition fires in parallel with WAAPI — if WAAPI succeeds, it overrides the CSS; if WAAPI fails (mobile), the CSS transition ensures the panel is visible.
- **Wallet list icons moved from `<img>` to CSS `background-image`** — the `.wallet-tile` span now uses `style="background-image: url(...)"` instead of an `<img>` child element. This eliminates the image flash entirely: the browser caches the decoded background image in the CSS layer, so re-renders (which update the body content via targeted DOM updates) don't destroy/recreate any image elements.

### Demos site
- **Removed "Examples" from the top bar** — renamed to "Demos"
- **Added `overflow-x: hidden` to body** — prevents horizontal scroll on mobile

All 155 tests pass.

---

## v1.2.1

### Bug fixes
- **Mobile bottom-sheet now opens reliably.** Root cause: `data-open` was set to `"false"` during `render()` and was never updated to `"true"` — the WAAPI animation was supposed to handle the visual transition, but on mobile WAAPI doesn't fire reliably, so the panel stayed at `translateY(100%)` (off-screen) forever. Fix: set `data-open="true"` immediately after `render()` — the CSS transition (`data-open="true"` → `translateY(0)`) is the **primary animation mechanism**, reliable on all browsers. WAAPI is now a progressive enhancement only for custom presets (`animation="implode"` etc.).
- **Close animation also uses CSS transitions.** `close()` sets `data-open="false"` to trigger the CSS exit transition, waits 350ms, then cleans up. No WAAPI needed for default animations.
- **Installed badge colors fixed.** Now matches the outline spec exactly: `--sak-color-border` for border, `--sak-color-text-muted` for text, `--sak-color-accent` only for the dot. No `color-mix` — plain theme tokens.

All 155 tests pass.

---

## v1.2.0

### UI redesign
- **"Installed" badge redesigned** — replaced the flat green pill with an **outline badge** using the theme's accent color. The new badge uses:
  - `color-mix(in srgb, accent 32%, transparent)` for the border — a subtle accent-tinted outline
  - `color-mix(in srgb, accent 60%, text 40%)` for the text — mixed with the theme's text token for contrast on both light and dark surfaces (no separate light-mode override needed)
  - A static accent-colored dot (`::before` pseudo-element) — quiet, no pulse animation
  - `var(--sak-radius-sm)` for the border radius — uses the modal's own design token for badges/pills
  - Monospace font, uppercase, 10.5px — precise, technical aesthetic
  - Transparent background — blends with whatever surface it's on

### Bug fixes
- **Mobile modal not opening** — fixed the root cause: `scale-blur` (the default desktop animation) uses `filter: blur(12px)` which is a known source of skipped/dropped animations on mobile GPUs. The `onfinish` callback may not fire, leaving the panel at `opacity: 0` (invisible). Now uses mode-aware animation defaults:
  - Desktop modal → `scale-blur` (blur is safe, GPU has headroom)
  - Mobile bottomsheet → `slide-up` (transform-only, GPU-composited, reliable)
  - Mobile forced to modal → `scale` (no blur, GPU-safe)
  - The viewport check uses `window.matchMedia()` re-evaluated on every call (not cached)
- **WAAPI safety timeout** reduced from 600ms to 400ms (animations are 300ms, so 400ms gives 100ms of grace)

### New features
- **Velocity-aware bottom-sheet dismiss** — lowered the flick threshold from 0.5 to 0.4 px/ms so a quick flick dismisses even from a short drag. Distance threshold (40% of sheet height) remains as the fallback for slow drags. Feels dramatically more native than distance-only.
- **Haptic feedback** (Android only, no-op on iOS Safari):
  - `navigator.vibrate(15)` on successful wallet connection
  - `navigator.vibrate([30, 50, 30])` on error (double-buzz pattern signals failure)
  - `navigator.vibrate(10)` on bottom-sheet drag-to-dismiss

All 155 tests pass.

---

## v1.1.2

### Bug fixes
- **Image flash on modal open fixed.** The `render()` method was replacing the entire `innerHTML` on every state change (wallet list loading, connect events, etc.), which destroyed and recreated all `<img>` elements — causing the browser to re-decode base64 data URIs each time (visible as a flash). Now uses **targeted DOM updates**: only the `.body` content and header are replaced when they change, preserving the panel shell and all `<img>` elements in the DOM. The browser keeps the decoded images in memory, so re-renders are instant.
- **Modal not opening on mobile (Chrome mobile) fixed.** The `computeEffectiveMode()` method was using a cached `mediaQuery` that could be stale on mobile browsers (especially after orientation changes or address bar show/hide). Now re-evaluates `window.matchMedia()` on every call to ensure the current viewport state is used. Also added a fallback to `window.innerWidth` if `matchMedia` is not available.
- **WAAPI animation safety fallback.** Added a 600ms timeout that force-clears `panel.style.opacity` if the WAAPI animation's `onfinish` doesn't fire — fixes a mobile issue where the panel stays invisible because some Android browsers don't reliably fire `onfinish`.
- **Panel `max-height` uses `dvh`** (dynamic viewport height) on browsers that support it — fixes the panel being cut off by the mobile address bar. Falls back to `vh` on older browsers.

### Changes
- **Ledger icon updated** with the new official brand SVG (white background + black "L" logo).

All 155 tests pass.

---

## v1.1.1

### Changes
- **WalletConnect icon replaced** with the official brand SVG (blue rounded square with the WC logo). Pre-encoded as base64 in both the connector's `meta.icon` and the modal's `walletIcons` fallback — loads instantly with no network request.
- **Ledger icon replaced** with the official brand SVG (Ledger "L" logo). Same pre-encoded base64 approach — no external dependency.
- **"Installed" badge background** changed from solid `#d1fae5` to alpha-transparent `rgba(209, 250, 229, 0.85)` so it blends naturally with the row's surface color in both light and dark themes. Border also changed to `rgba(167, 243, 208, 0.85)`.

All 155 tests pass.

---

## v1.1.0

### Bug fixes
- **WalletConnect socket retry loop fixed.** When the WC relay returned a fatal error (e.g. "Project not found" with code 3000 for an invalid `projectId`), the WC SDK's auto-reconnect logic kept retrying the WebSocket connection forever, flooding the console with "Fatal socket error" logs. The connector now:
  - Listens for `relayer_error` events on `client.core.relayer.events` (the actual EventEmitter the WC SDK uses, not the SignClient itself)
  - Detects fatal error codes (3000, 3001, 3002, 3003) and fatal message patterns ("Project not found", "Invalid project id", etc.)
  - Calls `relayer.transportClose()` to set `transportExplicitlyClosed=true` and stop the retry loop
  - Removes event listeners before teardown to prevent re-entry
  - Tears down the client (`client.abort()`) to fully close the WebSocket

- **60-second timeout added to WC connect().** If the relay is unreachable or the `projectId` is invalid, `connect()` now rejects within ~2 seconds (fatal error detected) or 60 seconds (timeout) — previously it hung forever.

- **Abort promise races against `wc.connect()` AND `approval()`.** The `wc.connect()` call itself can hang when the relay is down (it awaits `relayer.publish()` which never resolves). The abort promise is now created BEFORE `wc.connect()` and races against it, so the user sees the error within seconds instead of hanging.

### New features
- **Clear error messages.** When a fatal relay error occurs, the connector throws a `ConnectError` with the message: `"WalletConnect relay error: WebSocket connection closed abnormally with code: 3000 (Project not found). Check your projectId at cloud.walletconnect.com."` — the user sees this in the modal's error view with a retry button.

All 155 tests pass.

---

## v1.0.9

### New features
- **`Networks` object exported from core.** Apps no longer need to import `@stellar/stellar-sdk` just for `Networks.TESTNET` — `import { Networks } from '@saganta/stellar-appkit'` now works. Includes `PUBLIC`, `TESTNET`, `FUTURENET`, and `STANDALONE` passphrases, verified byte-for-byte against `@stellar/stellar-sdk`. Also exports `resolveNetworkPassphrase(network)` helper.
- **WalletConnect QR code rendered automatically by the modal using `better-qr`.** The modal now renders the WC pairing URI as an inline SVG QR code (no external API calls, no network dependency, works offline). The `onUri` callback is now **optional** — when using `<stellar-appkit-modal>`, you can omit it entirely and the modal handles QR rendering, deep linking, and copy-to-clipboard.
- **`better-qr` added as a bundled dependency** of `@saganta/stellar-appkit-ui-web` — installed automatically, lazy-imported only when WC is used, tree-shaken out otherwise.

### Bug fixes
- **WalletConnect `SignClient` import fixed** (v1.0.8). `@walletconnect/sign-client` v2 exports `SignClient` as a named export (`mod.SignClient`), not as the default export. The old code used `mod.default` (a plain object), which threw `"SignClient.init is not a function"`. Now uses `mod.SignClient ?? mod.default` with a runtime check.

### Documentation
- Changelog updated for v1.0.4 through v1.0.9 (was stale at v1.0.3).

All 155 tests pass.

---

## v1.0.8

### Bug fixes
- **WalletConnect `SignClient` import was using the wrong export.** `@walletconnect/sign-client` v2 exports `SignClient` as a named export (`mod.SignClient`), NOT as the default export. The old code used `mod.default` (a plain object), which threw `"SignClient.init is not a function"` — the connector never reached URI generation, so no QR code could ever appear. Fixed to use `mod.SignClient ?? mod.default` with a runtime check.

---

## v1.0.7

### New features
- **WalletConnect QR rendering inside the modal.** Added `setOnUri(fn)` method to the WC connector — the modal calls this before `connect()` to intercept the pairing URI and render a QR code in the connecting view. Previously, the modal showed a generic "Continue in WalletConnect" spinner with no QR code.
- **Copy URI button** in the WC connecting view — for manual QR generation or debugging.
- **Deep link button** for mobile users — opens the wallet app directly.

### Bug fixes
- **WC connector `onUri` now late-bound.** The connector uses a mutable `onUriHandler` instead of the closure-captured `opts.onUri`, so the modal can overwrite it at runtime.

---

## v1.0.6

### New features
- **Auto-derive `appMetadata.domain` + `uri` from `window.location`.** The `appMetadata` config now accepts just `{ name }` — `domain` and `uri` are optional and auto-derived from `window.location.hostname` and `window.location.origin` in the browser. Auto-formatted if passed explicitly: `"https://example.com"` as domain → `"example.com"`; `"example.com"` as uri → `"https://example.com"`. In SSR (no `window`), pass them explicitly.
- **`normalizeAppMetadata()` exported** — normalize user input before passing to `StellarAppKit` (useful in server contexts).

### Bug fixes
- `signIn()` throws a clear error if `domain`/`uri` are missing (SSR case), pointing the user to pass them explicitly.

---

## v1.0.5

### New features
- **Theme Builder page** on the docs site (`/ui/theme-builder/`) — interactive visual theme editor with 5 presets, color pickers for 6 tokens, radius + font inputs, live preview, and copy-to-clipboard CSS snippet.
- **Animations docs page** (`/ui/animations/`) — full WAAPI reference: presets table, defaults, config priority, `prefers-reduced-motion`, interruption handling, drag-to-dismiss coexistence.
- **Animation Presets demo** (`/demos/animations`) — focused demo with separate open/close animation selectors, mode picker, and preset reference table.

### Changes
- **"Installed" badge restyled** — removed the `::before` dot, switched to a fixed green-200 palette (`#d1fae5` bg, `#047857` text, `#a7f3d0` border) so the "ready to use" signal is consistent across light and dark themes.

---

## v1.0.4

### Breaking changes
- **Custom element renamed:** `<saganta-appkit-modal>` → `<stellar-appkit-modal>`. All source files, docs, examples, and framework wrappers updated.

### Changes
- **GitHub URL casing fixed:** `SagantaHQ` → `sagantaHQ` everywhere.
- **Package.json fields added** to all 3 packages + root: `repository`, `homepage` (`https://stellar-appkit.saganta.com`), `bugs`.
- **Removed `@use-gesture/vanilla` + `motion` from `peerDependencies`** (leftover from v1.0.1 — they were removed from the code but the peer dep entries were left behind).

### New features
- **WalletConnect + Hana wallet documentation** added to README, SKILL.md, llms.txt, and docs site (new `wallets/hana.md` page, rewrote `wallets/walletconnect.md`).

---

## v1.0.3

### Bug fixes
- **Bottom-sheet drag-to-dismiss now properly closes the overlay.** Previously, when the user dragged the sheet down past the threshold, the spring animated the panel off-screen but `close()` then re-ran the WAAPI exit animation, causing a visible jump back to `translateY(0)` before sliding down. The spring now calls `close(skipAnimation=true)` to skip the WAAPI exit since the panel is already off-screen.
- **Close (X) button now works in bottom-sheet mode.** The drag gesture handler's `panel.setPointerCapture()` was stealing the `pointerup` event from child buttons, so the `click` event never fired on the close button. `onPointerDown` now checks if the target is a button, link, or `[data-action]` element and skips drag setup entirely for those.
- **Modal default animations no longer flash.** The initial-state gap between `render()` and the WAAPI animation start is eliminated by setting `panel.style.opacity='0'` before the animation kicks in.

### New features
- **Zero-config default connectors.** `StellarAppKitConfig.connectors` is now optional. If omitted (or empty), the SDK auto-registers Freighter, Albedo, xBull, and Ledger via the new `defaultConnectors()` export. WalletConnect is excluded from defaults because it requires a `projectId`.
- **"Installed" badge on wallet list.** Available wallets now show an accent-colored pill labeled "Installed", making it instantly clear which wallets are ready to use vs. which need installation.
- **Programmatic animation config.** New `StellarAppKitModalConfig` type in core (`modal.animation` field) — set the animation globally at construction time. HTML attributes still take priority, then config, then mode-based default.
- **`close(skipAnimation?: boolean)`** — new optional parameter to bypass the WAAPI exit animation. Used internally by drag-to-dismiss; also useful for programmatic closes that should be instant.

### Documentation
- README.md: updated Quick Start (zero-config), Features (WAAPI, drag, Installed badge), Modal attributes table (added animation, animation-open, animation-close, explorer-url), new sections for Default connectors and Installed badge.
- ARCHITECTURE.md: new sections 8.10 (WAAPI engine), 8.11 (default connectors), 8.12 (Installed badge).
- SKILL.md, llms.txt: updated for zero-config defaults, animation props, Available connectors (Default? column).

All 155 tests pass.

---

## v1.0.2

### New features
- **WAAPI animation engine** — zero-dependency open/close transitions using native Web Animations API. 7 presets: `none`, `fade`, `scale`, `scale-blur` (default modal), `slide-up` (default bottom-sheet), `slide-left`, `implode`. Configurable via `animation`, `animation-open`, `animation-close` HTML attributes. `prefers-reduced-motion` respected automatically. SSR-safe.

---

## v1.0.1

### Bug fixes
- Error event fires BEFORE signQueueChange (via `.catch(emit error) → .finally(decrement queue)` chain in `enqueueSign()`) — signing view stays open on error with retry/cancel buttons.
- SSR safety: `class SagantaAppKitModal extends (typeof HTMLElement !== 'undefined' ? HTMLElement : class {})` — allows static `import '@saganta/stellar-appkit-ui-web'` in client components.

### Changes
- Package split: `@saganta/stellar-appkit` (core, no UI) + `@saganta/stellar-appkit-ui-web` (modal + framework wrappers) + `@saganta/stellar-appkit-siws-verify`.
- Zero-dependency spring physics: replaced `@use-gesture/vanilla` + `motion` with a custom 30-line spring engine built on native Pointer Events + `requestAnimationFrame`.

---

## v1.0.0

### Framework wrappers (React, Vue, Solid, Svelte)
- Subpath exports: `/react`, `/vue`, `/solid`, `/svelte`
- Shared hook surface: `useAppKit`, `useConnect`, `useSession`, `useSignTransaction`, `useSignMessage`, `useSignIn`, `useSoroban`, `usePreviewTransaction`, `usePreviewAuthEntry`
- Tree-shakable — each wrapper is a separate entry point

### Soroban contract layer
- Typed contract client (`ContractClient<T>` from `stellar contract bindings`)
- RPC failover (`FailoverRpcServer` with health tracking + cooldown)
- Contract verification badges (`PreviewOptions.contractMetadata` → `ContractBadge[]`)
- Pre-simulate fee estimation (`FeeEstimate` on `previewInvoke()` + `estimateFee()`)
- Auth-entry signing (via `authorizeEntry()` — closes the last stub)

### SIWS
- SEP-0053 message encoding for Freighter (`sha256("Stellar Signed Message:\n" + message)`)
- Multi-candidate verification (8 candidates: utf8, sha256, sha512, domain-prefixed, CRLF)
- Debug mode with diagnostics dump
- `signedData` field on `SignMessageResult` / `SignInResult` / `SiwsPayload`

### UI
- Wallet-provided avatars (`getAvatar()`) + deterministic gradient fallback + Stellar Expert avatars
- Copy-to-clipboard on all address displays
- Contract verification badges + fee estimate in transaction preview
- Conic-gradient spinner (no wobble)
- Draggable bottom-sheet with spring physics
- Bundled wallet brand icons (base64 data URIs)

### Wallets
- WalletConnect v2 relay adapter (QR pairing, `stellar_signXDR`, `stellar_signMessage`)
- xBull extension detection polling (5s timeout, multiple injection points)
- xBull "wallet not set up" friendly error
- Albedo connection timeout (60s — popup can be closed)
- Error normalization for plain-object errors (xBull)

### Other
- MIT license (changed from GPLv3)
- Astro Starlight documentation site
