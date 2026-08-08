---
title: Sign-In With Stellar
description: Self-issued auth with server-side verification, automatic sign-in flow, session persistence, and full lifecycle management.
---

Stellar AppKit provides two layers for Sign-In With Stellar (SIWS):

1. **Manual sign-in** — call `appkit.signIn()` to get the signed payload, POST it to your backend, verify server-side with `verifySiws()`. You manage the session yourself.
2. **Automatic SIWS flow** (v1.4.0+) — pass a `SiwsConfig` to `StellarAppKit` and the modal automatically runs the full sign-in flow (session check → nonce → sign → verify) right after the user picks a wallet. The SDK manages the session lifecycle: persistence, expiry, sign-out, re-authentication.

Most apps should use the **automatic flow** — it's less code, handles edge cases (retries, timeouts, cancellation), and integrates with the React hooks (`useSiwsSession`, `useIsAuthenticated`).

## Manual sign-in (client-side)

```ts
const { message, signedMessage, signerAddress, signedData } = await appkit.signIn({
  statement: 'Sign in to My App',
  nonce: await fetch('/api/siws/nonce').then((r) => r.text()),
});
// POST { message, signedMessage, signerAddress, signedData } to your backend
```

The `signedData` field is the magic that makes verification work across wallets — it's the base64 of the exact bytes the wallet signed. Freighter signs a SHA-256 hash (SEP-0053), Albedo signs a server-derived hash, xBull signs raw UTF-8 — the verifier tries all of them.

## Server-side verification

```ts
import { verifySiws } from '@saganta/stellar-appkit-siws-verify';

const result = await verifySiws(
  { message, signedMessage, signerAddress, signedData },
  { expectedDomain: 'app.example.com', expectedNonce: nonce }
);
if (result.ok) {
  // result.claims.address is the authenticated user
}
```

### Debug mode

When verification fails, enable `debug: true` to see exactly what was tried:

```ts
const result = await verifySiws(payload, {
  expectedDomain: 'localhost',
  expectedNonce: nonce,
  debug: true,
});
if (!result.ok) {
  console.log(result.diagnostics);
  // { signatureByteLength: 64, candidatesTried: [...] }
}
```

## How signing works per wallet

