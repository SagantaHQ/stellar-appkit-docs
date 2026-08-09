---
title: Theming
description: 5 built-in themes (minimal, stellar, sky, ocean, sunset) with dark + light variants, plus full CSS custom property overrides.
---

## Built-in themes

Stellar AppKit ships with **5 named themes**, each with a **dark** and **light** variant. Themes are built by overriding CSS variables on top of a shared neutral base — no file size increase, just different accent colors.

The default theme (`minimal`) uses a **neutral near-black/near-white accent** that blends into any host website. Inspired by Apple, Linear, and Vercel's neutral UI language — no brand color, so the component looks native wherever it's embedded.

| Theme | Accent (dark) | Accent (light) | Vibe |
|---|---|---|---|
| **`minimal`** (default) | `#FAFAFA` near-white | `#18181B` near-black | Neutral, fits any project (Apple/Linear/Vercel style) |
| **`stellar`** | `#6EE7B7` mint green | `#0E9A6E` forest green | The Stellar brand theme |
| **`sky`** | `#38BDF8` sky blue | `#0EA5E9` sky blue | Light, airy, friendly |
| **`ocean`** | `#60A5FA` ocean blue | `#1D4ED8` deep blue | Serious, financial, trustworthy |
| **`sunset`** | `#FB7185` coral | `#E11D48` rose | Warm, energetic, creative |

### Base palette (zinc neutrals)

All themes share the same neutral base palette — only the accent changes:

| Token | Dark | Light |
|---|---|---|
| `colorBg` | `#09090B` | `#FFFFFF` |
| `colorSurface` | `#18181B` | `#F8F8F8` |
| `colorSurfaceHover` | `#27272A` | `#F1F1F1` |
| `colorBorder` | `#27272A` | `#E4E4E7` |
| `colorText` | `#FAFAFA` | `#18181B` |
| `colorTextMuted` | `#A1A1AA` | `#71717A` |
| `colorDanger` | `#DC2626` | `#DC2626` |

### Usage

```html
<!-- Default (minimal dark) — no theme attribute needed -->
<stellar-appkit-modal></stellar-appkit-modal>

<!-- Named themes (dark variant by default) -->
<stellar-appkit-modal theme="minimal"></stellar-appkit-modal>
<stellar-appkit-modal theme="stellar"></stellar-appkit-modal>
<stellar-appkit-modal theme="sky"></stellar-appkit-modal>
<stellar-appkit-modal theme="ocean"></stellar-appkit-modal>
<stellar-appkit-modal theme="sunset"></stellar-appkit-modal>

<!-- Light variant of a named theme (append :light) -->
<stellar-appkit-modal theme="sky:light"></stellar-appkit-modal>
<stellar-appkit-modal theme="ocean:light"></stellar-appkit-modal>

<!-- Follow system color scheme (minimal dark/light) -->
<stellar-appkit-modal theme="auto"></stellar-appkit-modal>
```

### Importing themes in JS/TS

```ts
import {
  minimalDark, minimalLight,
  stellarDark, stellarLight,
  skyDark, skyLight,
  oceanDark, oceanLight,
  sunsetDark, sunsetLight,
  THEME_NAMES,
  type ThemeName,
} from '@saganta/stellar-appkit-ui-web';
```

### Backwards compatibility

The old `theme="dark"` and `theme="light"` values still work — they map to `minimalDark` and `minimalLight` respectively. Existing apps don't need to change anything.

## CSS custom properties

For fine-grained control, override any individual token via CSS custom properties on the modal element:

```css
stellar-appkit-modal {
  --sak-color-bg: #0B0D0E;
  --sak-color-surface: #14171A;
  --sak-color-border: rgba(255,255,255,0.08);
  --sak-color-text: #F5F6F7;
  --sak-color-text-muted: #9AA0A6;
  --sak-color-accent: #3B82F6;
  --sak-radius-sm: 10px;
  --sak-radius-lg: 20px;
  --sak-font-display: 'Geist Sans', ui-sans-serif, system-ui;
  --sak-font-mono: 'Geist Mono', ui-monospace;
  --sak-logo-url: url('/brand/logo.svg');
}
```

CSS custom property overrides take precedence over the `theme` attribute — you can use a named theme as a starting point and override just the accent or any other token.

## All attributes

| Attribute | Values | Default |
|---|---|---|
| `mode` | `auto` \| `modal` \| `bottom-sheet` \| `inline` | `auto` |
| `theme` | `minimal` \| `stellar` \| `sky` \| `ocean` \| `sunset` \| `auto` \| `dark` \| `light` (optionally append `:light`/`:dark`) | `minimal` |
| `branding` | `show` \| `hide` | `show` |
| `logo-src` | image URL | — |
| `title` | string | contextual |
| `auto-retry-network` | `true` \| `false` | `false` |
| `stellar-expert-avatars` | `true` \| `false` | `false` |
