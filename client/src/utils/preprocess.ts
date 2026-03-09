// AI Exam Proctoring — Preprocessing
// Zero-copy: video frame → Float32Array [1,3,640,640] normalized [0,1]

import { AI_CONFIG } from './aiTypes'

const { MODEL_INPUT_SIZE } = AI_CONFIG

// Set to true if model expects [0,1] normalized input
// Set to false for models that expect [0,255] raw pixel values
const NORMALIZE_INPUT = true

// Cached canvas for frame capture — avoids recreating every frame (GC / perf)
let _captureCanvas: HTMLCanvasElement | OffscreenCanvas | null = null
let _captureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null
let _captureSize = 0

/**
 * Extract raw pixels from video (fast, main thread).
 * Returns Uint8ClampedArray which can be zero-copy transferred to Worker.
 */
export function captureImageData(source: HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas): Uint8ClampedArray {
  const size = MODEL_INPUT_SIZE

  // Create canvas once and reuse across frames
  if (!_captureCanvas || !_captureCtx || _captureSize !== size) {
    if (typeof OffscreenCanvas !== 'undefined') {
      _captureCanvas = new OffscreenCanvas(size, size)
      _captureCtx = _captureCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D
    } else {
      const c = document.createElement('canvas')
      c.width = size
      c.height = size
      _captureCanvas = c
      _captureCtx = c.getContext('2d', { willReadFrequently: true })
    }
    _captureSize = size
  }

  if (!_captureCtx) {
    throw new Error('Failed to get canvas 2D context for preprocessing')
  }

  // Draw source onto cached canvas, resizing to 640x640
  _captureCtx.drawImage(source as CanvasImageSource, 0, 0, size, size)

  // Extract RGBA pixel data
  return _captureCtx.getImageData(0, 0, size, size).data
}

/**
 * Heavy computation: Uint8ClampedArray -> Float32Array [1, 3, 640, 640].
 * Runs inside Web Worker to avoid blocking UI thread.
 */
export function preprocessImageData(pixels: Uint8ClampedArray): Float32Array {
  const size = AI_CONFIG.MODEL_INPUT_SIZE
  const totalPixels = size * size
  const tensor = new Float32Array(3 * totalPixels)

  const scale = NORMALIZE_INPUT ? 1.0 / 255.0 : 1.0
  for (let i = 0; i < totalPixels; i++) {
    const srcIdx = i * 4
    tensor[i] = pixels[srcIdx] * scale
    tensor[totalPixels + i] = pixels[srcIdx + 1] * scale
    tensor[2 * totalPixels + i] = pixels[srcIdx + 2] * scale
  }

  return tensor
}
