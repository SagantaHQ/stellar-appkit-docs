---
title: Theme Builder
description: Build your custom Stellar AppKit modal theme visually — pick colors, radii, and fonts, then copy the generated CSS snippet into your app.
---

import ThemeBuilder from '../../components/ThemeBuilder.astro';

<ThemeBuilder />

## How theming works

Every color, radius, and font in the `<stellar-appkit-modal>` is a CSS custom property on the host element. Override any of them from your own stylesheet — no JS API needed. The styles cross the shadow boundary for the host element itself.

```css
stellar-appkit-modal {
  --sak-color-bg: #0B0D0E;
  --sak-color-surface: #14171A;
  --sak-color-accent: #6EE7B7;
  --sak-color-text: #F5F6F7;
  --sak-color-text-muted: #9aa0a6;
  --sak-radius-lg: 20px;
  --sak-radius-md: 12px;
  --sak-radius-sm: 8px;
  --sak-font-display: 'Geist Sans', sans-serif;
  --sak-font-mono: 'Geist Mono', monospace;
}
```

The `theme` attribute (`dark` | `light` | `auto`) switches the base palette; individual tokens layer on top. Use `theme="auto"` to follow the user's system preference.

## Available tokens

| Token | What it controls |
|---|---|
| `--sak-color-bg` | Modal background (the deepest layer) |
| `--sak-color-surface` | Card/panel surface (header, rows, buttons) |
| `--sak-color-surface-hover` | Hover state for rows and buttons |
| `--sak-color-accent` | Accent color (CTAs, links, focus rings, active states) |
| `--sak-color-accent-hover` | Hover state for accent buttons |
| `--sak-color-text` | Primary text |
| `--sak-color-text-muted` | Secondary text (labels, descriptions) |
| `--sak-color-border` | Border color (dividers, input borders) |
| `--sak-color-overlay` | Backdrop overlay color (rgba) |
| `--sak-radius-lg` | Large radius (modal container, big cards) |
| `--sak-radius-md` | Medium radius (buttons, inputs) |
| `--sak-radius-sm` | Small radius (badges, pills) |
| `--sak-font-display` | Display font (headings, titles) |
| `--sak-font-body` | Body font (paragraphs, labels) |
| `--sak-font-mono` | Monospace font (addresses, hashes) |

## Per-modal vs global

You can set tokens globally (on `:root` or `body`) or per-modal (on the `stellar-appkit-modal` element itself). Per-modal tokens override global ones — useful when you want a different theme for a specific modal (e.g. a dark theme globally but a light theme for one embedded modal).

```css
/* Global — applies to every modal on the page */
stellar-appkit-modal {
  --sak-color-accent: #6EE7B7;
}

/* Per-modal — overrides the global */
.modal-on-hero stellar-appkit-modal {
  --sak-color-accent: #d4537e;
}
```

## Framework-specific usage

<details>
<summary>React / Solid (inline style)</summary>

```tsx
<StellarAppKitModal
  style={{
    '--sak-color-bg': '#0B0D0E',
    '--sak-color-accent': '#6EE7B7',
  } as React.CSSProperties}
/>
```
</details>

<details>
<summary>Vue (inline style)</summary>

```vue
<StellarAppKitModal :style="{ '--sak-color-bg': '#0B0D0E', '--sak-color-accent': '#6EE7B7' }" />
```
</details>

<details>
<summary>Svelte (on the raw element)</summary>

```svelte
<stellar-appkit-modal use:stellarmodal style="--sak-color-bg: #0B0D0E; --sak-color-accent: #6EE7B7;" />
```
</details>

Use the Theme Builder above to experiment with token values, then copy the generated CSS snippet into your app.
