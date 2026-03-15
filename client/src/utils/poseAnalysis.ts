// AI Exam Proctoring — Advanced Pose Analysis
// Pure geometric analysis functions on COCO-17 keypoints.
// No React dependencies, no side effects — just math. All functions < 1ms.

import type { HeadPose, BodyPosture, PhoneCheckResult, CheatingScore, CheatingLevel, DetectionBox } from './aiTypes'
import { AI_CONFIG } from './aiTypes'

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

interface Point {
  x: number
  y: number
  vis: number
}

// COCO-17 keypoint indices
const KPT = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
} as const

const VIS_THRESHOLD = 0.3

function getKpt(kpts: number[], index: number): Point {
  return {
    x: kpts[index * 3],
    y: kpts[index * 3 + 1],
    vis: kpts[index * 3 + 2],
  }
}

function mid(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    vis: Math.min(a.vis, b.vis),
  }
}

function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function angleBetweenVectors(v1x: number, v1y: number, v2x: number, v2y: number): number {
  const dot = v1x * v2x + v1y * v2y
  const cross = v1x * v2y - v1y * v2x
  return Math.atan2(cross, dot) * (180 / Math.PI)
}

function isVisible(p: Point): boolean {
  return p.vis >= VIS_THRESHOLD
}

// ═══════════════════════════════════════════════════════════════
// 1. Enhanced Pitch Calculation
// ═══════════════════════════════════════════════════════════════

/**
 * Fuses nose-shoulder and nose-ear pitch with confidence-weighted blending.
 * Returns pitch in degrees (positive = looking down, negative = looking up).
 * Clamped to ±PITCH_CLAMP to avoid YOLO outliers.
 */
export function enhancedPitchCalculation(kpts: number[]): number {
  const nose = getKpt(kpts, KPT.NOSE)
  const leftEar = getKpt(kpts, KPT.LEFT_EAR)
  const rightEar = getKpt(kpts, KPT.RIGHT_EAR)
  const leftShoulder = getKpt(kpts, KPT.LEFT_SHOULDER)
  const rightShoulder = getKpt(kpts, KPT.RIGHT_SHOULDER)

  if (!isVisible(nose)) return 0

  const bothEars = isVisible(leftEar) && isVisible(rightEar)
  const bothShoulders = isVisible(leftShoulder) && isVisible(rightShoulder)

  if (!bothEars && !bothShoulders) return 0

  let pitchFromEars = 0
  let earConf = 0
  let earDist = 0

  if (bothEars) {
    earDist = dist(leftEar, rightEar)
    if (earDist < 1) earDist = 1
    const midEarY = (leftEar.y + rightEar.y) / 2
    const noseOffsetY = nose.y - midEarY
    const baselineY = earDist * AI_CONFIG.PITCH_BASELINE_CORRECTION
    pitchFromEars = Math.atan2(noseOffsetY - baselineY, earDist * 0.5) * (180 / Math.PI)
    earConf = Math.min(leftEar.vis, rightEar.vis)
  }

  let pitchFromShoulders = 0
  let shoulderConf = 0

  if (bothShoulders) {
    const shoulderCenter = mid(leftShoulder, rightShoulder)
    // Use earDist as reference scale; if ears not visible, estimate from shoulder width
    const refDist = earDist > 1 ? earDist : dist(leftShoulder, rightShoulder) * 0.4
    const noseShoulderDY = nose.y - shoulderCenter.y
    // Neutral: nose is ~0.8 * refDist above shoulders (negative in image coords means above)
    const neutralOffset = -0.8 * refDist
    pitchFromShoulders = Math.atan2(noseShoulderDY - neutralOffset, refDist * 0.5) * (180 / Math.PI)
    shoulderConf = Math.min(leftShoulder.vis, rightShoulder.vis)
  }

  // Confidence-weighted fusion
  const adjShoulderW = 0.6 * shoulderConf
  const adjEarW = 0.4 * earConf
  const total = adjShoulderW + adjEarW

  let result: number
  if (total < 0.01) {
    result = 0
  } else {
    result = (adjShoulderW * pitchFromShoulders + adjEarW * pitchFromEars) / total
  }

  return clamp(result, -AI_CONFIG.PITCH_CLAMP, AI_CONFIG.PITCH_CLAMP)
}

// ═══════════════════════════════════════════════════════════════
// 2. Body Posture Analysis
// ═══════════════════════════════════════════════════════════════

