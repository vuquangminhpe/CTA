// AI Exam Proctoring — usePoseAnalysis hook
// Replaces useHeadPose with enhanced analysis:
// - Weighted moving average (recent frames weighted higher)
// - Trend detection (is pitch increasing?)
// - Body posture + phone checking pose + composite cheating score

import { useState, useEffect, useRef, useMemo } from 'react'
import type { HeadPose, EnhancedPoseResult, BodyPosture, PhoneCheckResult, CheatingScore, DetectionBox } from '../utils/aiTypes'
import { AI_CONFIG } from '../utils/aiTypes'
import { calculateHeadPose } from '../utils/postprocess'
import {
  enhancedPitchCalculation,
  analyzeBodyPosture,
  detectPhoneCheckingPose,
  calculateCheatingScore,
} from '../utils/poseAnalysis'

interface UsePoseAnalysisOptions {
  keypoints: number[][]
  detections: DetectionBox[]
  enabled?: boolean
}

// ─── Weighted Moving Average ───
// Recent frames get higher weight via exponential decay
function computeWeightedAverage(
  history: { pose: HeadPose; time: number }[],
  now: number
): HeadPose | null {
  if (history.length === 0) return null

  let totalWeight = 0
  let yawSum = 0
  let pitchSum = 0
  let rollSum = 0

  for (const entry of history) {
    const ageSec = (now - entry.time) / 1000
    const weight = Math.pow(AI_CONFIG.WEIGHTED_AVERAGE_DECAY, ageSec)
    yawSum += entry.pose.yaw * weight
    pitchSum += entry.pose.pitch * weight
    rollSum += entry.pose.roll * weight
    totalWeight += weight
  }

  if (totalWeight < 0.001) return null
  return {
    yaw: yawSum / totalWeight,
    pitch: pitchSum / totalWeight,
    roll: rollSum / totalWeight,
  }
}

// ─── Trend Detection ───
// Split history into halves, compare averages
function computeTrends(
  history: { pose: HeadPose; time: number }[],
  now: number,
  windowMs: number
): { pitchTrend: number; yawTrend: number } {
  const relevant = history.filter((h) => now - h.time < windowMs)
  if (relevant.length < 4) return { pitchTrend: 0, yawTrend: 0 }

  const midIdx = Math.floor(relevant.length / 2)
  const firstHalf = relevant.slice(0, midIdx)
  const secondHalf = relevant.slice(midIdx)

  const avg = (arr: typeof firstHalf, key: keyof HeadPose) =>
    arr.reduce((s, e) => s + e.pose[key], 0) / arr.length

  return {
    pitchTrend: avg(secondHalf, 'pitch') - avg(firstHalf, 'pitch'),
    yawTrend: Math.abs(avg(secondHalf, 'yaw')) - Math.abs(avg(firstHalf, 'yaw')),
  }
}

export function usePoseAnalysis({
  keypoints,
  detections,
  enabled = true,
}: UsePoseAnalysisOptions): EnhancedPoseResult {
  const [headPose, setHeadPose] = useState<HeadPose | null>(null)
  const [bodyPosture, setBodyPosture] = useState<BodyPosture | null>(null)
  const [phoneCheck, setPhoneCheck] = useState<PhoneCheckResult | null>(null)
  const [cheatingScore, setCheatingScore] = useState<CheatingScore | null>(null)
  const [isLookingAway, setIsLookingAway] = useState(false)
  const [lookAwayStartTime, setLookAwayStartTime] = useState<number | null>(null)
  const [lookAwayDurationMs, setLookAwayDurationMs] = useState(0)
  const [trends, setTrends] = useState<{ pitchTrend: number; yawTrend: number } | null>(null)

  const poseHistoryRef = useRef<{ pose: HeadPose; time: number }[]>([])
  const HISTORY_WINDOW_MS = 3000

  // Compute raw head pose from first person's keypoints
  const currentPose = useMemo(() => {
    if (!enabled || keypoints.length === 0) return null
    const kpts = keypoints[0]
    if (!kpts || kpts.length < 15) return null
    return calculateHeadPose(kpts)
  }, [keypoints, enabled])

  // Compute enhanced analysis per frame
  const currentAnalysis = useMemo(() => {
    if (!enabled || keypoints.length === 0) return null
    const kpts = keypoints[0]
    if (!kpts || kpts.length < 15) return null

    const ePitch = enhancedPitchCalculation(kpts)
    const bp = analyzeBodyPosture(kpts)
    const pc = detectPhoneCheckingPose(kpts, ePitch, bp)
    return { enhancedPitch: ePitch, bodyPosture: bp, phoneCheck: pc }
  }, [keypoints, enabled])

  useEffect(() => {
    if (!enabled || !currentPose) {
      setHeadPose(null)
      setBodyPosture(null)
      setPhoneCheck(null)
      setCheatingScore(null)
      setIsLookingAway(false)
      setLookAwayStartTime(null)
      setLookAwayDurationMs(0)
      setTrends(null)
      return
    }

    const now = performance.now()

    // Add to history & prune
    poseHistoryRef.current.push({ pose: currentPose, time: now })
    poseHistoryRef.current = poseHistoryRef.current.filter(
      (entry) => now - entry.time < HISTORY_WINDOW_MS
    )

    // Weighted moving average for head pose
    const avgPose = computeWeightedAverage(poseHistoryRef.current, now)
    if (!avgPose) return
    setHeadPose(avgPose)

    // Body posture & phone check (from current frame analysis)
    if (currentAnalysis) {
      setBodyPosture(currentAnalysis.bodyPosture)
      setPhoneCheck(currentAnalysis.phoneCheck)

      // Composite cheating score
      const cs = calculateCheatingScore(avgPose, currentAnalysis.bodyPosture, currentAnalysis.phoneCheck, detections)
      setCheatingScore(cs)
    }

    // Trend detection
    const t = computeTrends(poseHistoryRef.current, now, AI_CONFIG.TREND_WINDOW_MS)
    setTrends(t)

    // ─── Looking away detection (multi-signal) ───
    const yawExceeded = Math.abs(avgPose.yaw) > AI_CONFIG.YAW_THRESHOLD
    const pitchExceeded = Math.abs(avgPose.pitch) > AI_CONFIG.PITCH_THRESHOLD
    const rollExceeded = Math.abs(avgPose.roll) > AI_CONFIG.ROLL_THRESHOLD
    const phoneCheckHigh = (currentAnalysis?.phoneCheck.probability ?? 0) >= AI_CONFIG.PHONE_POSE_THRESHOLD
    const isAway = yawExceeded || pitchExceeded || rollExceeded || phoneCheckHigh

    if (isAway) {
      if (!lookAwayStartTime) {
        setLookAwayStartTime(now)
        setLookAwayDurationMs(0)
      } else {
        const duration = now - lookAwayStartTime
        setLookAwayDurationMs(duration)
        if (duration >= AI_CONFIG.HEAD_SUSTAIN_MS) {
          setIsLookingAway(true)
        }
      }
    } else {
      setIsLookingAway(false)
      setLookAwayStartTime(null)
      setLookAwayDurationMs(0)
    }
  }, [currentPose, currentAnalysis, detections, enabled, lookAwayStartTime])

  return {
    headPose,
    bodyPosture,
    phoneCheck,
    cheatingScore,
    isLookingAway,
    lookAwayStartTime,
    lookAwayDurationMs,
    trends,
  }
}

export default usePoseAnalysis
