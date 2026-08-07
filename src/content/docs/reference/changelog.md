---
title: Changelog
description: Release history for Stellar AppKit.
---

## v1.0.3

### Bug fixes
- **Bottom-sheet drag-to-dismiss now properly closes the overlay.** Previously, when the user dragged the sheet down past the threshold, the spring animated the panel off-screen but `close()` then re-ran the WAAPI exit animation, causing a visible jump back to `translateY(0)` before sliding down. The spring now calls `close(skipAnimation=true)` to skip the WAAPI exit since the panel is already off-screen.
- **Close (X) button now works in bottom-sheet mode.** The drag gesture handler's `panel.setPointerCapture()` was stealing the `pointerup` event from child buttons, so the `click` event never fired on the close button. `onPointerDown` now checks if the target is a button, link, or `[data-action]` element and skips drag setup entirely for those.
- **Modal default animations no longer flash.** The initial-state gap between `render()` and the WAAPI animation start is eliminated by setting `panel.style.opacity='0'` before the animation kicks in.

### New features
- **Zero-config default connectors.** `StellarAppKitConfig.connectors` is now optional. If omitted (or empty), the SDK auto-registers Freighter, Albedo, xBull, and Ledger via the new `defaultConnectors()` export. WalletConnect is excluded from defaults because it requires a `projectId`.
- **"Installed" badge on wallet list.** Available wallets now show an accent-colored pill labeled "Installed" (with a dot), making it instantly clear which wallets are ready to use vs. which need installation.
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
