---
title: Changelog
description: Release history for Stellar AppKit.
---

## v1.8.2

### Bug fixes
- **Close button (X icon) now plays the exit animation** — previously, clicking the X close button could close the modal without playing the WAAPI exit animation. The root cause was the CSS `transition: transform 320ms` on the panel fighting the WAAPI animation when `data-open` flipped to `false`. Fixed by setting `panel.style.transition = 'none'` before playing the WAAPI exit animation, then restoring it in `finishClose()`. The same fix is applied to the `open()` method for the enter animation.
- **Bottomsheet drag handle now works reliably** — the drag-to-dismiss gesture was binding `pointerdown` on the entire panel, which could interfere with scrolling inside the body content. Fixed by restricting drag initiation to the drag handle, header, footer, and full-screen loading/error views only. The body content (wallet list, transaction preview, etc.) now scrolls normally without triggering the drag gesture.
- **Drag handle grab area enlarged** — the visible drag handle is 36×5px, but the grab area is now ~25px tall (10px transparent padding above + 5px handle + 10px padding below) so it's easier to grab on touch devices.

### Documentation
- **Root README** — added a bold, visible "Official Docs · Official Demos" links table at the top with npm and GitHub links. Previously the docs/demos links were buried deep in the README.
- **Per-package READMEs** — created proper README.md files for `@saganta/stellar-appkit-ui-web` and `@saganta/stellar-appkit-siws-verify` (they previously had no README, so npm showed no README for those packages). Updated the core package README with the correct v1.5.0 appMetadata shape. All three READMEs include the bold Official Docs + Official Demos links table, install instructions, quick start, and links to full docs.
- **npm tarball** — added `README.md` to the `files` field in all 3 package.json files so the README is always included in the npm tarball (npm auto-includes it, but being explicit ensures it).

All 307 tests pass.

---

## v1.8.1

### Documentation
- **New docs page: [Internationalization](/core/i18n/)** — covers all 25 supported locales, ICU MessageFormat, the core `setLocale()`/`getLocale()`/`t()`/`onLocaleChange()` API, React/Vue/Solid/Svelte hooks, lazy-loading architecture, RTL languages, and how to add custom locales.
- **Rewrote: [Sign-In With Stellar](/core/siws/)** — was 67 lines, now ~370. Covers everything that was missing:
  - **Automatic SIWS flow** (`SiwsConfig`) — the full `session`/`nonce`/`verify`/`signout`/`refresh` callback shape with code examples
  - **`verify` context parameter** (v1.7.0 breaking change) — third arg `{ address, network }`
  - **`disconnectOnFail`**, **`signoutOnDisconnect`**, **`maxRetries`**, **`timeoutMs`** config knobs
  - **Session persistence** (v1.7.0+) — localStorage + restore on page reload
  - **`SiwsSession` type** — `network`, `address`, `expiry`, `metadata?`
  - **Session lifecycle methods** — `siwsSession` getter (auto-clears expired), `setSiwsSession`, `clearSiwsSession`, `signOut`, `requireAuth`, `validateSession`, `reauthenticate`, `restoreSiwsSession`
  - **React hooks** — `useSiwsSession`, `useIsAuthenticated`
  - **`siwsSessionChange` event**
  - **`SiwsError` + `SiwsErrorType`** — 9 discriminated error types
  - **SIWS view states** — `siws-checking` → `siws-nonce` → `siws-signing` → `siws-verifying` → `siws-error`
  - **Cancel button** + retry limiting + timeouts
  - **Server-side API contract** — the 4 endpoints your backend needs
  - **Security considerations** — address binding, network binding, expiry auto-check, signout-on-disconnect, nonce timeout, single-use nonces, httpOnly cookies
  - **v1.7.2 fix note** — React provider didn't forward `config.siws` to the underlying client before v1.7.2
