---
title: API Reference
description: Complete API reference for Stellar AppKit.
---

## StellarAppKit

```ts
class StellarAppKit {
  constructor(config: StellarAppKitConfig)

  // Properties
  readonly registry: ConnectorRegistry
  readonly network: StellarNetwork
  readonly appMetadata?: { name: string; description?: string; url?: string; icons?: string[] }  // v1.5.0+ — WC standard
  readonly siwsConfig?: SiwsConfig                                                                 // v1.4.0+
  readonly modalConfig?: StellarAppKitModalConfig
  onPreviewTransaction: PreviewHandler | null
  onPreviewAuthEntry: AuthEntryPreviewHandler | null
  previewOptions: PreviewOptions

  // Session
  get session(): ConnectSession | null
  get sessions(): ConnectSession[]
  get activeConnector(): WalletConnector | null
  get status(): ConnectStatus
  get pendingSignCount(): number

  // SIWS session (v1.7.0+)
  get siwsSession(): SiwsSession | null          // auto-clears expired
  setSiwsSession(session: SiwsSession | null): void
  clearSiwsSession(): Promise<void>
  signOut(): Promise<void>                       // clears session + disconnects wallet
  requireAuth(): void                            // throws ConnectError if not auth'd
  validateSession(): Promise<SiwsSession | null> // re-check against server
  reauthenticate(): Promise<void>                // clear + trigger fresh sign-in

  // Methods
  connect(walletId: string, opts?): Promise<ConnectSession>
  disconnect(walletId?: string): Promise<void>
  disconnectAll(): Promise<void>
  switchAccount(walletId: string, address?: string): Promise<ConnectSession>
  restore(): Promise<ConnectSession[]>
  dispose(): void

  // Signing (queued)
  signTransaction(xdr: string, opts?): Promise<SignTransactionResult>
  signAuthEntry(authEntryXdr: string, opts?): Promise<SignAuthEntryResult>
  signMessage(message: string, opts?): Promise<SignMessageResult>
  signIn(opts): Promise<SignInResult>

  // Events
  on<K>(event: K, handler): () => void
}
```

## StellarAppKitConfig

```ts
interface StellarAppKitConfig {
  network: StellarNetwork                                          // required
  connectors?: WalletConnector[]                                   // default: defaultConnectors()
  appMetadata?: { name: string; description?: string; url?: string; icons?: string[] }  // v1.5.0+ WC standard
  networkPassphrase?: string                                       // required for STANDALONE
  storage?: ConnectStorage                                         // default: localStorage
  syncAcrossTabs?: boolean                                         // default: true
  onPreviewTransaction?: PreviewHandler
  onPreviewAuthEntry?: AuthEntryPreviewHandler
  previewOptions?: PreviewOptions
  modal?: StellarAppKitModalConfig
  siws?: SiwsConfig                                                // v1.4.0+ — automatic SIWS flow
  locale?: LocaleCode                                              // v1.8.0+ — default: 'en'
}
```

## StellarAppKitEvents

```ts
interface StellarAppKitEvents {
  connect: ConnectSession
  disconnect: { walletId: string }
  sessionsChanged: ConnectSession[]
  accountSwitch: { walletId: string; address: string }
  networkChange: string
  statusChange: ConnectStatus
  signQueueChange: number
  siwsSessionChange: SiwsSession | null    // v1.7.0+
  error: ConnectError
}
```

## SiwsConfig (v1.4.0+)

```ts
interface SiwsConfig {
  statement: string
  session: () => Promise<SiwsSession | null | undefined>
  nonce: () => Promise<string>
  verify: (
    data: { message: string; signedMessage: string; signerAddress: string; signedData?: string; issuedAt: string; expirationTime: string },
    nonce: string,
    context: { address: string; network: string }    // v1.7.0+ — 3rd arg
  ) => Promise<SiwsSession | null | undefined>
  signout: () => Promise<boolean> | boolean
  refresh?: () => Promise<SiwsSession | null | undefined>    // v1.7.0+
  disconnectOnFail?: boolean    // default: true
  signoutOnDisconnect?: boolean // default: true
  maxRetries?: number           // default: 3
  timeoutMs?: number            // default: 15000
}
```

## SiwsSession (v1.7.0+)

```ts
interface SiwsSession {
  network: string          // 'PUBLIC' | 'TESTNET' | 'FUTURENET' | string
  address: string
  expiry: number           // epoch millis — 0/undefined = no expiry
  metadata?: Record<string, unknown>
}
```

## SiwsError (v1.7.0+)

```ts
class SiwsError extends Error {
  readonly type: SiwsErrorType
}

type SiwsErrorType =
  | 'session-check-failed'
  | 'nonce-fetch-failed'
  | 'sign-rejected'
  | 'verify-failed'
  | 'session-mismatch'
  | 'session-expired'
  | 'timeout'
  | 'max-retries-exceeded'
  | 'cancelled'
```

## i18n API (v1.8.0+)

Exported from `@saganta/stellar-appkit`:

```ts
type LocaleCode =
  | 'en' | 'zh-CN' | 'zh-TW' | 'es' | 'pt-BR' | 'ja' | 'ko' | 'de' | 'fr'
  | 'ru' | 'ar' | 'hi' | 'it' | 'tr' | 'pl' | 'vi' | 'id' | 'uk' | 'nl'
  | 'th' | 'he' | 'cs' | 'sv' | 'ro' | 'fa'

function setLocale(code: LocaleCode): Promise<void>           // async — lazy-loads
function getLocale(): LocaleCode                              // sync — returns current
function t(key: string, values?: Record<string, unknown>): string   // translate with ICU
function onLocaleChange(handler: (locale: LocaleCode) => void): () => void  // subscribe
function loadLocale(code: LocaleCode): Promise<LocaleMessages>
function preloadLocale(code: LocaleCode): Promise<void>       // load without switching
function getSupportedLocales(): LocaleCode[]                  // 24 non-English codes
```

## SorobanConnection

```ts
class SorobanConnection {
  constructor(config: SorobanConnectionConfig)

  invoke(opts: InvokeOptions): Promise<InvokeResult>
  previewInvoke(opts: InvokeOptions): Promise<TransactionPreview & {...}>
  estimateFee(xdr: string): Promise<FeeEstimate | null>
  contract<T>(contractId: string, opts): ContractClient<T>
  getFailoverStatus(): Array<{url, healthy, failureCount}> | null

  // Low-level
  simulate(tx): Promise<SimulateResult>
  prepare(tx): Promise<Transaction>
  submit(signedXdr: string): Promise<SendTransactionResponse>
  pollStatus(hash: string, opts?): Promise<GetTransactionResponse>
}
```

## verifySiws

```ts
function verifySiws(
  payload: SiwsPayload,
  opts: VerifySiwsOptions
): Promise<SiwsVerificationResult>
```

## defaultConnectors (v1.0.6+)

```ts
function defaultConnectors(): WalletConnector[]
// Returns [createFreighterConnector(), createAlbedoConnector(), createXBullConnector(), createLedgerConnector()]
// WalletConnect is NOT included — add it explicitly with createWalletConnectConnector()
```

## Networks

```ts
const Networks: {
  PUBLIC: 'Public Global Stellar Network ; September 2015'
  TESTNET: 'Test SDF Network ; September 2015'
  FUTURENET: 'Test SDF Future Network ; October 2022'
  STANDALONE: 'Standalone Network ; February 2017'
}
```
