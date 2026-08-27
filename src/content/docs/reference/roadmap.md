---
title: Roadmap
description: What's coming next for Stellar AppKit — Social Login, KYC, React Native, Lynx.js, and more.
---

## What's next

Stellar AppKit is actively developed. Here's what we're building:

### 🔐 Social Login

Email/passwordless social login (Google, GitHub, etc.) that creates a non-custodial Stellar wallet under the hood. No seed phrases, no browser extensions — just sign in with your existing account and start transacting. This lowers the barrier to entry for users who've never used a crypto wallet before.

### ✅ Compliance (Built-in KYC)

An optional KYC layer that integrates with identity verification providers. Apps that need compliance (regulated fintechs, tokenized securities) can require KYC before allowing transactions — without building a separate verification flow. The wallet connection + KYC + transaction signing pipeline will be unified in a single SDK.

### 📱 React Native Support

Full React Native connector + UI components. Same API as the web SDK — connect wallets, sign transactions, interact with Soroban, implement SIWS — but native. WalletConnect will work out of the box for connecting mobile wallets. The UI components will use React Native primitives (not a WebView).

### 🚀 Lynx.js Support

[Lynx.js](https://lynxjs.org/) is gaining traction as a high-performance cross-platform framework. We'll provide first-class Lynx.js bindings so apps built on Lynx can use Stellar AppKit without compromise — same connectors, same Soroban pipeline, same SIWS flow, but with native rendering performance.

### 🔑 Smart-Account / Passkey Signer

A native `WalletConnector` that uses passkeys (WebAuthn / FIDO2) as the signing primitive — no wallet extension needed. The wallet is embedded in the app, with a gas-sponsorship hook in the Soroban invoke pipeline.

---

## What's shipped

Everything below is live on npm and in production:

- ✅ 8 wallet connectors + WalletConnect v2
- ✅ Soroban `invoke()` pipeline (build → simulate → preview → sign → submit → poll)
- ✅ Typed contract client (`soroban.contract<T>()`)
- ✅ RPC failover with health tracking
- ✅ Sign-In With Stellar (client + server verification + session management)
- ✅ Transaction preview (decoded operations, risk flags, fee estimates)
- ✅ Modal UI (React, Vue, Solid, Svelte) with Shadow DOM Web Component
- ✅ 5 named themes (minimal, stellar, sky, ocean, sunset) with dark + light
- ✅ Styled QR codes (qr-code-styling — rounded modules, circular finder dots)
- ✅ "Get Testnet funds" button (friendbot via fetch)
- ✅ Balance + tx history polling (10s, silent, only on connected view)
- ✅ 25 locales (including RTL: Arabic, Hebrew)
- ✅ WAAPI animation presets (7 built-in)
- ✅ Bottom sheet + swipe-to-dismiss
- ✅ AI-readable SKILL.md + llms.txt
- ✅ Ledger hardware wallet (WebHID/WebUSB, multi-account)
- ✅ Trezor (optional peer dependency)

Full detail in [ARCHITECTURE.md §9](https://github.com/SagantaHQ/stellar-appkit/blob/main/ARCHITECTURE.md) on GitHub.
