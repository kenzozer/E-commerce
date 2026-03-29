import type { GlyphPosition, AnimatedGlyph, EffectFn, EffectParams, EffectName } from './types.ts'
import { easings } from './easing.ts'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function glyphToAnimated(g: GlyphPosition, opacity = 1, scale = 1, rotation = 0): AnimatedGlyph {
  return { char: g.char, x: g.x, y: g.y, width: g.width, opacity, scale, rotation }
}

// === MORPH ===
// Smooth interpolation between two layout positions
const morph: EffectFn = (from, to, t, _time, params) => {
  const ease = easings[params.easing]
  const result: AnimatedGlyph[] = []
  const maxLen = Math.max(from.length, to.length)

  for (let i = 0; i < maxLen; i++) {
    const f = from[i]
    const tg = to[i]

    if (f && tg) {
      // Both exist — interpolate
      const staggerOffset = params.stagger > 0 ? (i / maxLen) * (params.stagger / 100) : 0
      const localT = clamp((t - staggerOffset) / (1 - staggerOffset + 0.001), 0, 1)
      const et = ease(localT)

      result.push({
        char: tg.char,
        x: lerp(f.x, tg.x, et),
        y: lerp(f.y, tg.y, et),
        width: lerp(f.width, tg.width, et),
        opacity: 1,
        scale: 1,
        rotation: 0,
      })
    } else if (tg) {
      // New glyph in target — fade in
      const localT = clamp((t - 0.5) * 2, 0, 1)
      result.push(glyphToAnimated(tg, ease(localT)))
    } else if (f) {
      // Glyph removed — fade out
      const localT = clamp(t * 2, 0, 1)
      result.push(glyphToAnimated(f, 1 - ease(localT)))
    }
  }

  return result
}

// === EXPLODE ===
// Characters scatter outward from center with rotation
const explode: EffectFn = (from, to, t, _time, params) => {
  const ease = easings[params.easing]
  const result: AnimatedGlyph[] = []

  // Find center of the "from" layout
  let cx = 0, cy = 0
  for (const g of from) { cx += g.x; cy += g.y }
  cx /= from.length || 1
  cy /= from.length || 1

  const radius = params.scatterRadius
  const rotIntensity = params.rotationIntensity

  for (let i = 0; i < from.length; i++) {
    const f = from[i]!
    const staggerOffset = params.stagger > 0 ? (i / from.length) * (params.stagger / 100) : 0
    const localT = clamp((t - staggerOffset) / (1 - staggerOffset + 0.001), 0, 1)
    const et = ease(localT)

    // Direction from center
    const dx = f.x - cx
    const dy = f.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const angle = Math.atan2(dy, dx)

    // Add some randomness (seeded by index)
    const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const randAngle = (seed - Math.floor(seed)) * Math.PI * 2
    const randRadius = ((Math.sin(i * 269.5 + 183.3) * 43758.5453) % 1) * 0.5 + 0.75

    const scatterX = Math.cos(angle + randAngle * 0.3) * radius * randRadius * et
    const scatterY = Math.sin(angle + randAngle * 0.3) * radius * randRadius * et

    result.push({
      char: f.char,
      x: f.x + scatterX,
      y: f.y + scatterY,
      width: f.width,
      opacity: 1 - et * 0.8,
      scale: 1 + et * 0.5,
      rotation: et * rotIntensity * (i % 2 === 0 ? 1 : -1),
    })
  }

  return result
}

// === POUR / CASCADE ===
// Glyphs fall from above into their final positions, staggered by line and x
const pour: EffectFn = (_from, to, t, _time, params) => {
  const ease = easings[params.easing]
  const result: AnimatedGlyph[] = []

  if (to.length === 0) return result

  const maxLine = to[to.length - 1]!.lineIndex

  for (let i = 0; i < to.length; i++) {
    const tg = to[i]!
    // Stagger: earlier lines and left-most characters arrive first
    const lineDelay = maxLine > 0 ? (tg.lineIndex / (maxLine + 1)) * 0.6 : 0
    const xDelay = (tg.x / 1000) * 0.15
    const totalDelay = lineDelay + xDelay
    const localT = clamp((t - totalDelay) / (1 - totalDelay + 0.001), 0, 1)
    const et = ease(localT)

    const startY = tg.y - 300 - Math.random() * 100

    result.push({
      char: tg.char,
      x: tg.x,
      y: lerp(startY, tg.y, et),
      width: tg.width,
      opacity: et,
      scale: lerp(0.3, 1, et),
      rotation: lerp(-0.5 * (i % 2 === 0 ? 1 : -1), 0, et),
    })
  }

  return result
}

