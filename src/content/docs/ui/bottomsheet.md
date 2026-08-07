---
title: Bottom Sheet
description: Draggable bottom-sheet with custom spring physics — pull down to dismiss, zero dependencies.
---

## Overview

On mobile (viewport ≤ 640px), the modal automatically becomes a bottom-sheet. The sheet slides up from the bottom with a drag handle. The default open/close animation is `slide-up` (translateY 100%→0).

## Drag-to-dismiss

The bottom-sheet supports drag-to-dismiss using a **custom spring engine** built on native Pointer Events + `requestAnimationFrame` (~30 lines of code, zero external dependencies). No `@use-gesture/vanilla` or `motion` needed — everything ships in the box.

Behavior:
- **Drag down** on the sheet moves it with the finger (only vertical drags; horizontal swipes are ignored)
- **Backdrop fades** in sync with the sheet's drag progress
- **Release with velocity > 0.5 px/ms or drag > 40%** of sheet height → closes (animated slide-down + fade via the spring, then WAAPI exit is skipped to avoid a flash)
- **Release otherwise** → springs back to open position
- **Interactive elements stay clickable** — `onPointerDown` checks `e.target.closest('button, a, [data-action], input, select, textarea')` and skips drag setup for those, so the close button, copy buttons, and overflow menu items always receive their `click` events (no pointer-capture interference)
- **`touch-action: pan-y`** prevents browser scroll interference

## Default animation

The bottom-sheet uses the `slide-up` WAAPI preset by default:
- **Open**: translateY(100%) → translateY(0), opacity 0→1
- **Close**: translateY(0) → translateY(100%), opacity 1→0 (slides down)

Override per-modal via HTML attributes:

```html
<saganta-appkit-modal mode="bottomsheet" animation="fade"></saganta-appkit-modal>
```

Or globally via the `StellarAppKit` config:

```ts
const appkit = new StellarAppKit({
  network: 'TESTNET',
  modal: { animation: 'slide-up' },
});
```

See [Modal](/ui/modal/) for the full list of animation presets.

## Coexistence with WAAPI animations

The bottom-sheet uses **two separate animation systems** that don't conflict:

1. **WAAPI** handles programmatic open/close (button clicks, Escape key, `.close()` from code)
2. **Spring** handles user-initiated drag-to-dismiss

When a drag-dismiss completes, the spring has already animated the panel off-screen — so `close(true)` is called with `skipAnimation=true` to bypass the WAAPI exit (otherwise it would jump back to translateY(0) and slide down again, causing a visible flash).

## Forcing bottom-sheet mode

```html
<saganta-appkit-modal mode="bottomsheet"></saganta-appkit-modal>
```

`'bottom-sheet'` (with hyphen) is also accepted as a backwards-compatible alias.

## Forcing modal mode (even on mobile)

```html
<saganta-appkit-modal mode="modal"></saganta-appkit-modal>
```

## Inline mode (no overlay)

```html
<saganta-appkit-modal mode="inline"></saganta-appkit-modal>
```

The panel is always rendered in place with no overlay and no open/close animations. Useful for embedding the wallet UI directly into a page section.
