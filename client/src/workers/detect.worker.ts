// AI Exam Proctoring — Detect Worker
// Web Worker for YOLOv26n phone/person detection
// Dynamic import: tries 'onnxruntime-web/webgpu' (desktop) → falls back to 'onnxruntime-web' (phones)

import { WorkerInitMessage, WorkerDetectMessage, AI_CONFIG, __AI_DEV__ } from '../utils/aiTypes'
import { CLASS_LABELS } from '../utils/classes'
import { postprocessDetections } from '../utils/postprocess'
import { preprocessImageData } from '../utils/preprocess'
import type { InferenceSession } from 'onnxruntime-web'

const { MODEL_INPUT_SIZE, DETECT_CONFIDENCE_THRESHOLD } = AI_CONFIG

let ort: typeof import('onnxruntime-web')
let session: InferenceSession | null = null
let activeProvider = 'unknown'
let inputName = 'images'
let outputName = 'output0'
let _hasWebGPU = false

const MODEL_CACHE_NAME = 'ai-proctoring-models-v1'

// Helper: send log to main thread for toast display
function sendLog(message: string) {
  self.postMessage({ type: 'log', message })
}

// ─── Dynamic ORT loader: WebGPU on desktop, standard on phones ───
async function loadOnnxRuntime(): Promise<void> {
  const cores = navigator.hardwareConcurrency || 2
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const hasGPU = 'gpu' in navigator

  // Desktop with WebGPU support → try /webgpu variant for best performance
  if (!isMobile && hasGPU) {
    try {
      sendLog('🖥️ Detect: Desktops → thử onnxruntime-web/webgpu...')
      const webgpuOrt = await import('onnxruntime-web/webgpu')
      ort = webgpuOrt as any
      _hasWebGPU = true
      sendLog('✅ Detect: Loaded onnxruntime-web/webgpu')
    } catch (e: any) {
      sendLog(`⚠️ Detect: /webgpu import thất bại: ${e.message?.slice(0, 80)}`)
      // Fall through to standard import
    }
  }

  // Fallback: standard onnxruntime-web (works on ALL browsers)
  if (!ort) {
    sendLog('📱 Detect: Dùng onnxruntime-web (standard)...')
    ort = await import('onnxruntime-web')
    _hasWebGPU = false
    sendLog('✅ Detect: Loaded onnxruntime-web (standard)')
  }

  // Configure WASM safely
  const hasCOI = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated
  ort.env.wasm.numThreads = (hasCOI && cores > 2) ? Math.min(cores, 4) : 1
  ort.env.wasm.simd = false // start safe, will try SIMD in fallback
  ort.env.wasm.proxy = false

  sendLog(`🔧 Detect: cores=${cores}, mobile=${isMobile}, GPU=${hasGPU}, COI=${hasCOI}, webgpu=${_hasWebGPU}`)
}