// === WAVE ===
// Continuous sine wave displacement — not a transition, an idle animation
const wave: EffectFn = (_from, to, _t, time, params) => {
  const result: AnimatedGlyph[] = []
  const amp = params.waveAmplitude
  const freq = params.waveFrequency
  const speed = params.waveSpeed

  for (let i = 0; i < to.length; i++) {
    const tg = to[i]!
    const phase = i * freq * 0.1 + time * speed * 0.001
    const yOffset = Math.sin(phase) * amp
    const xOffset = Math.cos(phase * 0.7) * amp * 0.3

    result.push({
      char: tg.char,
      x: tg.x + xOffset,
      y: tg.y + yOffset,
      width: tg.width,
      opacity: 1,
      scale: 1 + Math.sin(phase * 1.3) * 0.05,
      rotation: Math.sin(phase * 0.8) * 0.05,
    })
  }

  return result
}

// === TYPEWRITER ===
// Characters appear one by one with a cursor-like reveal
const typewriter: EffectFn = (_from, to, t, _time, params) => {
  const ease = easings[params.easing]
  const result: AnimatedGlyph[] = []

  for (let i = 0; i < to.length; i++) {
    const tg = to[i]!
    const threshold = i / to.length
    const localT = clamp((t - threshold) * to.length * 0.3, 0, 1)
    const et = ease(localT)

    result.push({
      char: tg.char,
      x: tg.x,
      y: tg.y + (1 - et) * 8,
      width: tg.width,
      opacity: et,
      scale: lerp(0.8, 1, et),
      rotation: 0,
    })
  }

  return result
}

// === VORTEX ===
// Characters spiral inward/outward from a central point, landing exactly at target positions
const vortex: EffectFn = (_from, to, t, _time, params) => {
  const ease = easings[params.easing]
  const result: AnimatedGlyph[] = []

  if (to.length === 0) return result

  // Center of target layout
  let cx = 0, cy = 0
  for (const g of to) { cx += g.x + g.width / 2; cy += g.y }
  cx /= to.length
  cy /= to.length

  for (let i = 0; i < to.length; i++) {
    const tg = to[i]!
    const staggerOffset = params.stagger > 0 ? (i / to.length) * (params.stagger / 100) : 0
    const localT = clamp((t - staggerOffset) / (1 - staggerOffset + 0.001), 0, 1)
    const et = ease(localT)

    // Compute spiral start position (at t=0, all glyphs orbit near center)
    const dx = tg.x - cx
    const dy = tg.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    const spiralAngle = angle + (1 - et) * Math.PI * 3
    const spiralDist = dist * (1 - et)

    // Spiral position: offset from the final target, NOT reconstructed from polar
    const spiralX = cx + Math.cos(spiralAngle) * spiralDist
    const spiralY = cy + Math.sin(spiralAngle) * spiralDist

    // Lerp between spiral position and exact target — guarantees clean landing
    result.push({
      char: tg.char,
      x: lerp(spiralX, tg.x, et),
      y: lerp(spiralY, tg.y, et),
      width: tg.width,
      opacity: clamp(et * 2, 0, 1),
      scale: lerp(0.1, 1, et),
      rotation: (1 - et) * Math.PI * 2 * (i % 2 === 0 ? 1 : -1),
    })
  }

  return result
}

export const effects: Record<EffectName, EffectFn> = {
  morph,
  explode,
  pour,
  wave,
  typewriter,
  vortex,
}
