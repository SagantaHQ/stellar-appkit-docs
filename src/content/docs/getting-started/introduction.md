---
title: Introduction
description: One SDK for every Stellar wallet — real transaction previews, Soroban built in, and framework wrappers for React, Vue, Solid, and Svelte.
---

Stellar AppKit is a **Web3Modal / Reown AppKit equivalent for Stellar**. It provides one unified wallet API, a first-class Soroban layer, real transaction previews instead of raw XDR, and a themeable UI that works identically dropped into any site.

Built by [Saganta](https://github.com/saganta) as the wallet-connection layer of its Stellar/Soroban developer infrastructure (embedded wallets, gas sponsorship, smart accounts, payment APIs).

## Why this exists

Stellar already has solid wallet-connection plumbing — [SEP-43](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md) is an emerging standard interface several wallets are converging on, and [`@creit-tech/stellar-wallets-kit`](https://github.com/Creit-Tech/Stellar-Wallets-Kit) is a mature, headless connector library covering most of the ecosystem. Neither ships what Stellar AppKit does:

- A **polished, themeable, cross-platform UI** (modal / bottom-sheet / inline) — the existing connector libraries are deliberately headless, so "sleek out of the box" is a gap, not a solved problem.
- A **transaction preview** that decodes operations into plain language and flags risk *before* the wallet's own signature prompt — every wallet-connect kit passes raw XDR straight through today.
- A **first-class Soroban layer** — simulate → prepare → sign → submit as one call, with typed contract clients, instead of hand-rolling `rpc.Server` calls per app.
- **Network-mismatch recovery** that goes further than "fail with a generic error" — typed error with `expectedNetwork` / `actualNetwork`, plus an optional auto-retry mode that polls until the user switches networks.

## Key features

### Wallet connectivity
- Unified adapter interface aligned with SEP-43, so new wallets are one file, not a redesign
- Freighter, Albedo, xBull, Ledger, and WalletConnect adapters, ready to use
- Hardware wallets with real multi-account support (derivation-path based) via `listAccounts()` / `selectAccount()`
- Richer-than-boolean reachability (`'available' | 'locked' | 'not-installed' | 'unavailable'`)
- Typed `NetworkMismatchError` with an optional auto-retry mode that polls until the user switches networks
- Cross-tab session sync via `BroadcastChannel` — connect in one tab, every other tab reflects it

### Signing & transaction UX
- Human-readable transaction previews — every operation decoded, not just a summary
- Risk flags: account-merge and signer-changes are always flagged; large-transfer and unverified-contract checks are opt-in and app-configurable
- Soroban call preview backed by real simulation — see "this would fail" before signing anything
- Soroban balance-delta preview — surfaces the actual balance changes (XLM, trustline assets) the network would apply
- Auth-entry preview — standalone `signAuthEntry()` calls are decoded and risk-assessed before reaching the wallet
- Signature-request queueing — concurrent sign calls resolve in order instead of racing the wallet

### Soroban
- One `invoke()` call covers build → simulate → prepare → sign → submit → poll
- Typed contract client — `client.transfer({ from, to, amount })` is fully typed
- RPC failover — pass `rpcUrls: [...]` and the connection transparently fails over on network/5xx errors
- Contract verification badges — surface "Verified", "Audited", "Published by X" badges in the preview UI
- Pre-simulate fee estimation — `FeeEstimate` with base fee, Soroban resource fee, instruction count, and total in XLM
- Auth-entry signing — uses `authorizeEntry()` for correct `HashIdPreimage` construction and `ScVal` wrapping
- Low-level escape hatches (`simulate`, `prepare`, `submit`, `pollStatus`) for anything `invoke()` doesn't cover

### Identity
- Sign-In With Stellar (SIWS) — a self-issued, SEP-43-based message-signing flow analogous to Sign-In With Ethereum
- SEP-0053 message encoding for Freighter — `sha256("Stellar Signed Message:\n" + message)`
- Multi-candidate verification with debug diagnostics — tries 8+ candidate byte sequences
- Unified `signedData` contract — every connector surfaces the exact bytes the wallet signed
- Server-side verifier package (`@saganta/stellar-appkit-siws-verify`)

### Framework wrappers
- React (`/react`) — `<StellarAppKitProvider>` + hooks using `useSyncExternalStore`
- Vue (`/vue`) — `StellarAppKitPlugin` + Composition API composables
- Solid (`/solid`) — `<StellarAppKitProvider>` + hooks using `createSignal`/`createMemo`
- Svelte (`/svelte`) — `setStellarAppKitContext()` + stores (Svelte 4 + 5 compatible)
- Each wrapper is a separate subpath export — bundlers only ship the framework code you actually import

### UI
- `<stellar-appkit-modal>` — a Shadow DOM Web Component, framework-agnostic, **zero runtime dependency**
- Modal (desktop), bottom-sheet (mobile web), and inline (embedded) presentation, auto-selected by viewport
- **WAAPI open/close animations** — 7 presets (none, fade, scale, scale-blur, slide-up, slide-left, implode), zero dependencies, `prefers-reduced-motion` respected. Sensible defaults: `scale-blur` for modal, `slide-up` for bottom-sheet.
- **Draggable bottom-sheet** with custom spring physics (~30 lines, native Pointer Events + `requestAnimationFrame`, no `@use-gesture` or `motion` needed)
- **"Installed" badge** on wallet list — accent-colored pill marking ready-to-use wallets
- **Zero-config default connectors** — omit `connectors` from the config to auto-register Freighter + Albedo + xBull + Ledger
- Every color/radius/font is a themeable CSS custom property that crosses the shadow boundary
- Wallet-provided avatars with deterministic gradient fallback + opt-in Stellar Expert avatars
- Copy-to-clipboard everywhere an address appears
- Contract verification badges with audit URLs rendered in the transaction preview
- Account picker (multi-account hardware wallets), network-mismatch view, and transaction-preview view all built in

## Live Demos

Want to see Stellar AppKit in action before installing? Check out the **[live demos](https://demos.stellar-appkit.saganta.com)** — 17 working examples covering wallet connection, transaction signing, Soroban contract calls, SIWS authentication, and theming. Each demo is a real Next.js route you can copy into your own app.

## License

MIT — see [LICENSE](https://github.com/sagantaHQ/stellar-appkit/blob/main/LICENSE).

## Packages

| Package | What it is |
|---|---|
| [`@saganta/stellar-appkit`](https://github.com/sagantaHQ/stellar-appkit) | Unified Stellar wallet connections, Soroban, and transaction preview — the core SDK. Includes the themeable `<stellar-appkit-modal>` Web Component at the `/ui-web` subpath, plus framework wrappers at `/react`, `/vue`, `/solid`, `/svelte`. |
| [`@saganta/stellar-appkit-siws-verify`](https://github.com/sagantaHQ/stellar-appkit) | Server-side SIWS signature/envelope verification. |