async function fetchModelWithCache(url: string): Promise<ArrayBuffer> {
  const cache = await caches.open(MODEL_CACHE_NAME)
  let response = await cache.match(url)

  if (!response) {
    sendLog('📥 Detect: Đang tải model...')
    response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`)
    await cache.put(url, response.clone())
    sendLog('📥 Detect: Tải model xong (cached)')
  } else {
    sendLog('📥 Detect: Dùng model từ cache')
  }

  return await response.arrayBuffer()
}

async function tryCreateSession(modelBuffer: ArrayBuffer, ep: string): Promise<{ session: any; provider: string } | null> {
  try {
    const epStart = performance.now()
    sendLog(`⏳ Detect: Thử EP "${ep}" (simd=${ort.env.wasm.simd}, threads=${ort.env.wasm.numThreads})...`)
    const sess = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: [ep],
      graphOptimizationLevel: 'all'
    })
    const elapsed = (performance.now() - epStart).toFixed(0)
    sendLog(`✅ Detect: EP "${ep}" OK (${elapsed}ms)`)
    return { session: sess, provider: ep }
  } catch (e: any) {
    const errMsg = e?.message || String(e)
    sendLog(`❌ Detect: EP "${ep}" thất bại: ${errMsg.slice(0, 120)}`)
    console.warn(`[Detect Worker] EP '${ep}' failed:`, e)
    return null
  }
}

async function createSessionWithFallback(modelBuffer: ArrayBuffer): Promise<{ session: any; provider: string }> {
  // ─── Build EP list based on what's available ───
  const providers: string[] = []
  if (_hasWebGPU) providers.push('webgpu')
  providers.push('webgl', 'wasm')

  // ─── Pass 1: Try all EPs with current settings ───
  for (const ep of providers) {
    const result = await tryCreateSession(modelBuffer, ep)
    if (result) return result
  }

  // ─── Pass 2: WASM with SIMD ───
  sendLog('🔄 Detect: Thử WASM + SIMD...')
  ort.env.wasm.simd = true
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  const simdResult = await tryCreateSession(modelBuffer, 'wasm')
  if (simdResult) return simdResult

  // ─── Pass 3: WASM no SIMD ───
  sendLog('🔄 Detect: Thử WASM tối thiểu...')
  ort.env.wasm.simd = false
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  const minResult = await tryCreateSession(modelBuffer, 'wasm')
  if (minResult) return minResult

  // ─── Pass 4: CPU EP ───
  sendLog('🔄 Detect: Thử CPU EP...')
  const cpuResult = await tryCreateSession(modelBuffer, 'cpu')
  if (cpuResult) return cpuResult

  throw new Error(`All EPs failed (${providers.join(',')},wasm+simd,wasm-min,cpu). webgpu=${_hasWebGPU}`)
}

async function initModels(detectModelUrl: string) {
  const startTime = performance.now()

  // Load the right ORT variant first
  await loadOnnxRuntime()

  const detectBuffer = await fetchModelWithCache(detectModelUrl)

  console.log('[Detect Worker] Creating detect session...')
  const result = await createSessionWithFallback(detectBuffer)
  session = result.session
  activeProvider = result.provider

  inputName = session.inputNames[0]
  outputName = session.outputNames[0]
  if (__AI_DEV__) console.log(`[Detect Worker] Model — input: "${inputName}", output: "${outputName}"`)

  const warmupTime = performance.now() - startTime
  console.log(`[Detect Worker] Ready! EP: ${activeProvider}, warmup: ${warmupTime.toFixed(0)}ms`)

  return { provider: activeProvider, warmupTimeMs: warmupTime }
}

async function runInference(pixels: Uint8ClampedArray, timestamp: number) {
  if (!session) throw new Error('Detect model not initialized')

  const startTime = performance.now()

  const floatData = preprocessImageData(pixels)
  const inputTensor = new ort.Tensor('float32', floatData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])

  const output = await session.run({ [inputName]: inputTensor })

  const outputData = output[outputName].data as Float32Array
  const outputShape = output[outputName].dims

  const detections = postprocessDetections(
    outputData,
    DETECT_CONFIDENCE_THRESHOLD,
    CLASS_LABELS,
    outputShape as number[]
  )

  if (__AI_DEV__ && detections.length > 0) {
    console.log(
      `[Detect Worker] 📦 ${detections.length} hits:`,
      detections
        .slice(0, 3)
        .map((d) => `${d.label}@${(d.conf * 100).toFixed(1)}%`)
        .join(', ')
    )
  }

  const inferenceTimeMs = performance.now() - startTime

  return { detections, inferenceTimeMs, timestamp }
}

self.onmessage = async (event: MessageEvent<WorkerInitMessage | WorkerDetectMessage>) => {
  const msg = event.data

  try {
    if (msg.type === 'init') {
      const { provider, warmupTimeMs } = await initModels(msg.detectModelUrl)
      self.postMessage({ type: 'ready', executionProvider: provider, warmupTimeMs })
    } else if (msg.type === 'detect') {
      const { detections, inferenceTimeMs, timestamp } = await runInference(msg.imageData, msg.timestamp)

      self.postMessage(
        { type: 'result', detections, keypoints: [], inferenceTimeMs, timestamp },
        { transfer: [msg.imageData.buffer] }
      )
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: (error as Error).message })
  }
}
