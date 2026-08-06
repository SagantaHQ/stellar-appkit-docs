---
title: AI Integration
description: Stellar AppKit ships an AI skill file (SKILL.md) and llms.txt so AI agents like Cursor, Copilot, and Claude can understand the library's API and write correct code without reading the whole codebase.
---

Stellar AppKit ships two AI-readable files at the root of the [library repository](https://github.com/SagantaHQ/stellar-appkit):

- **`SKILL.md`** — a structured skill description that AI agents can load to learn when and how to use the library
- **`llms.txt`** — a compact, plain-text index of the library's API surface, install commands, and common patterns, following the [llms.txt convention](https://llmstxt.org/)

Both files exist for one reason: **so AI coding tools can produce correct Stellar AppKit code without you having to paste half the documentation into the chat.** Cursor, GitHub Copilot, Claude Code, Windsurf, and any other agent that reads repo files will pick these up automatically.

## Why this matters

Modern AI coding assistants are only as good as the context they have. When an agent doesn't know an API exists, it invents one — and on a young library like Stellar AppKit, the invented API is almost always wrong (wrong connector names, wrong hook signatures, wrong SIWS payload shape). By placing the full API surface in two machine-readable files at the repo root, agents get correct context on every read.

The two files cover different consumption modes:

| File | Audience | Format | What it's optimized for |
|---|---|---|---|
| `SKILL.md` | Skill-aware agents (Claude Code with skills, custom agents) | YAML frontmatter + structured Markdown | Triggering — "should I use this skill?" decisions, with code snippets for common patterns |
| `llms.txt` | Any LLM that reads repo files | Plain text, compact | API surface recall — install commands, hook names, method signatures, connector table |

If your agent supports the [Stellar Skills](https://skills.stellar.org/) convention, it will use `SKILL.md` as a skill. If it just reads repo files (most agents), it will pick up `llms.txt` (and `SKILL.md` is also valid Markdown, so it works there too).

## SKILL.md

The skill file follows the [skill file convention](https://llmstxt.org/) with YAML frontmatter:

```yaml
---
name: stellar-appkit
description: Build Stellar/Soroban dApps with unified wallet connections, transaction previews, and Soroban contract calls. Use when building a Stellar dApp frontend that needs wallet connection, transaction signing, Soroban smart contract interaction, or Sign-In With Stellar authentication.
license: MIT
---
```

The `description` field is intentionally written as a trigger sentence — it tells the agent **when** to activate the skill. This is what an agent reads first to decide whether to load the rest of the file.

After the frontmatter, the body covers:

- **When to use this skill** — concrete trigger conditions (build a Stellar dApp, connect wallets, sign transactions, call Soroban contracts, SIWS, preview transactions, use framework wrappers)
- **Installation** — the core package plus per-connector and per-framework peer dependencies
- **Core patterns** — copy-pasteable code for the six most common flows: basic connection, signing transactions, Soroban contract calls, typed contract client, SIWS, React hooks
- **Key API reference** — quick method lists for `StellarAppKit`, `SorobanConnection`, and `verifySiws`
- **Available connectors** — table with function names and peer dependencies
- **SIWS signing per wallet** — table mapping each wallet to what bytes it actually signs (this is the most common source of bugs)
- **Theming** — CSS custom properties with example values
- **Links** — GitHub, docs, npm

If you're using a skill-aware agent, the skill loads on demand. If you're using a plain agent, just `@mention` the file or include it in the chat context.

### Loading the skill in Claude Code

```bash
# Add the skill to your project
curl -O https://raw.githubusercontent.com/SagantaHQ/stellar-appkit/main/SKILL.md
# Then reference it in your prompt:
# "Use the stellar-appkit skill to add a Freighter connect button to my Next.js app"
```

### Loading the skill in Cursor

In Cursor's settings, add `SKILL.md` to the project's always-included files, or use `@SKILL.md` in chat. Cursor will then have the full API surface available for autocomplete and chat suggestions.

## llms.txt

The `llms.txt` file is a plain-text, ~250-line summary of the entire library. It is structured for token-efficient recall — an agent can read it once and have enough context to write correct code for 90% of use cases.

It is divided into sections:

- **Header** — package name, GitHub, docs, npm, license
- **Install** — core package + per-connector SDKs + framework wrappers + gesture libraries
- **Quick Start** — 10-line working wallet connect flow
- **Wallet Connection** — `connect`, `disconnect`, session, events, network mismatch recovery
- **Signing** — `signTransaction`, `signMessage`, `signIn`, `signAuthEntry`
- **Soroban** — `SorobanConnection`, `invoke`, `previewInvoke`, `estimateFee`, typed contract client, RPC failover
- **SIWS Verification** — server-side `verifySiws` with debug mode
- **Framework Wrappers** — React, Vue, Solid, Svelte (one snippet each)
- **Transaction Preview** — `previewOptions`, `onPreviewTransaction`, `onPreviewAuthEntry`
- **Theming** — CSS custom properties + modal HTML attributes
- **Error Handling** — `ConnectError` codes, `NetworkMismatchError`
- **Tree-shaking** — subpath exports list
- **Links** — GitHub, docs, npm

### Reading llms.txt from the raw URL

If you want to give an agent the library context without cloning the repo, point it at the raw URL:

```
https://raw.githubusercontent.com/SagantaHQ/stellar-appkit/main/llms.txt
```

For example, in Cursor chat:

> Read https://raw.githubusercontent.com/SagantaHQ/stellar-appkit/main/llms.txt and use it to refactor my wallet connection code to use StellarAppKit.

### Reading llms.txt as a project file

If your project already depends on `@saganta/stellar-appkit`, the file ships in the npm tarball. You can reference it from `node_modules`:

```bash
cat node_modules/@saganta/stellar-appkit/llms.txt
```

Some agents (Cursor, Continue) will pick this up automatically when you reference the package.

## Docs site llms.txt

This documentation site also serves its own `llms.txt` and `llms-full.txt` at the root, following the [llms.txt convention](https://llmstxt.org/):

- **`https://stellar-appkit.saganta.com/llms.txt`** — compact index of every docs page with a one-line description and a link
- **`https://stellar-appkit.saganta.com/llms-full.txt`** — the full docs content concatenated into a single file (~138 lines), so an agent can read the entire docs in one fetch

Use these when you want an agent to have the docs context without having to crawl the site page by page:

```
https://stellar-appkit.saganta.com/llms.txt        # index
https://stellar-appkit.saganta.com/llms-full.txt   # full content
```

### Example: feed the full docs to Claude

```text
Read https://stellar-appkit.saganta.com/llms-full.txt and then
write a Next.js API route that verifies a SIWS payload server-side
using @saganta/stellar-appkit-siws-verify.
```

The agent will have the entire docs in context and can produce correct code on the first try.

## Recommended agent workflow

For the best results when building a Stellar dApp with an AI agent:

1. **Install the package first.** Once `@saganta/stellar-appkit` is in `package.json`, the agent can read `llms.txt` from `node_modules` and have the full API surface.
2. **Point the agent at the raw `SKILL.md` URL** if it isn't already in the project — this gives it the trigger conditions and common patterns.
3. **For Soroban work**, also point the agent at the [Soroban docs page](https://stellar-appkit.saganta.com/soroban/typed-client/) or the relevant section in `llms-full.txt`. Soroban contract calls have more shape variety than wallet connection, so the extra context helps.
4. **For SIWS verification**, always have the agent read the [SIWS docs page](https://stellar-appkit.saganta.com/core/siws/) — the multi-candidate verification logic is subtle and the agent will get it wrong from memory.

## Keeping the files in sync

Both files are maintained in the [library repository](https://github.com/SagantaHQ/stellar-appkit), not in this docs site. When the API changes, both `SKILL.md` and `llms.txt` are updated in the same commit. The docs site's own `llms.txt` and `llms-full.txt` are regenerated separately.

If you notice the files are out of date, please open an issue or PR at [SagantaHQ/stellar-appkit](https://github.com/SagantaHQ/stellar-appkit).

## Links

- [`SKILL.md` on GitHub](https://github.com/SagantaHQ/stellar-appkit/blob/main/SKILL.md)
- [`llms.txt` on GitHub](https://github.com/SagantaHQ/stellar-appkit/blob/main/llms.txt)
- [Docs site `llms.txt`](/llms.txt)
- [Docs site `llms-full.txt`](/llms-full.txt)
- [llms.txt convention](https://llmstxt.org/)
- [Stellar Skills](https://skills.stellar.org/)
