import type { RulerStepContext, RulerSteps } from './types'

const NICE_FACTORS = [1, 2, 5]

function findNiceStep(minimumWorldStep: number): number {
  if (!Number.isFinite(minimumWorldStep) || minimumWorldStep <= 0) {
    return 1
  }
  const exponent = Math.floor(Math.log10(minimumWorldStep))
  const base = 10 ** exponent
  const normalized = minimumWorldStep / base
  const factor = NICE_FACTORS.find((candidate) => candidate >= normalized)
  return (factor ?? 10) * base
}

export function calculateRulerSteps(context: RulerStepContext): RulerSteps {
  const pxPerWorld = context.zoom * context.pixelsPerUnit
  const major = findNiceStep(context.minimumMajorTickPx / pxPerWorld)
  const preferredMinor = major / 5
  const minor = preferredMinor * pxPerWorld >= context.minimumMinorTickPx ? preferredMinor : major / 2
  return { major, minor }
}
