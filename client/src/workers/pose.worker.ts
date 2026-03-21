// AI Exam Proctoring — Pose Worker
// Web Worker for YOLOv26n head pose estimation

import * as ort from 'onnxruntime-web/webgpu'
import { WorkerInitMessage, WorkerDetectMessage, AI_CONFIG, __AI_DEV__ } from '../utils/aiTypes'
import { CLASS_LABELS } from '../utils/classes'
import { postprocessPose } from '../utils/postprocess'
import { preprocessImageData } from '../utils/preprocess'

// Adaptive WebAssembly config based on device capability
const _cores = navigator.hardwareConcurrency || 2
const _isWeakDevice = _cores <= 2
ort.env.wasm.numThreads = _isWeakDevice ? 1 : Math.min(_cores, 4)
ort.env.wasm.simd = true
ort.env.wasm.proxy = !_isWeakDevice // proxy adds overhead on single-core devices

const { MODEL_INPUT_SIZE, POSE_CONFIDENCE_THRESHOLD } = AI_CONFIG

let session: ort.InferenceSession | null = null
let activeProvider = 'unknown'
let inputName = 'images'
let outputName = 'output0'

const MODEL_CACHE_NAME = 'ai-proctoring-models-v1'

async function fetchModelWithCache(url: string): Promise<ArrayBuffer> {
  const cache = await caches.open(MODEL_CACHE_NAME)
  let response = await cache.match(url)

  if (!response) {
    if (__AI_DEV__) console.log(`[Pose Worker] Downloading model from ${url}...`)
    response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`)
    await cache.put(url, response.clone())
  } else {
    if (__AI_DEV__) console.log(`[Pose Worker] Loaded model from cache: ${url}`)
  }

  return await response.arrayBuffer()
}

async function createSession(modelBuffer: ArrayBuffer, providers: string[]) {
  for (const ep of providers) {
    try {
      const epStart = performance.now()
      const sess = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: [ep],
        graphOptimizationLevel: 'all'
      })
      if (__AI_DEV__) {
        console.log(`[Pose Worker] Session created on ${ep} in ${(performance.now() - epStart).toFixed(0)}ms`)
      }
      return { session: sess, provider: ep }
    } catch (e) {
      console.warn(`[Pose Worker] EP '${ep}' failed or is not supported:`, e)
      // Special handling: WebGPU might throw obscure errors, simply try next EP
    }
  }
  throw new Error('All execution providers failed. Browser might not support WebGL/WASM correctly.')
}

async function initModels(poseModelUrl: string) {
  const startTime = performance.now()
  const poseBuffer = await fetchModelWithCache(poseModelUrl)

  const providers = ['webgpu', 'webgl', 'wasm']

  console.log('[Pose Worker] Creating pose session...')
  const result = await createSession(poseBuffer, providers)
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

  // Convert Uint8Clamped array to Float32Array [1,3,640,640] tensor (Heavy lifting done here)
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
  const MAX_COORD = MODEL_INPUT_SIZE * 2 // generous: 1280
  const validKeypoints = rawKeypoints.filter((kpts) => {
    // Check first few coordinate values — if any are wildly out of range, this is garbage
    for (let i = 0; i < Math.min(kpts.length, 15); i += 3) {
      const x = kpts[i]
      const y = kpts[i + 1]
      if (Math.abs(x) > MAX_COORD || Math.abs(y) > MAX_COORD || !isFinite(x) || !isFinite(y)) {
        return false // garbage output
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

      // Zero-copy transfer of input buffer back to main thread pool (optional optimization)
      self.postMessage(
        { type: 'result', detections: [], keypoints, inferenceTimeMs, timestamp },
        { transfer: [msg.imageData.buffer] }
      )
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: (error as Error).message })
  }
}