- **Updated: [Wallet Connection](/core/wallet-connection/)** — added `appMetadata` section documenting the v1.5.0 WalletConnect/Reown metadata standard (`{ name, description?, url?, icons? }`), migration table from the old `{ name, domain?, uri? }` shape, three-purpose explanation (SIWS messages, WC session proposals, modal preview icon). Also added `defaultConnectors()` docs (v1.0.6+), xBull web wallet fallback (v1.3.0+), and the `siwsSessionChange` event (v1.7.0+).
- **Updated: [Quick Start](/getting-started/quick-start/)** — replaced the old `appMetadata.domain`/`appMetadata.uri` auto-derive section with the v1.5.0 WC standard shape.
- **Updated: [API Reference](/reference/api/)** — full rewrite. Now includes `siwsConfig`, `siwsSession` getter, all SIWS lifecycle methods (`setSiwsSession`, `clearSiwsSession`, `signOut`, `requireAuth`, `validateSession`, `reauthenticate`), `StellarAppKitEvents` with `siwsSessionChange`, `SiwsConfig` type with all fields, `SiwsSession` type, `SiwsError` + `SiwsErrorType`, the full i18n API (`setLocale`, `getLocale`, `t`, `onLocaleChange`, `loadLocale`, `preloadLocale`, `getSupportedLocales`, `LocaleCode`), `defaultConnectors()`, and `Networks`. Updated `appMetadata` shape to the WC standard.
- **Updated: [React](/wrappers/react/)** — added `useSiwsSession`, `useIsAuthenticated`, `useLocale`, `useSetLocale` to the hooks table. Added "SIWS session hooks" and "Internationalization hooks" sections with code examples. Fixed old `appMetadata` shape.
- **Updated: [Vue](/wrappers/vue/)** — added the 4 new composables to the table + cross-links to the SIWS and i18n guides. Fixed old `appMetadata` shape.
- **Updated: [Solid](/wrappers/solid/)** — same additions as Vue. Fixed old `appMetadata` shape.
- **Updated: [Svelte](/wrappers/svelte/)** — same additions as Vue. Fixed old `appMetadata` shape.
- **Updated: [Modal Components](/wrappers/modal-components/)** — fixed old `appMetadata` shape in all code examples.
- **Updated: `llms.txt`** — added Internationalization page link, updated SIWS page description to mention the automatic flow + session lifecycle + hooks.
- **Updated: `llms-full.txt`** — rewrote the SIWS section (was 13 lines, now ~100) with the full automatic flow, session lifecycle methods, React hooks, events, and `SiwsError`. Added a new "Internationalization (i18n)" section. Updated the `appMetadata` zero-config description to the v1.5.0 WC standard.
- **Sidebar** — added "Internationalization" entry under Core Concepts.

### Library
- Added `useSiwsSession()`, `useIsAuthenticated()`, `useLocale()`, `useSetLocale()` to the **Vue**, **Solid**, and **Svelte** wrappers (previously only React had them).
- All 307 tests pass.

---

## v1.8.0

### New feature: Internationalization (i18n) — 25 locales with lazy loading

The entire modal UI is now translatable. English is bundled by default; 24 additional locales are lazy-loaded via dynamic `import()` on first use, so the initial bundle stays small.

**Supported locales:** `en` (bundled), `zh-CN`, `zh-TW`, `es`, `pt-BR`, `ja`, `ko`, `de`, `fr`, `ru`, `ar` (RTL), `hi`, `it`, `tr`, `pl`, `vi`, `id`, `uk`, `nl`, `th`, `he` (RTL), `cs`, `sv`, `ro`, `fa` (RTL) — 25 total.

**Usage — set locale at initialization:**
```ts
new StellarAppKit({
  network: 'TESTNET',
  locale: 'zh-CN', // ← modal renders in Simplified Chinese
  ...
});
```

**Usage — change locale at runtime:**
```ts
import { setLocale, getLocale, t, onLocaleChange } from '@saganta/stellar-appkit';

await setLocale('ja'); // lazy-loads the Japanese locale
console.log(getLocale()); // 'ja'
console.log(t('title.connect_wallet')); // 'ウォレットを接続'
```

**Usage — React hooks:**
```tsx
import { useLocale, useSetLocale } from '@saganta/stellar-appkit-ui-web/react';

function LanguageSwitcher() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="zh-CN">简体中文</option>
      <option value="ja">日本語</option>
      ...
    </select>
  );
}
```

