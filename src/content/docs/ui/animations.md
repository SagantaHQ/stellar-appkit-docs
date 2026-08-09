---
title: Animations
description: WAAPI open/close transitions — 7 presets, zero dependencies, prefers-reduced-motion respected.
---

## Overview

The `<stellar-appkit-modal>` uses the native Web Animations API (WAAPI) for open/close transitions. Zero dependencies — no `motion`, `gsap`, or any other animation library. WAAPI is supported in every modern browser (Chrome 84+, Firefox 75+, Safari 13.1+) and runs off the main thread for transform/opacity, so transitions stay smooth even when JS is busy.

## Presets

| Preset | Open | Close | Default for |
|---|---|---|---|
| `none` | instant | instant | — |
| `fade` | opacity 0→1 | opacity 1→0 | — |
| `scale` | opacity 0→1, scale .92→1 | opacity 1→0, scale 1→.94 | — |
| `scale-blur` | opacity 0→1, scale .92→1, blur 12px→0 | opacity 1→0, scale 1→.94, blur 0→12px | `modal` (desktop) |
| `slide-up` | translateY 100%→0, opacity 0→1 | translateY 0→100%, opacity 1→0 | `bottomsheet` (mobile) |
| `slide-left` | translateX 80px→0, opacity 0→1 | translateX 0→80px, opacity 1→0 | — |
| `implode` | scale 1.25 + rotate 8deg + blur 20px → scale 1 | reverse, with -4deg rotation on exit | — |

## Default animations

When no `animation` / `animation-open` / `animation-close` attribute is set, the modal picks a sensible default based on `mode`:

- `mode="modal"` (or `auto` on desktop) → `scale-blur`
- `mode="bottomsheet"` (or `auto` on mobile) → `slide-up`
- `mode="inline"` → no animation (always rendered in place)

The close animation mirrors the open animation by default — closing a bottom-sheet slides it down rather than fading out.

## Configuration

### Per-modal (HTML attributes)

```html
<!-- Single preset for both open and close -->
<stellar-appkit-modal animation="implode"></stellar-appkit-modal>

<!-- Separate open and close presets -->
<stellar-appkit-modal
  animation-open="slide-left"
  animation-close="fade"
></stellar-appkit-modal>
```

### Global (StellarAppKit config)

```ts
import { StellarAppKit } from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  modal: { animation: 'scale-blur' },  // default for all modals attached to this client
});
```

### Via framework wrapper props

```tsx
// React / Solid
<StellarAppKitModal
  animation="implode"
  animationOpen="slide-left"
  animationClose="fade"
/>
```

```vue
<!-- Vue -->
<StellarAppKitModal
  animation="implode"
  animation-open="slide-left"
  animation-close="fade"
/>
```

### Configuration priority

When multiple animation configs are present, they resolve in this order (highest → lowest):

1. `animation-open` / `animation-close` attributes (per-direction override)
2. `animation` attribute (single preset for both directions)
3. `StellarAppKit` config: `modal.animation` (programmatic, set at construction time)
4. Mode-based defaults

## Accessibility — `prefers-reduced-motion`

Every preset checks `prefers-reduced-motion: reduce` before running. If the user has reduced motion enabled in their OS settings (System Preferences → Accessibility → Display → Reduce Motion on macOS, or Settings → Accessibility → Motion on Windows), the preset returns `null` and the modal opens/closes instantly with no transition.

The check is SSR-safe (returns `false` in Node.js, since `window.matchMedia` doesn't exist there).

```ts
// The check (simplified)
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

## Interruption handling

A single `activeAnimation: Animation | null` field tracks the in-flight WAAPI animation. `cancelActiveAnimation()` is called at the start of both `open()` and `close()` — so if the user opens while a close is in flight (or vice versa), the previous animation is cancelled cleanly rather than fighting the new one.

A 500ms safety timeout on `close()` ensures the modal tears down even if `onfinish` doesn't fire (which can happen if the element is removed mid-animation).

## Coexistence with drag-to-dismiss

The bottom-sheet uses **two separate animation systems** that don't conflict:

1. **WAAPI** handles programmatic open/close (button clicks, Escape key, `.close()` from code)
2. **Spring** handles user-initiated drag-to-dismiss (custom 30-line engine on native Pointer Events + `requestAnimationFrame`)

When a drag-dismiss completes, the spring has already animated the panel off-screen — so `close(true)` is called with `skipAnimation=true` to bypass the WAAPI exit (otherwise it would jump back to translateY(0) and slide down again, causing a visible flash).

```ts
// The close() method signature
close(skipAnimation = false): void
```

## File structure

```
packages/ui-web/src/ui-web/animations/
  index.ts              # public exports
  types.ts              # AnimationPresetName, ModalAnimationOption, AnimationPreset
  resolver.ts           # resolveAnimation(option, defaultOpen, defaultClose)
  reduced-motion.ts     # SSR-safe prefers-reduced-motion check
  presets/
    index.ts            # none, fade, scale, slide-left, implode
    scale-blur.ts       # default modal preset
    slide-up.ts         # default bottom-sheet preset
```

## Live demo

Try every animation preset on the [Animation Presets demo](https://demos.stellar-appkit.saganta.com/demos/animations) — pick separate open and close animations, choose modal or bottomsheet mode, and open the modal to see the transition in action.
