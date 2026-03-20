// AI Exam Proctoring — Shared Types

// DEV mode flag — all AI debug logs are gated behind this
export const __AI_DEV__ = import.meta.env.DEV

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
export const AI_CONFIG = {
  DETECT_CONFIDENCE_THRESHOLD: 0.8,
  POSE_CONFIDENCE_THRESHOLD: 0.95,
  YAW_THRESHOLD: 30, // degrees
  PITCH_THRESHOLD: 25, // degrees
  ROLL_THRESHOLD: 25, // degrees

  // Temporal smoothing — consecutive frames before flagging
  CRITICAL_FRAME_COUNT: 3, // phone/earphone/extra person
  HEAD_SUSTAIN_MS: 2000, // head turned must sustain 2 seconds

  // Enhanced pitch detection
  PITCH_BASELINE_CORRECTION: 0.22, // reduced from 0.33 for better down-look detection
  PITCH_CLAMP: 60, // clamp enhanced pitch to ±60° to avoid YOLO outliers

  // Phone checking pose
  PHONE_POSE_THRESHOLD: 0.85,
  PHONE_POSE_SUSTAIN_MS: 3000, // must sustain 3 seconds

  // Composite cheating score thresholds
  CHEATING_SUSPICIOUS_THRESHOLD: 0.25,
  CHEATING_WARNING_THRESHOLD: 0.5,
  CHEATING_CRITICAL_THRESHOLD: 0.75,
  CHEATING_SUSTAIN_MS: 2500,

  // Temporal analysis
  WEIGHTED_AVERAGE_DECAY: 0.85, // exponential decay per second
  TREND_WINDOW_MS: 5000,

  // Adaptive FPS
  MIN_FPS: 4,
  MAX_FPS: 15,
  TARGET_INFERENCE_MS: 100, // aim for 100ms per inference

  // Model input
  MODEL_INPUT_SIZE: 640,
  MODEL_OUTPUT_DETECTIONS: 300
} as const

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
