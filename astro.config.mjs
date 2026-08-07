import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: 'https://stellar-appkit.saganta.com',
  output: 'static',
  integrations: [
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
    starlight({
      title: 'Stellar AppKit',
      description: 'One SDK for every Stellar wallet — unified wallet API, Soroban built in, transaction previews, and framework wrappers for React, Vue, Solid, and Svelte.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/sagantaHQ/stellar-appkit' },
      ],
      head: [
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'Stellar AppKit' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'robots', content: 'index, follow' } },
        { tag: 'meta', attrs: { name: 'author', content: 'Saganta' } },
        { tag: 'meta', attrs: { name: 'application-name', content: 'Stellar AppKit' } },
        { tag: 'meta', attrs: { name: 'keywords', content: 'Stellar, Soroban, wallet, Web3Modal, AppKit, Freighter, Albedo, xBull, Ledger, WalletConnect, SIWS, Sign-In With Stellar, SEP-43, SEP-0053, React, Vue, Solid, Svelte, TypeScript' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
      ],
      components: {
        Head: './src/components/Head.astro',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Wallet Connection', slug: 'core/wallet-connection' },
            { label: 'Transaction Preview', slug: 'core/transaction-preview' },
            { label: 'Soroban Integration', slug: 'core/soroban' },
            { label: 'Sign-In With Stellar', slug: 'core/siws' },
            { label: 'Theming', slug: 'core/theming' },
          ],
        },
        {
          label: 'Framework Wrappers',
          items: [
            { label: 'React', slug: 'wrappers/react' },
            { label: 'Vue', slug: 'wrappers/vue' },
            { label: 'Solid', slug: 'wrappers/solid' },
            { label: 'Svelte', slug: 'wrappers/svelte' },
            { label: 'Modal Components', slug: 'wrappers/modal-components' },
          ],
        },
        {
          label: 'Soroban Features',
          items: [
            { label: 'Typed Contract Client', slug: 'soroban/typed-client' },
            { label: 'RPC Failover', slug: 'soroban/rpc-failover' },
            { label: 'Contract Badges', slug: 'soroban/badges' },
            { label: 'Fee Estimation', slug: 'soroban/fee-estimation' },
            { label: 'Auth-Entry Signing', slug: 'soroban/auth-entry' },
          ],
        },
        {
          label: 'Wallets',
          items: [
            { label: 'Freighter', slug: 'wallets/freighter' },
            { label: 'Albedo', slug: 'wallets/albedo' },
            { label: 'xBull', slug: 'wallets/xbull' },
            { label: 'Ledger', slug: 'wallets/ledger' },
            { label: 'WalletConnect', slug: 'wallets/walletconnect' },
            { label: 'Hana Wallet', slug: 'wallets/hana' },
          ],
        },
        {
          label: 'UI Components',
          items: [
            { label: 'Modal', slug: 'ui/modal' },
            { label: 'Bottom Sheet', slug: 'ui/bottomsheet' },
            { label: 'Avatars', slug: 'ui/avatars' },
            { label: 'Copy-to-Clipboard', slug: 'ui/copy-clipboard' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', slug: 'reference/api' },
            { label: 'Error Handling', slug: 'reference/errors' },
            { label: 'Bundle Size', slug: 'reference/bundle-size' },
            { label: 'AI Integration', slug: 'reference/ai-integration' },
            { label: 'Changelog', slug: 'reference/changelog' },
          ],
        },
        {
          label: 'Live Demos',
          items: [
            { label: 'Browse Demos →', slug: 'demos' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
