import type { DesignerRect, DesignerSnapCandidate, DesignerSnapLine, DesignerSnapResult, ResizeHandle } from './types'

interface AxisSnap {
  delta: number
  line: DesignerSnapLine
}

function findBestSnap(
  axis: 'x' | 'y',
  anchors: number[],
  candidates: DesignerSnapCandidate[],
  threshold: number,
  gridSize: number
): AxisSnap | undefined {
  let best: AxisSnap | undefined

  const inspect = (anchor: number, candidate: DesignerSnapCandidate): void => {
    const delta = candidate.position - anchor
    if (Math.abs(delta) > threshold) return
    if (!best || Math.abs(delta) < Math.abs(best.delta)) {
      best = { delta, line: { ...candidate } }
    }
  }

  for (const anchor of anchors) {
    for (const candidate of candidates) {
      if (candidate.axis === axis) inspect(anchor, candidate)
    }
  }
  if (best) return best

  if (gridSize > 0) {
    for (const anchor of anchors) {
      const position = Math.round(anchor / gridSize) * gridSize
      inspect(anchor, { axis, position, source: 'grid' })
    }
  }
  return best
}

export function snapMoveRect(
  rect: DesignerRect,
  candidates: DesignerSnapCandidate[],
  threshold: number,
  gridSize = 0
): DesignerSnapResult {
  const xSnap = findBestSnap(
    'x',
    [rect.left, rect.left + rect.width / 2, rect.left + rect.width],
    candidates,
    threshold,
    gridSize
  )
  const ySnap = findBestSnap(
    'y',
    [rect.top, rect.top + rect.height / 2, rect.top + rect.height],
    candidates,
    threshold,
    gridSize
  )
  const left = rect.left + (xSnap?.delta ?? 0)
  const top = rect.top + (ySnap?.delta ?? 0)
  return {
    rect: { ...rect, x: left, y: top, left, top },
    lines: [xSnap?.line, ySnap?.line].filter((line): line is DesignerSnapLine => Boolean(line))
  }
}

export function snapResizeRect(
  rect: DesignerRect,
  handle: ResizeHandle,
  candidates: DesignerSnapCandidate[],
  threshold: number,
  gridSize = 0
): DesignerSnapResult {
  const xAnchors = handle.includes('w') ? [rect.left] : handle.includes('e') ? [rect.left + rect.width] : []
  const yAnchors = handle.includes('n') ? [rect.top] : handle.includes('s') ? [rect.top + rect.height] : []
  const xSnap = xAnchors.length ? findBestSnap('x', xAnchors, candidates, threshold, gridSize) : undefined
  const ySnap = yAnchors.length ? findBestSnap('y', yAnchors, candidates, threshold, gridSize) : undefined

  let { left, top, width, height } = rect
  if (xSnap) {
    if (handle.includes('w')) {
      left += xSnap.delta
      width -= xSnap.delta
    } else {
      width += xSnap.delta
    }
  }
  if (ySnap) {
    if (handle.includes('n')) {
      top += ySnap.delta
      height -= ySnap.delta
    } else {
      height += ySnap.delta
    }
  }

  return {
    rect: { x: left, y: top, left, top, width, height },
    lines: [xSnap?.line, ySnap?.line].filter((line): line is DesignerSnapLine => Boolean(line))
  }
}