| Wallet | What gets signed | `signedData` |
|---|---|---|
| Freighter | `sha256("Stellar Signed Message:\n" + message)` (SEP-0053) | Base64 of the hash |
| Albedo | `res.signed_message` (server-derived hash) | Base64 of hex-decoded bytes |
| xBull | `utf8(message)` (best-effort — SDK doesn't expose fullMessage) | Base64 of UTF-8 bytes |
| Ledger | `utf8(message)` (direct signer) | Base64 of UTF-8 bytes |

## Multi-candidate verification

The verifier tries 8+ candidate byte sequences because wallets don't all sign the same thing:

1. `signedData` (if present)
2. `utf8(message)` — raw bytes
3. `sha256("Stellar Signed Message:\n" + message)` — SEP-0053 (Freighter)
4. `sha256(message)` — generic prehash
5. `sha512(message)` — SHA-512 prehash
6. `sha512(message)` truncated to 32 bytes
7. `sha256("\x00" + message)` — null-byte domain prefix
8. `utf8(message with CRLF)` — Windows line endings

---

## Automatic SIWS flow (v1.4.0+)

Pass a `SiwsConfig` to `StellarAppKit` and the modal automatically runs the SIWS flow right after the user connects a wallet. The SDK manages the entire session lifecycle.

### Setup

```ts
import { StellarAppKit, defaultConnectors } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  connectors: defaultConnectors(),
  appMetadata: { name: 'My App', url: 'https://app.example.com' },
  siws: {
    statement: 'Sign in to My App',
    session: async () => {
      // Called immediately after connect — check for an existing server session.
      // Return a SiwsSession to skip sign-in; return null to proceed with sign-in.
      const res = await fetch('/api/siws/session');
      if (!res.ok) return null;
      return res.json();
    },
    nonce: async () => {
      // Fetch a server-issued nonce.
      const res = await fetch('/api/siws/nonce');
      const { nonce } = await res.json();
      return nonce;
    },
    verify: async (data, nonce, context) => {
      // Verify the signed payload server-side. Return a SiwsSession on
      // success, null on failure. `context` has { address, network } so
      // you can compare server-side without an extra round-trip.
      const res = await fetch('/api/siws/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, nonce }),
      });
      if (!res.ok) return null;
      return res.json();
    },
    signout: async () => {
      // Clear the server-side session. Called on wallet disconnect
      // (when signoutOnDisconnect is true) and on appkit.signOut().
      await fetch('/api/siws/logout', { method: 'POST' });
      return true;
    },
    refresh: async () => {
      // Optional — refresh the session before it expires.
      // Called by validateSession() and periodically by the SDK.
      const res = await fetch('/api/siws/session');
      return res.ok ? res.json() : null;
    },
    // Behavior knobs (all optional, with sensible defaults):
    disconnectOnFail: true,    // disconnect wallet if user closes modal before SIWS succeeds
    signoutOnDisconnect: true, // call signout() before clearing the wallet session
    maxRetries: 3,             // show "Too many attempts" after 3 failures
    timeoutMs: 15_000,         // 15s timeout for nonce() and verify()
  },
});
```

### The automatic flow

When the user connects a wallet (via the modal or `appkit.connect()`):

1. **`siws-checking` view** — calls `session()` to check for an existing server session. If a valid session exists for the connected address + network + not-expired, sign-in is **skipped entirely** (no extra wallet prompt).
2. **`siws-nonce` view** — calls `nonce()` to fetch a server-issued challenge.
3. **`siws-signing` view** — calls `appkit.signIn({ statement, nonce })` — the wallet prompts the user to sign.
4. **`siws-verifying` view** — calls `verify(signInResult, nonce, { address, network })` — your server verifies the signature and returns a `SiwsSession`.
5. **`connected` view** — `appkit.setSiwsSession(session)` is called, the session is persisted to `localStorage`, and `useSiwsSession()` / `useIsAuthenticated()` update app-wide.

If any step fails, the modal shows a **`siws-error` view** with the error message and a "Try again" button (up to `maxRetries` attempts). The user can also click **Cancel** to abort the flow.

### Session persistence (v1.7.0+)

The SIWS session is persisted to `localStorage` and restored on `appkit.restore()` (called automatically by the React provider on mount). This means the session survives page reloads — the user doesn't need to re-sign every time they refresh.

```ts
// The session is stored under the 'saganta-appkit:siws-session' key.
// On page load, the provider calls restore() which calls restoreSiwsSession()
// — if a valid (non-expired) session is in storage, it's reactivated.
```

### `SiwsSession` type

```ts
interface SiwsSession {
  network: 'PUBLIC' | 'TESTNET' | 'FUTURENET' | string;
  address: string;
  expiry: number;      // epoch millis — 0 or undefined means "no expiry"
  metadata?: Record<string, unknown>;  // arbitrary app data
}
```

---

## Session lifecycle methods (v1.7.0+)

These methods on `StellarAppKit` let you manage the SIWS session programmatically.

### `appkit.siwsSession` (getter)

Returns the current `SiwsSession | null`. **Auto-clears expired sessions** — if `expiry` is in the past, the getter returns `null` and clears the internal state. Treats `expiry: 0` or `expiry: undefined` as "no expiry" (never auto-clears).

```ts
const session = appkit.siwsSession;
if (session) {
  console.log(session.address, session.network, new Date(session.expiry));
}
```

### `appkit.setSiwsSession(session | null)`

Manually set or clear the SIWS session. Persists to `localStorage` and emits `siwsSessionChange`. Use this after a manual sign-in flow (when not using `SiwsConfig`):

```ts
const session: SiwsSession = {
  network: 'TESTNET',
  address: result.claims.address,
  expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  metadata: { statement: 'Sign in to My App' },
};
appkit.setSiwsSession(session);
```

Pass `null` to clear the session without calling `signout()`:

```ts
appkit.setSiwsSession(null);
```

### `appkit.clearSiwsSession()`

Clears the in-memory session + storage, emits `siwsSessionChange: null`, and calls `signout()` (if `signoutOnDisconnect` is `true` in the config). Swallows `signout()` errors silently — a failing server logout must not block the local clear.

```ts
await appkit.clearSiwsSession();
```

### `appkit.signOut()`

The "Log out" button method. Clears the SIWS session (calls `signout()`), then **disconnects the wallet**. Safe to call when nothing is connected (no-op).

```ts
await appkit.signOut();
```

### `appkit.requireAuth()`

Throws `ConnectError` if not authenticated. Use to guard privileged actions:

```ts
function doPrivilegedAction() {
  appkit.requireAuth(); // throws ConnectError if not authenticated
  // ... proceed with the action ...
}
```

### `appkit.validateSession()`

Re-checks the session against the server. Calls `refresh()` (or `session()` if no `refresh` is configured). If the server says the session is invalid/expired, or if the returned address/network/expiry don't match the connected wallet, the local session is cleared.

Returns the validated `SiwsSession | null`:

```ts
const session = await appkit.validateSession();
if (!session) {
  // Session is invalid — redirect to sign-in
}
```

Validation checks:
- Server returns `null` → clear local session
- Server throws → clear local session
- Server address ≠ connected wallet address → clear
- Server network ≠ connected wallet network → clear
- Server expiry is in the past → clear
- All checks pass → store the fresh server session

### `appkit.reauthenticate()`

Clears the current session and emits `siwsSessionChange: null`. In a `siwsConfig` setup, the modal picks up this event and triggers a fresh SIWS sign-in flow automatically. Useful for **privilege escalation** ("Confirm it's you to complete this action"):

```ts
await appkit.reauthenticate();
// Modal re-opens with the SIWS flow
```

### `appkit.restoreSiwsSession()`

Private method called by `appkit.restore()` (which the React provider calls on mount). Restores a valid session from `localStorage`, clears expired sessions, and ignores corrupted storage. You don't call this directly — it's wired into the restore flow.

---

## React hooks (v1.7.0+)

### `useSiwsSession()`

Reactive `SiwsSession | null`. Re-renders when the session is set, cleared, or expires.

```tsx
import { useSiwsSession } from '@saganta/stellar-appkit-ui-web/react';

function Header() {
  const session = useSiwsSession();
  if (session) {
    return <p>Signed in as {session.address}</p>;
  }
  return <p>Not signed in</p>;
}
```

### `useIsAuthenticated()`

Reactive `boolean` — `true` when the user has a valid (non-expired) SIWS session. Derived from `useSiwsSession()`.

```tsx
import { useIsAuthenticated } from '@saganta/stellar-appkit-ui-web/react';

function AdminPanel() {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) return <SignInPrompt />;
  return <AdminContent />;
}
```

### Passing `siws` config via the provider

```tsx
import { StellarAppKitProvider } from '@saganta/stellar-appkit-ui-web/react';

export function App() {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      siws: {
        statement: 'Sign in to My App',
        session: async () => { /* ... */ },
        nonce: async () => { /* ... */ },
        verify: async (data, nonce, ctx) => { /* ... */ },
        signout: async () => { /* ... */ },
      },
    }}>
      <AppContent />
    </StellarAppKitProvider>
  );
}
```

> **Note (v1.7.2 fix):** In v1.7.0–v1.7.1, the React provider did not forward `config.siws` to the underlying `StellarAppKit` client. This was fixed in v1.7.2. If you're on v1.7.0 or v1.7.1, upgrade to v1.7.2+ to use the automatic SIWS flow via the provider.

---

## Events

### `siwsSessionChange`

Fires when the SIWS session is set, cleared, or expires. Payload is `SiwsSession | null`.

```ts
appkit.on('siwsSessionChange', (session) => {
  if (session) {
    console.log('Authenticated as', session.address);
  } else {
    console.log('Signed out');
  }
});
```

---

## `SiwsConfig` reference

```ts
interface SiwsConfig {
  /** Human-readable statement shown in the SIWS message. */
  statement: string;

  /** Check for an existing server session. Return SiwsSession to skip sign-in, null to proceed. */
  session: () => Promise<SiwsSession | null | undefined>;

  /** Fetch a server-issued nonce. */
  nonce: () => Promise<string>;

  /**
   * Verify the signed payload server-side. Return SiwsSession on success, null on failure.
   * v1.7.0+: receives a context object { address, network } as the 3rd arg so you can
   * compare server-side without an extra round-trip.
   */
  verify: (
    data: { message: string; signedMessage: string; signerAddress: string; signedData?: string; issuedAt: string; expirationTime: string },
    nonce: string,
    context: { address: string; network: string }
  ) => Promise<SiwsSession | null | undefined>;

  /** Clear the server-side session. Return true on success, false on failure. */
  signout: () => Promise<boolean> | boolean;

  /** Optional: refresh the session before it expires. Falls back to session() if omitted. */
  refresh?: () => Promise<SiwsSession | null | undefined>;

  /** Disconnect wallet when user closes modal before SIWS succeeds. Default: true. */
  disconnectOnFail?: boolean;

  /** Call signout() before clearing the wallet session on disconnect. Default: true. */
  signoutOnDisconnect?: boolean;

  /** Max retry attempts on SIWS failure. Default: 3. */
  maxRetries?: number;

  /** Timeout in ms for nonce() and verify() calls. Default: 15000. */
  timeoutMs?: number;
}
```

---

## `SiwsError` (v1.7.0+)

The modal's SIWS flow throws `SiwsError` (a discriminated error) for programmatic handling:

```ts
import { SiwsError, type SiwsErrorType } from '@saganta/stellar-appkit';

try {
  // ... something that triggers the SIWS flow ...
} catch (err) {
  if (err instanceof SiwsError) {
    switch (err.type) {
      case 'session-check-failed': // session() threw
      case 'nonce-fetch-failed':   // nonce() threw
      case 'sign-rejected':        // user rejected the sign request
      case 'verify-failed':        // verify() returned null
      case 'session-mismatch':     // returned session address/network doesn't match
      case 'session-expired':      // returned session is expired
      case 'timeout':              // nonce() or verify() timed out
      case 'max-retries-exceeded': // too many failed attempts
      case 'cancelled':            // user clicked Cancel
    }
  }
}
```

---

## Server-side API contract

Your backend needs these endpoints (names are suggestions — match them in your `SiwsConfig`):

### `GET /api/siws/nonce`

Returns a server-issued nonce (single-use, TTL-bounded):

```json
{ "nonce": "a1b2c3d4e5f6..." }
```

### `GET /api/siws/session`

Returns the current session (read from the httpOnly cookie):

```json
{
  "network": "TESTNET",
  "address": "G...",
  "expiry": 1234567890000,
  "metadata": { "statement": "Sign in to My App" }
}
```

Or `{ "authenticated": false }` if no session.

### `POST /api/siws/verify`

Receives `{ message, signedMessage, signedData, signerAddress, nonce }`, verifies with `verifySiws()`, sets an httpOnly session cookie, and returns the `SiwsSession` shape:

```json
{
  "network": "TESTNET",
  "address": "G...",
  "expiry": 1234567890000,
  "metadata": { "statement": "Sign in to My App" }
}
```

### `POST /api/siws/logout`

Clears the session cookie. Returns `{ "ok": true }`.

---

## Security considerations

- **Address binding**: the SDK validates that the `SiwsSession.address` matches the connected wallet's address — a session issued for one address can't be used by another.
- **Network binding**: the SDK validates that the `SiwsSession.network` matches the connected wallet's network — a Testnet session can't be used on Mainnet.
- **Expiry auto-check**: the `siwsSession` getter auto-clears expired sessions. Don't cache the value — always read the getter.
- **Signout on disconnect**: `signoutOnDisconnect: true` (default) prevents orphaned server sessions — when the wallet disconnects, the server session is cleared via `signout()`.
- **Nonce timeout**: `timeoutMs` (default 15s) prevents hanging on unresponsive servers.
- **Single-use nonces**: in production, store nonces server-side with a TTL and delete them on use to prevent replay attacks.
- **httpOnly cookies**: the session cookie must be `httpOnly` so client-side JS can't read it. The client checks auth status via `GET /api/siws/session`.
