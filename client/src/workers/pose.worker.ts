// AI Exam Proctoring — Pose Worker
// Web Worker for YOLOv26n head pose estimation

import * as ort from 'onnxruntime-web/webgpu'
import { WorkerInitMessage, WorkerDetectMessage, AI_CONFIG } from '../utils/aiTypes'
import { CLASS_LABELS } from '../utils/classes'
import { postprocessPose } from '../utils/postprocess'
import { preprocessImageData } from '../utils/preprocess'

// Force WebAssembly SIMD and threading flags for optimal performance if fallback needed
ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 4)
ort.env.wasm.simd = true
ort.env.wasm.proxy = true

const { MODEL_INPUT_SIZE, POSE_CONFIDENCE_THRESHOLD } = AI_CONFIG

let session: ort.InferenceSession | null = null
let activeProvider = 'unknown'
let debugCounter = 0
let inputName = 'images'
let outputName = 'output0'

const MODEL_CACHE_NAME = 'ai-proctoring-models-v1'

async function fetchModelWithCache(url: string): Promise<ArrayBuffer> {
  const cache = await caches.open(MODEL_CACHE_NAME)
  let response = await cache.match(url)

  if (!response) {
    console.log(`[Pose Worker] Downloading model from ${url}...`)
    response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`)
    await cache.put(url, response.clone())
  } else {
    console.log(`[Pose Worker] Loaded model from cache: ${url}`)
  }

  return await response.arrayBuffer()
}

async function createSession(modelBuffer: ArrayBuffer, providers: string[]) {
  for (const ep of providers) {
    try {
      const sess = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: [ep],
        graphOptimizationLevel: 'all'
      })
      // Send a test inference to verify the provider actually works
      const dummyObj = new ort.Tensor('float32', new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE), [
        1,
        3,
        MODEL_INPUT_SIZE,
        MODEL_INPUT_SIZE
      ])
      await sess.run({ [sess.inputNames[0]]: dummyObj })
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

  const providers = ['webgpu', 'wasm']

  console.log('[Pose Worker] Creating pose session...')
  const result = await createSession(poseBuffer, providers)
  session = result.session
  activeProvider = result.provider

  inputName = session.inputNames[0]
  outputName = session.outputNames[0]
  console.log(`[Pose Worker] Model — input: "${inputName}", output: "${outputName}"`)

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

  if (debugCounter < 3) {
    debugCounter++
    console.log('[Pose Worker] === OUTPUT ===')
    for (const [name, tensor] of Object.entries(output)) {
      console.log(`  Output "${name}": shape=${JSON.stringify(tensor.dims)}, type=${tensor.type}, size=${tensor.size}`)
      const data = tensor.data as Float32Array
      console.log(
        `  First 30 values:`,
        Array.from(data.slice(0, 30)).map((v) => v.toFixed(4))
      )
    }
  }

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

  if (debugCounter <= 5) {
    console.log(`[Pose Worker] 🦴 Pose: ${rawKeypoints.length} raw, ${validKeypoints.length} valid`)
    if (rawKeypoints.length > 0) {
      const kp = rawKeypoints[0]
      console.log(`[Pose Worker] First person keypoints:`, {
        nose: `(${kp[0]?.toFixed(1)}, ${kp[1]?.toFixed(1)}) vis=${kp[2]?.toFixed(3)}`,
        leftEar: `(${kp[9]?.toFixed(1)}, ${kp[10]?.toFixed(1)}) vis=${kp[11]?.toFixed(3)}`,
        rightEar: `(${kp[12]?.toFixed(1)}, ${kp[13]?.toFixed(1)}) vis=${kp[14]?.toFixed(3)}`
      })
    }
    if (rawKeypoints.length > 0 && validKeypoints.length === 0) {
      console.warn(
        '[Pose Worker] ⚠️ All keypoints discarded (coords > 1280). Check model output shape / postprocessPose.'
      )
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
