// AI Exam Proctoring — Shared Types

// DEV mode flag — all AI debug logs are gated behind this
export const __AI_DEV__ = import.meta.env.DEV

// ─── Device Capability Detection ───
let _isWeakDeviceCache: boolean | null = null

export function isWeakDevice(): boolean {
  if (_isWeakDeviceCache !== null) return _isWeakDeviceCache
  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as any).deviceMemory || 8 // deviceMemory API (Chrome only, defaults to 8)
  _isWeakDeviceCache = cores <= 2 || memory <= 4
  if (__AI_DEV__) {
    console.log(`[AI Config] Device: ${cores} cores, ${memory}GB RAM → ${_isWeakDeviceCache ? 'WEAK (optimized path)' : 'NORMAL'}`)
  }
  return _isWeakDeviceCache
}

/** Returns 320 on weak devices, 640 on normal devices */
export function getModelInputSize(): number {
  return isWeakDevice() ? 320 : 640
}

export interface DetectionBox {
  x1: number
  y1: number
  x2: number
  y2: number
  conf: number
  classId: number
  label: string
}

export interface HeadPose {
  yaw: number // horizontal rotation (>30° = looking sideways)
  pitch: number // vertical tilt (>25° = looking up/down)
  roll: number // head tilt sideways
}

export type AIViolationType =
  | 'PHONE_DETECTED'
  | 'EARPHONE_DETECTED'
  | 'HEAD_TURNED'
  | 'HEAD_TILTED'
  | 'LOOKING_DOWN'
  | 'PHONE_CHECKING_POSE'
  | 'SUSPICIOUS_POSTURE'

export interface AIViolation {
  type: AIViolationType
  timestamp: number
  confidence: number
  frameCount: number // consecutive frames detected
}

// Worker communication types
export interface WorkerInitMessage {
  type: 'init'
  detectModelUrl: string
  poseModelUrl: string
}

export interface WorkerDetectMessage {
  type: 'detect'
  imageData: Uint8ClampedArray
  width: number
  height: number
  timestamp: number
}

export interface WorkerDestroyMessage {
  type: 'destroy'
}

export type WorkerMessage = WorkerInitMessage | WorkerDetectMessage | WorkerDestroyMessage

export interface WorkerReadyResponse {
  type: 'ready'
  executionProvider: string
  warmupTimeMs: number
}

export interface WorkerResultResponse {
  type: 'result'
  detections: DetectionBox[]
  keypoints: number[][] // 17 keypoints × 3 (x,y,vis) for each person
  inferenceTimeMs: number
  timestamp: number
}

export interface WorkerErrorResponse {
  type: 'error'
  error: string // Use 'error' to match worker postMessage format
}

export type WorkerResponse = WorkerReadyResponse | WorkerResultResponse | WorkerErrorResponse

// ─── Body Posture Analysis ───
export interface BodyPosture {
  neckFlexionAngle: number // 0=upright, >0=forward bend (degrees)
  forwardLeanAngle: number // 0=upright, >0=leaning forward (degrees)
  shoulderHunchScore: number // 0-1 (1=fully hunched)
  isValid: boolean // false when insufficient keypoints
}

// ─── Phone Checking Pose Detection ───
export interface PhoneCheckResult {
  probability: number // 0-1
  signals: {
    headDown: number
    elbowProximity: number
    wristPosition: number
    wristProximity: number
    shoulderHunch: number
    eyeGazeProxy: number
  }
}

// ─── Composite Cheating Score ───
export type CheatingLevel = 'normal' | 'suspicious' | 'warning' | 'critical'

export interface CheatingScore {
  overall: number // 0-1
  breakdown: {
    headPoseScore: number
    bodyPostureScore: number
    phoneCheckScore: number
    objectDetectionScore: number
  }
  dominantSignal: string
  level: CheatingLevel
}

// ─── Enhanced Pose Result (returned by usePoseAnalysis hook) ───
export interface EnhancedPoseResult {
  headPose: HeadPose | null
  bodyPosture: BodyPosture | null
  phoneCheck: PhoneCheckResult | null
  cheatingScore: CheatingScore | null
  isLookingAway: boolean
  lookAwayStartTime: number | null
  lookAwayDurationMs: number
  trends: { pitchTrend: number; yawTrend: number } | null
}

// Anti-cheat config
// Build config dynamically based on device capability
function buildAIConfig() {
  const weak = isWeakDevice()
  return {
    DETECT_CONFIDENCE_THRESHOLD: 0.6,
    POSE_CONFIDENCE_THRESHOLD: 0.7,
    YAW_THRESHOLD: 30, // degrees
    PITCH_THRESHOLD: 25, // degrees
    ROLL_THRESHOLD: 25, // degrees

    // Temporal smoothing — consecutive frames before flagging
    CRITICAL_FRAME_COUNT: 3, // phone/earphone/extra person
    HEAD_SUSTAIN_MS: 2000, // head turned must sustain 2 seconds

    // Enhanced pitch detection
    PITCH_BASELINE_CORRECTION: 0.22,
    PITCH_CLAMP: 60,

    // Phone checking pose
    PHONE_POSE_THRESHOLD: 0.65,
    PHONE_POSE_SUSTAIN_MS: 3000,

    // Composite cheating score thresholds
    CHEATING_SUSPICIOUS_THRESHOLD: 0.25,
    CHEATING_WARNING_THRESHOLD: 0.5,
    CHEATING_CRITICAL_THRESHOLD: 0.75,
    CHEATING_SUSTAIN_MS: 2500,

    // Temporal analysis
    WEIGHTED_AVERAGE_DECAY: 0.85,
    TREND_WINDOW_MS: 5000,

    // Adaptive FPS — lower on weak devices to reduce CPU pressure
    MIN_FPS: weak ? 2 : 4,
    MAX_FPS: weak ? 8 : 15,
    TARGET_INFERENCE_MS: weak ? 250 : 100,

    // Model input — 320 on weak devices (4× less computation)
    MODEL_INPUT_SIZE: weak ? 320 : 640,
    MODEL_OUTPUT_DETECTIONS: 300
  } as const
}

export const AI_CONFIG = buildAIConfig()

// Class labels from trained model
export const CLASS_LABELS: Record<number, string> = {
  0: 'phone'
}

// Map raw class labels to our violation types
export function classToViolationType(label: string, classId: number): AIViolationType | null {
  const lower = label.toLowerCase()
  if (lower.includes('phone') || lower.includes('cell')) return 'PHONE_DETECTED'
  if (lower.includes('earphone') || lower.includes('earbud') || lower.includes('headphone')) return 'EARPHONE_DETECTED'
  // classId-based fallback
  if (classId === 0 && lower.includes('person')) return null // person is not a violation by itself
  return null
}
