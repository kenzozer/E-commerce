# Typexperiments

Kinetic typography engine powered by [Pretext](https://github.com/chenglou/pretext) — a fast, accurate text measurement library in pure TypeScript that bypasses DOM reflow entirely.

Since Pretext computes exact line breaks and character widths at any container size without touching the DOM, we can lay out text at two different widths simultaneously, map every character between them, and animate the transition per-glyph on Canvas.

## Effects

- **Morph** — Smoothly animate text between two container widths. Characters slide into new positions as line breaks shift.
- **Explode** — Characters scatter outward with rotation and fade, then reassemble.
- **Pour** — Text cascades into position line by line with elastic easing.
- **Wave** — Continuous sine-wave displacement across all characters.
- **Typewriter** — Characters appear one by one with a reveal animation.
- **Vortex** — Characters spiral outward from center into their final positions.

All effects have adjustable duration, stagger, and easing via the control panel.

## Running locally

```bash
npm install
npm run dev
```

Requires [Pretext](https://github.com/chenglou/pretext) — install from npm:

```bash
npm install @chenglou/pretext
```

## How it works

1. **Prepare** — `prepareWithSegments(text, font)` analyzes and measures text once via canvas (no DOM reflow)
2. **Layout** — `layoutWithLines(prepared, width, lineHeight)` computes line breaks at any width in ~0.09ms
3. **Map** — Walk each line's text to compute per-character (x, y) positions using cumulative `measureText`
4. **Animate** — Interpolate between two sets of positions on a `requestAnimationFrame` loop
5. **Render** — Draw each glyph to Canvas 2D with per-character transforms (position, opacity, scale, rotation)

The key insight: steps 1-2 are so fast that we can recompute layout at a new width on every slider drag and animate the transition in real time.

## Credits

Built on [Pretext](https://github.com/chenglou/pretext) by [Cheng Lou](https://github.com/chenglou).

Made by [Pablo Stanley](https://pablostanley.substack.com/).
