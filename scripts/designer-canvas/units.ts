import { calculateRulerSteps } from './ruler-scale'
import type { DesignerUnit } from './types'

function round(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export const pixelUnit: DesignerUnit = {
  name: 'pixel',
  symbol: 'px',
  pixelsPerUnit: 1,
  precision: 0,
  nudgeStep: 1,
  nudgeStepLarge: 10,
  normalize: (value) => Math.round(value),
  format: (value) => `${Math.round(value)}`,
  getRulerSteps: calculateRulerSteps
}

export const millimeterUnit: DesignerUnit = {
  name: 'millimeter',
  symbol: 'mm',
  pixelsPerUnit: 96 / 25.4,
  precision: 2,
  nudgeStep: 0.1,
  nudgeStepLarge: 1,
  normalize: (value) => round(value, 2),
  format: (value) => `${round(value, 2)}`,
  getRulerSteps: calculateRulerSteps
}
