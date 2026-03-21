// AI Exam Proctoring — Pose Worker
// Web Worker for YOLOv26n head pose estimation

import * as ort from 'onnxruntime-web/webgpu'
import { WorkerInitMessage, WorkerDetectMessage, AI_CONFIG, __AI_DEV__ } from '../utils/aiTypes'
import { CLASS_LABELS } from '../utils/classes'
import { postprocessPose } from '../utils/postprocess'
import { preprocessImageData } from '../utils/preprocess'

// ─── Safe WASM defaults — start with maximum compatibility ───
const _cores = navigator.hardwareConcurrency || 2
ort.env.wasm.numThreads = 1
ort.env.wasm.simd = false
ort.env.wasm.proxy = false

// Enable multi-threading only if crossOriginIsolated and enough cores
const _hasCrossOriginIsolation = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated
if (_hasCrossOriginIsolation && _cores > 2) {
  ort.env.wasm.numThreads = Math.min(_cores, 4)
}

const { MODEL_INPUT_SIZE, POSE_CONFIDENCE_THRESHOLD } = AI_CONFIG

let session: ort.InferenceSession | null = null
let activeProvider = 'unknown'
let inputName = 'images'
let outputName = 'output0'

const MODEL_CACHE_NAME = 'ai-proctoring-models-v1'

// Helper: send log to main thread for toast display
function sendLog(message: string) {
  self.postMessage({ type: 'log', message })
}

async function fetchModelWithCache(url: string): Promise<ArrayBuffer> {
  const cache = await caches.open(MODEL_CACHE_NAME)
  let response = await cache.match(url)

  if (!response) {
    sendLog('📥 Pose: Đang tải model...')
    response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`)
    await cache.put(url, response.clone())
    sendLog('📥 Pose: Tải model xong (cached)')
  } else {
    sendLog('📥 Pose: Dùng model từ cache')
  }

  return await response.arrayBuffer()
}

async function tryCreateSession(modelBuffer: ArrayBuffer, ep: string): Promise<{ session: ort.InferenceSession; provider: string } | null> {
  try {
    const epStart = performance.now()
    sendLog(`⏳ Pose: Thử EP "${ep}" (simd=${ort.env.wasm.simd}, threads=${ort.env.wasm.numThreads})...`)
    const sess = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: [ep],
      graphOptimizationLevel: 'all'
    })
    const elapsed = (performance.now() - epStart).toFixed(0)
    sendLog(`✅ Pose: EP "${ep}" OK (${elapsed}ms)`)
    return { session: sess, provider: ep }
  } catch (e: any) {
    const errMsg = e?.message || String(e)
    sendLog(`❌ Pose: EP "${ep}" thất bại: ${errMsg.slice(0, 120)}`)
    console.warn(`[Pose Worker] EP '${ep}' failed:`, e)
    return null
  }
}

async function createSessionWithFallback(modelBuffer: ArrayBuffer): Promise<{ session: ort.InferenceSession; provider: string }> {
  // ─── Pass 1: Try all EPs with current settings (SIMD off by default) ───
  const providers = ['webgpu', 'webgl', 'wasm']
  for (const ep of providers) {
    const result = await tryCreateSession(modelBuffer, ep)
    if (result) return result
  }

  // ─── Pass 2: WASM with SIMD enabled ───
  sendLog('🔄 Pose: Thử WASM + SIMD...')
  ort.env.wasm.simd = true
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  const simdResult = await tryCreateSession(modelBuffer, 'wasm')
  if (simdResult) return simdResult

  // ─── Pass 3: WASM no SIMD again (reset) ───
  sendLog('🔄 Pose: Thử WASM tối thiểu (ko SIMD)...')
  ort.env.wasm.simd = false
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  const minResult = await tryCreateSession(modelBuffer, 'wasm')
  if (minResult) return minResult

  // ─── Pass 4: CPU EP as last resort ───
  sendLog('🔄 Pose: Thử CPU EP...')
  const cpuResult = await tryCreateSession(modelBuffer, 'cpu')
  if (cpuResult) return cpuResult

  throw new Error(`All EPs failed (webgpu,webgl,wasm,wasm+simd,wasm-min,cpu). simd=${ort.env.wasm.simd}, threads=${ort.env.wasm.numThreads}, COI=${_hasCrossOriginIsolation}`)
}

async function initModels(poseModelUrl: string) {
  const startTime = performance.now()

  sendLog(`🔧 Pose: cores=${_cores}, COI=${_hasCrossOriginIsolation}, threads=${ort.env.wasm.numThreads}`)

  const poseBuffer = await fetchModelWithCache(poseModelUrl)

  console.log('[Pose Worker] Creating pose session...')
  const result = await createSessionWithFallback(poseBuffer)
  session = result.session
  activeProvider = result.provider

  inputName = session.inputNames[0]
  outputName = session.outputNames[0]
  if (__AI_DEV__) console.log(`[Pose Worker] Model — input: "${inputName}", output: "${outputName}"`)

  const warmupTime = performance.now() - startTime
  console.log(`[Pose Worker] Ready! EP: ${activeProvider}, warmup: ${warmupTime.toFixed(0)}ms`)

  return { provider: activeProvider, warmupTimeMs: warmupTime }
}

async function runInference(pixels: Uint8ClampedArray, timestamp: number) {
  if (!session) throw new Error('Pose model not initialized')

  const startTime = performance.now()

  const floatData = preprocessImageData(pixels)
  const inputTensor = new ort.Tensor('float32', floatData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])

  const output = await session.run({ [inputName]: inputTensor })

  const outputData = output[outputName].data as Float32Array
  const outputShape = output[outputName].dims

  const { allKeypoints: rawKeypoints } = postprocessPose(
    outputData,
    POSE_CONFIDENCE_THRESHOLD,
    CLASS_LABELS,
    outputShape as number[]
  )

  // Validate pose output — discard if coordinates are garbage (outside model input range)
  const MAX_COORD = MODEL_INPUT_SIZE * 2
  const validKeypoints = rawKeypoints.filter((kpts) => {
    for (let i = 0; i < Math.min(kpts.length, 15); i += 3) {
      const x = kpts[i]
      const y = kpts[i + 1]
      if (Math.abs(x) > MAX_COORD || Math.abs(y) > MAX_COORD || !isFinite(x) || !isFinite(y)) {
        return false
      }
    }
    return true
  })

  if (__AI_DEV__) {
    console.log(`[Pose Worker] 🦴 ${rawKeypoints.length} raw, ${validKeypoints.length} valid`)
    if (rawKeypoints.length > 0 && validKeypoints.length === 0) {
      console.warn('[Pose Worker] ⚠️ All keypoints discarded (coords > 1280)')
    }
  }

  const keypoints = validKeypoints.length > 0 ? validKeypoints : []
  const inferenceTimeMs = performance.now() - startTime

  return { keypoints, inferenceTimeMs, timestamp }
}

self.onmessage = async (event: MessageEvent<WorkerInitMessage | WorkerDetectMessage>) => {
  const msg = event.data

  try {
    if (msg.type === 'init') {
      const { provider, warmupTimeMs } = await initModels(msg.poseModelUrl)
      self.postMessage({ type: 'ready', executionProvider: provider, warmupTimeMs })
    } else if (msg.type === 'detect') {
      const { keypoints, inferenceTimeMs, timestamp } = await runInference(msg.imageData, msg.timestamp)

      self.postMessage(
        { type: 'result', detections: [], keypoints, inferenceTimeMs, timestamp },
        { transfer: [msg.imageData.buffer] }
      )
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: (error as Error).message })
  }
}