export function analyzeBodyPosture(kpts: number[]): BodyPosture {
  const nose = getKpt(kpts, KPT.NOSE)
  const leftEar = getKpt(kpts, KPT.LEFT_EAR)
  const rightEar = getKpt(kpts, KPT.RIGHT_EAR)
  const leftShoulder = getKpt(kpts, KPT.LEFT_SHOULDER)
  const rightShoulder = getKpt(kpts, KPT.RIGHT_SHOULDER)
  const leftHip = getKpt(kpts, KPT.LEFT_HIP)
  const rightHip = getKpt(kpts, KPT.RIGHT_HIP)

  const bothShoulders = isVisible(leftShoulder) && isVisible(rightShoulder)
  const bothEars = isVisible(leftEar) && isVisible(rightEar)

  if (!bothShoulders || !bothEars || !isVisible(nose)) {
    return { neckFlexionAngle: 0, forwardLeanAngle: 0, shoulderHunchScore: 0, isValid: false }
  }

  const earCenter = mid(leftEar, rightEar)
  const shoulderCenter = mid(leftShoulder, rightShoulder)
  const earDist = dist(leftEar, rightEar)
  if (earDist < 1) {
    return { neckFlexionAngle: 0, forwardLeanAngle: 0, shoulderHunchScore: 0, isValid: false }
  }

  // ─── Shoulder Hunch (PRIMARY — always available) ───
  // When hunching, shoulders rise toward ears → distance decreases
  // Neutral: earShoulderDist ≈ 1.0-1.3 × earDist
  // Hunched: earShoulderDist ≈ 0.5-0.8 × earDist
  const earShoulderDist = dist(earCenter, shoulderCenter)
  const normalizedDist = earShoulderDist / earDist
  const shoulderHunchScore = clamp(1.0 - (normalizedDist - 0.5) / 0.8, 0, 1)

  // ─── Neck Flexion & Forward Lean (only when hips visible) ───
  const bothHips = isVisible(leftHip) && isVisible(rightHip)
  let neckFlexionAngle = 0
  let forwardLeanAngle = 0

  if (bothHips) {
    const hipCenter = mid(leftHip, rightHip)

    // Neck flexion: angle between shoulder→nose and shoulder→hip vectors
    const rawAngle = Math.abs(angleBetweenVectors(
      nose.x - shoulderCenter.x, nose.y - shoulderCenter.y,
      hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y
    ))
    neckFlexionAngle = clamp(180 - rawAngle, 0, 60)

    // Forward lean: lateral offset of shoulders relative to hips
    const shoulderHipDX = Math.abs(shoulderCenter.x - hipCenter.x)
    const shoulderHipDY = Math.abs(shoulderCenter.y - hipCenter.y)
    forwardLeanAngle = shoulderHipDY > 1
      ? Math.atan2(shoulderHipDX, shoulderHipDY) * (180 / Math.PI)
      : 0
    forwardLeanAngle = clamp(forwardLeanAngle, 0, 45)
  }

  return { neckFlexionAngle, forwardLeanAngle, shoulderHunchScore, isValid: true }
}

// ═══════════════════════════════════════════════════════════════
// 3. Phone Checking Pose Detection (6 signals)
// ═══════════════════════════════════════════════════════════════

