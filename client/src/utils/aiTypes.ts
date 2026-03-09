// AI Exam Proctoring — Shared Types

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

export type AIViolationType = 'PHONE_DETECTED' | 'EARPHONE_DETECTED' | 'HEAD_TURNED' | 'HEAD_TILTED'

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

// Anti-cheat config
export const AI_CONFIG = {
  DETECT_CONFIDENCE_THRESHOLD: 0.5,
  POSE_CONFIDENCE_THRESHOLD: 0.8,
  YAW_THRESHOLD: 30, // degrees
  PITCH_THRESHOLD: 25, // degrees
  ROLL_THRESHOLD: 25, // degrees

  // Temporal smoothing — consecutive frames before flagging
  CRITICAL_FRAME_COUNT: 3, // phone/earphone/extra person
  HEAD_SUSTAIN_MS: 2000, // head turned must sustain 2 seconds

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
