export type GlyphPosition = {
  char: string
  globalIndex: number
  x: number
  y: number
  width: number
  lineIndex: number
  segmentIndex: number
}

export type AnimatedGlyph = {
  char: string
  x: number
  y: number
  width: number
  opacity: number
  scale: number
  rotation: number
}

export type EffectName = 'morph' | 'explode' | 'pour' | 'wave' | 'typewriter' | 'vortex'

export type EffectFn = (
  fromGlyphs: GlyphPosition[],
  toGlyphs: GlyphPosition[],
  t: number,
  time: number,
  params: EffectParams,
) => AnimatedGlyph[]

export type EffectParams = {
  duration: number
  stagger: number
  easing: EasingName
  scatterRadius: number
  rotationIntensity: number
  waveAmplitude: number
  waveFrequency: number
  waveSpeed: number
}

export type EasingName = 'linear' | 'easeInOutCubic' | 'easeOutElastic' | 'easeOutBounce' | 'easeInOutQuad'

export type EasingFn = (t: number) => number