export function detectPhoneCheckingPose(
  kpts: number[],
  enhancedPitch: number,
  bodyPosture: BodyPosture
): PhoneCheckResult {
  const leftShoulder = getKpt(kpts, KPT.LEFT_SHOULDER)
  const rightShoulder = getKpt(kpts, KPT.RIGHT_SHOULDER)
  const leftElbow = getKpt(kpts, KPT.LEFT_ELBOW)
  const rightElbow = getKpt(kpts, KPT.RIGHT_ELBOW)
  const leftWrist = getKpt(kpts, KPT.LEFT_WRIST)
  const rightWrist = getKpt(kpts, KPT.RIGHT_WRIST)
  const leftEye = getKpt(kpts, KPT.LEFT_EYE)
  const rightEye = getKpt(kpts, KPT.RIGHT_EYE)

  const bothShoulders = isVisible(leftShoulder) && isVisible(rightShoulder)
  const shoulderCenter = bothShoulders ? mid(leftShoulder, rightShoulder) : null
  const shoulderWidth = bothShoulders ? dist(leftShoulder, rightShoulder) : 0

  // ─── Signal 1: headDown (weight 0.30) ───
  const headDown = clamp(enhancedPitch / 40, 0, 1)

  // ─── Signal 2: elbowProximity (weight 0.10) ───
  let elbowProximity = 0.5 // neutral when not visible
  if (shoulderCenter && shoulderWidth > 1) {
    const leftElbowOk = isVisible(leftElbow)
    const rightElbowOk = isVisible(rightElbow)
    if (leftElbowOk || rightElbowOk) {
      let totalDist = 0
      let count = 0
      if (leftElbowOk) {
        totalDist += Math.abs(leftElbow.x - shoulderCenter.x)
        count++
      }
      if (rightElbowOk) {
        totalDist += Math.abs(rightElbow.x - shoulderCenter.x)
        count++
      }
      const avgElbowDist = totalDist / count
      const elbowRatio = avgElbowDist / (shoulderWidth * 0.5)
      elbowProximity = clamp(1.0 - elbowRatio, 0, 1)
    }
  }

  // ─── Signal 3: wristPosition (weight 0.12) ───
  let wristPosition = 0.3 // slightly suspicious when not visible (hands hidden)
  if (shoulderCenter && shoulderWidth > 1) {
    const leftWristOk = isVisible(leftWrist)
    const rightWristOk = isVisible(rightWrist)
    if (leftWristOk || rightWristOk) {
      let totalDist = 0
      let count = 0
      if (leftWristOk) {
        totalDist += dist(leftWrist, shoulderCenter)
        count++
      }
      if (rightWristOk) {
        totalDist += dist(rightWrist, shoulderCenter)
        count++
      }
      const avgWristDist = totalDist / count
      wristPosition = clamp(1.0 - avgWristDist / shoulderWidth, 0, 1)

      // Bonus: wrists below shoulders (holding something below)
      const wristsBelowShoulder =
        (leftWristOk ? leftWrist.y > shoulderCenter.y : true) &&
        (rightWristOk ? rightWrist.y > shoulderCenter.y : true)
      if (wristsBelowShoulder) {
        wristPosition = clamp(wristPosition * 1.2, 0, 1)
      }
    }
  }

  // ─── Signal 4: wristProximity (weight 0.15) — two hands close = holding phone ───
  let wristProximity = 0.35 // slightly suspicious when not visible
  if (shoulderWidth > 1 && isVisible(leftWrist) && isVisible(rightWrist)) {
    const wristDist = dist(leftWrist, rightWrist)
    const wristRatio = wristDist / shoulderWidth
    wristProximity = clamp(1.0 - wristRatio / 0.8, 0, 1)

    // Bonus: both wrists below shoulders
    if (shoulderCenter && leftWrist.y > shoulderCenter.y && rightWrist.y > shoulderCenter.y) {
      wristProximity = clamp(wristProximity * 1.2, 0, 1)
    }
  }

  // ─── Signal 5: shoulderHunch (weight 0.08) ───
  const shoulderHunch = bodyPosture.isValid ? bodyPosture.shoulderHunchScore : 0

  // ─── Signal 6: eyeGazeProxy (weight 0.10) ───
  // COCO-17 eye keypoint = eye socket center, NOT pupil.
  // Socket doesn't move when pupils move → only 2 usable proxies.
  let eyeGazeProxy = 0
  {
    // Proxy 1: Micro-pitch (weight 0.75) — strongest proxy
    const microPitchSignal = clamp(enhancedPitch / 15, 0, 1)

    // Proxy 2: Eye visibility drop (weight 0.25) — noisy but supplementary
    let eyeVisDropSignal = 0
    const bothEyes = isVisible(leftEye) && isVisible(rightEye)
    if (bothEyes) {
      const avgEyeVis = (leftEye.vis + rightEye.vis) / 2
      eyeVisDropSignal = clamp((0.7 - avgEyeVis) / 0.3, 0, 1)
    }

    eyeGazeProxy = 0.75 * microPitchSignal + 0.25 * eyeVisDropSignal
  }

  // ─── Weighted sum ───
  const weightedSum =
    0.30 * headDown +
    0.10 * elbowProximity +
    0.12 * wristPosition +
    0.15 * wristProximity +
    0.08 * shoulderHunch +
    0.10 * eyeGazeProxy
  // Remaining 0.15 for concurrency bonus

  // ─── Concurrency bonus: geometric mean of top 3 signals ───
  const signals = [headDown, elbowProximity, wristPosition, wristProximity, shoulderHunch, eyeGazeProxy]
  signals.sort((a, b) => b - a)
  const concurrencyBonus = Math.pow(
    Math.max(signals[0], 0.001) * Math.max(signals[1], 0.001) * Math.max(signals[2], 0.001),
    1 / 3
  )

  const probability = clamp(weightedSum + 0.15 * concurrencyBonus, 0, 1)

  return {
    probability,
    signals: { headDown, elbowProximity, wristPosition, wristProximity, shoulderHunch, eyeGazeProxy },
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. Composite Cheating Score
// ═══════════════════════════════════════════════════════════════

export function calculateCheatingScore(
  headPose: HeadPose | null,
  bodyPosture: BodyPosture | null,
  phoneCheck: PhoneCheckResult | null,
  detections: DetectionBox[]
): CheatingScore {
  // ─── Head Pose Score (weight 0.25) ───
  let headPoseScore = 0
  if (headPose) {
    const yawComponent = clamp(Math.abs(headPose.yaw) / 60, 0, 1)
    const pitchComponent = clamp(Math.abs(headPose.pitch) / 40, 0, 1)
    const rollComponent = clamp(Math.abs(headPose.roll) / 45, 0, 1)
    headPoseScore = Math.max(yawComponent, pitchComponent, rollComponent * 0.7)
  }

  // ─── Body Posture Score (weight 0.15) ───
  let bodyPostureScore = 0
  if (bodyPosture?.isValid) {
    const bothHipsAvailable = bodyPosture.neckFlexionAngle > 0 || bodyPosture.forwardLeanAngle > 0
    if (bothHipsAvailable) {
      const neckComponent = clamp(bodyPosture.neckFlexionAngle / 35, 0, 1)
      const leanComponent = clamp(bodyPosture.forwardLeanAngle / 30, 0, 1)
      bodyPostureScore =
        0.50 * bodyPosture.shoulderHunchScore +
        0.25 * neckComponent +
        0.25 * leanComponent
    } else {
      // Hip not visible (90%+ of seated frames) → shoulder hunch only
      bodyPostureScore = bodyPosture.shoulderHunchScore
    }
  }

  // ─── Phone Check Score (weight 0.30) ───
  const phoneCheckScore = phoneCheck?.probability ?? 0

  // ─── Object Detection Score (weight 0.30) ───
  let objectDetectionScore = 0
  for (const det of detections) {
    const label = det.label.toLowerCase()
    if (
      (label.includes('phone') || label.includes('cell')) &&
      det.conf > AI_CONFIG.DETECT_CONFIDENCE_THRESHOLD
    ) {
      objectDetectionScore = Math.max(objectDetectionScore, det.conf)
    }
    if (
      (label.includes('earphone') || label.includes('earbud') || label.includes('headphone')) &&
      det.conf > AI_CONFIG.DETECT_CONFIDENCE_THRESHOLD
    ) {
      objectDetectionScore = Math.max(objectDetectionScore, det.conf)
    }
  }

  // ─── Weighted composite ───
  const overall =
    0.25 * headPoseScore +
    0.15 * bodyPostureScore +
    0.30 * phoneCheckScore +
    0.30 * objectDetectionScore

  // ─── Dominant signal ───
  const scores: [string, number][] = [
    ['headPose', headPoseScore],
    ['bodyPosture', bodyPostureScore],
    ['phoneCheck', phoneCheckScore],
    ['objectDetection', objectDetectionScore],
  ]
  scores.sort((a, b) => b[1] - a[1])
  const dominantSignal = scores[0][0]

  // ─── Level mapping ───
  let level: CheatingLevel = 'normal'
  if (overall >= AI_CONFIG.CHEATING_CRITICAL_THRESHOLD) level = 'critical'
  else if (overall >= AI_CONFIG.CHEATING_WARNING_THRESHOLD) level = 'warning'
  else if (overall >= AI_CONFIG.CHEATING_SUSPICIOUS_THRESHOLD) level = 'suspicious'

  return {
    overall,
    breakdown: { headPoseScore, bodyPostureScore, phoneCheckScore, objectDetectionScore },
    dominantSignal,
    level,
  }
}