**ICU MessageFormat support** — uses [`intl-messageformat`](https://www.npmjs.com/package/intl-messageformat) for interpolation, plurals, and selection:
- `{walletName}` — simple variable interpolation
- `{count, plural, one {# pending signature} other {# pending signatures}}` — pluralization with proper CLDR plural rules per locale (Arabic has 6 forms, Russian has 4, Chinese has 1, etc.)
- `{maxRetries}` — any variable name

**Architecture:**
- `packages/core/src/i18n/` — core i18n module (`t()`, `setLocale()`, `getLocale()`, `onLocaleChange()`, `loadLocale()`, `preloadLocale()`, `getSupportedLocales()`)
- `packages/core/src/i18n/locales/en.ts` — English locale (bundled, `as const` for type safety)
- `packages/core/src/i18n/locales/{24 other codes}.ts` — lazy-loaded locale files, one per language
- `StellarAppKitConfig.locale?: LocaleCode` — config field for initial locale
- `StellarAppKitProviderConfig.locale?: LocaleCode` — React provider config field
- `useLocale()` / `useSetLocale()` — React hooks for reactive locale state
- Modal subscribes to `onLocaleChange()` and re-renders automatically when the locale changes
- `IntlMessageFormat` instances are cached per (key, locale) for performance
- English is statically imported (no flash of untranslated text on first render)
- All other locales use `import()` — the bundler code-splits each into a separate chunk
- Unknown locale codes fall back to English silently (never breaks the app)
- Missing keys in a locale fall back to English, then to the key itself

### Tests
- **New test file: `packages/core/tests/i18n.test.ts`** — 56 tests covering:
  - Default state (English bundled, `t()` returns English, unknown keys return key itself)
  - Interpolation (`{walletName}`, multiple variables, HTML in values)
  - ICU plural syntax (English one/other, Chinese other-only, Russian one/few/many/other, Arabic zero/one/two/few/many/other with Arabic-Indic digit localization)
  - `setLocale()` lazy loading (zh-CN, ja, es, ar, back to en, idempotent, interpolation in non-English, plurals in non-English)
  - `onLocaleChange()` (immediate fire, fire on switch, unsubscribe)
  - `getSupportedLocales()` (returns 24 non-English codes, doesn't include 'en')
  - `preloadLocale()` (loads without switching)
  - Fallback chain (missing key → English → key itself)
  - Unknown locale codes (fall back to English silently)
  - All 24 non-English locales load successfully and translate `title.connect_wallet`
- **Updated `packages/ui-web/tests/siws-flow.test.ts`** — source-level tests now check for `t()` calls instead of literal English strings (5 tests updated)

Total test count: 251 → 307 (56 new tests). All 307 pass.

---

## v1.7.3

### Tests
- **New test file: `packages/core/tests/siws-session.test.ts`** — 49 tests covering the full v1.7.x SIWS session lifecycle on `StellarAppKit`:
  - `siwsSession` getter (null when unset, auto-clears expired, treats `expiry: 0` as non-expiring)
  - `setSiwsSession(session | null)` — persists to storage, emits `siwsSessionChange` + `sessionsChanged`
  - `clearSiwsSession()` — clears in-memory + storage, emits event only when a session was set, calls `signout()` per `signoutOnDisconnect` config, swallows `signout()` errors
  - `signOut()` — clears session + disconnects wallet, safe no-op when nothing is connected
  - `requireAuth()` — throws `ConnectError` when not authenticated, returns void when authenticated, throws when session has expired (getter auto-clears first)
  - `validateSession()` — uses `refresh()` when configured (falls back to `session()`), clears session on null/throw/address-mismatch/network-mismatch/expiry, accepts + stores fresh valid sessions
  - `reauthenticate()` — clears session, emits `siwsSessionChange: null`, safe when no session is set
  - `restoreSiwsSession()` (via `restore()`) — restores valid session from storage, clears expired session from storage, ignores corrupted JSON, no-ops when `siwsConfig` is not set or no wallet session was restored
  - Event type contract — `siwsSessionChange` is declared on `StellarAppKitEvents` with payload `SiwsSession | null`
  - `SiwsError` class — constructible with type + message, covers all 9 documented `SiwsErrorType` values
- **New test file: `packages/ui-web/tests/siws-flow.test.ts`** — 43 tests covering the modal's `triggerSiwsFlow()` wiring:
  - Source-level checks for all 5 SIWS view states (`siws-checking`, `siws-nonce`, `siws-signing`, `siws-verifying`, `siws-error`)
  - View state transition order (each state set BEFORE the corresponding async call)
  - `maxRetries` (default 3) and `timeoutMs` (default 15000) configuration
  - `withTimeout` wrapper applied to `session()`, `nonce()`, and `verify()`
  - Retry counter increments on failure, resets to 0 on success, shows "Too many failed attempts" at max
  - Cancel button handler (`data-action="cancel-siws"`) sets `siwsCancelled`, resets state, disconnects wallet per `disconnectOnFail`
  - `handleSiwsFailure` is a no-op when `siwsCancelled` is true
  - `close()` disconnects wallet when `siwsPending` is true and `disconnectOnFail` is true
  - Session validation (address, network, expiry) on both `session()` and `verify()` return paths
  - `verify()` receives context `{ address, network }` as third arg (v1.7.0 breaking change)
  - Behavioral tests for `extractErrorMessage` (Error, string, plain object, `.reason` vs `.message`, null/undefined/numbers, empty Error)
  - Behavioral tests for `withTimeout` (resolves fast, rejects on timeout, propagates original rejection, doesn't cancel the slower promise)
  - User-facing status text for each SIWS view state
- **Extended `packages/ui-web/tests/react.test.ts`** — 4 new tests for the v1.7.2 React provider fix:
  - `StellarAppKitProviderConfig` type accepts a `siws` field
  - `siws` is optional on the config type
  - `useSiwsSession` and `useIsAuthenticated` are exported hooks
  - Source-level check that the provider forwards `config.siws` to the `StellarAppKit` constructor + includes it in the `useMemo` dependency array

Total test count: 155 → 251 (96 new tests). All 251 pass.

---

## v1.7.2

### Bug fixes
- **React `<StellarAppKitProvider>` now passes `siws` config through to the underlying `StellarAppKit` client.** Previously, setting `config.siws` on the provider had no effect — the modal never triggered the automatic SIWS flow, and `useSiwsSession()` / `useIsAuthenticated()` always returned null. Now passing a `SiwsConfig` via the provider correctly enables the full v1.7.0 SIWS experience: automatic sign-in on connect, session persistence, `signOut()`, `validateSession()`, and `reauthenticate()`.
- The provider's `useMemo` dependency array now includes `config.siws` so changing the SIWS config (e.g. via a feature flag) recreates the client correctly.

### Type changes
- `StellarAppKitProviderConfig` (React) gained a `siws?: SiwsConfig` field, matching the same field on the core `StellarAppKitConfig` type.

All 155 tests pass.

---

## v1.7.1

### Documentation
- README, SKILL.md, llms.txt, ARCHITECTURE.md all updated for v1.7.0 SIWS features:
  - Session persistence (localStorage + restore on page reload)
  - `appkit.signOut()`, `appkit.requireAuth()`, `appkit.validateSession()`, `appkit.reauthenticate()`
  - `useSiwsSession()` + `useIsAuthenticated()` hooks (React)
  - `siwsSessionChange` event
  - `siws-checking` view, Cancel button, timeout (15s), retry limiting (3)
  - `verify` now receives `context: { address, network }`
  - `refresh?` callback, `maxRetries?`, `timeoutMs?`
  - `SiwsError` + `SiwsErrorType` discriminated errors
- ARCHITECTURE.md §8.16 fully rewritten with complete SiwsConfig type, flow diagram, session persistence, API methods, hooks, security, and implementation details

All 155 tests pass.

---

## v1.7.0

### Breaking changes
- **`verify` now receives `context`** — third parameter `{ address, network }` so the developer can compare server-side without an extra round-trip
- **`siwsSessionChange` event added** to `StellarAppKitEvents` — fires when the SIWS session is set, cleared, or expires

### New features
- **Session persistence** — SIWS session stored in `localStorage` and restored on `appkit.restore()`. Survives page reloads.
- **`appkit.signOut()`** — manually sign out: clears session, calls `signout()`, disconnects wallet. For "Log out" buttons.
- **`appkit.requireAuth()`** — throws `ConnectError` if not authenticated. For guarding actions.
- **`appkit.validateSession()`** — calls `refresh()` (or `session()` if no `refresh`) to validate against the server. Returns `SiwsSession | null`. If invalid, clears session.
- **`appkit.reauthenticate()`** — clears session and triggers re-auth. For privilege escalation.
- **`useSiwsSession()` hook** (React) — reactive `SiwsSession | null`, re-renders on session changes
- **`useIsAuthenticated()` hook** (React) — reactive `boolean`
- **`siws-checking` view** — separate "Checking session…" state before nonce fetch
- **Cancel button** — during SIWS flow, user can cancel (disconnects if `disconnectOnFail` is true)
- **Timeout on nonce/verify** — 15s default, configurable via `timeoutMs`
- **Retry rate limiting** — max 3 retries (configurable via `maxRetries`), then shows "Too many attempts"
- **`refresh?` callback** — optional session refresh without requiring new sign-in
- **`SiwsError` + `SiwsErrorType`** — discriminated error types for programmatic handling

### Security improvements
- **Address binding**: session address must match connected wallet
- **Network binding**: session network must match connected wallet
- **Expiry auto-check**: `siwsSession` getter auto-clears expired sessions
- **Signout on disconnect**: `signoutOnDisconnect: true` (default) prevents orphaned server sessions
- **Nonce timeout**: prevents hanging on unresponsive servers

All 155 tests pass.

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
