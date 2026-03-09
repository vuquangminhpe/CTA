// AI Exam Proctoring — useHeadPose hook
// Consumes keypoints from detection results and computes head orientation
// with temporal smoothing to reduce false positives

import { useState, useEffect, useRef, useMemo } from 'react'
import { HeadPose, AI_CONFIG } from '../utils/aiTypes'
import { calculateHeadPose } from '../utils/postprocess'

interface UseHeadPoseOptions {
  keypoints: number[][]
  enabled?: boolean
}

interface UseHeadPoseResult {
  headPose: HeadPose | null
  isLookingAway: boolean
  lookAwayStartTime: number | null
  lookAwayDurationMs: number
}

export function useHeadPose({
  keypoints,
  enabled = true
}: UseHeadPoseOptions): UseHeadPoseResult {
  const [headPose, setHeadPose] = useState<HeadPose | null>(null)
  const [isLookingAway, setIsLookingAway] = useState(false)
  const [lookAwayStartTime, setLookAwayStartTime] = useState<number | null>(null)
  const [lookAwayDurationMs, setLookAwayDurationMs] = useState(0)

  // Rolling window for temporal smoothing (last N poses)
  const poseHistoryRef = useRef<{ pose: HeadPose; time: number }[]>([])
  const HISTORY_WINDOW_MS = 3000 // keep 3 seconds of history

  // Compute head pose from first detected person's keypoints
  const currentPose = useMemo(() => {
    if (!enabled || keypoints.length === 0) return null
    // Use first person detected
    const kpts = keypoints[0]
    if (!kpts || kpts.length < 15) return null // need at least nose + ears (5 keypoints × 3 values)
    return calculateHeadPose(kpts)
  }, [keypoints, enabled])

  useEffect(() => {
    if (!enabled || !currentPose) {
      setHeadPose(null)
      setIsLookingAway(false)
      setLookAwayStartTime(null)
      setLookAwayDurationMs(0)
      return
    }

    const now = performance.now()

    // Add to history
    poseHistoryRef.current.push({ pose: currentPose, time: now })

    // Prune old entries
    poseHistoryRef.current = poseHistoryRef.current.filter(
      (entry) => now - entry.time < HISTORY_WINDOW_MS
    )

    // Apply temporal smoothing: average over recent history for stable reading
    const recentPoses = poseHistoryRef.current
    if (recentPoses.length === 0) return

    const avgPose: HeadPose = {
      yaw: recentPoses.reduce((sum, p) => sum + p.pose.yaw, 0) / recentPoses.length,
      pitch: recentPoses.reduce((sum, p) => sum + p.pose.pitch, 0) / recentPoses.length,
      roll: recentPoses.reduce((sum, p) => sum + p.pose.roll, 0) / recentPoses.length
    }

    setHeadPose(avgPose)

    // Determine if looking away
    const yawExceeded = Math.abs(avgPose.yaw) > AI_CONFIG.YAW_THRESHOLD
    const pitchExceeded = Math.abs(avgPose.pitch) > AI_CONFIG.PITCH_THRESHOLD
    const rollExceeded = Math.abs(avgPose.roll) > AI_CONFIG.ROLL_THRESHOLD
    const isAway = yawExceeded || pitchExceeded || rollExceeded

    if (isAway) {
      if (!lookAwayStartTime) {
        setLookAwayStartTime(now)
        setLookAwayDurationMs(0)
      } else {
        const duration = now - lookAwayStartTime
        setLookAwayDurationMs(duration)

        // Only flag as "looking away" once sustained for HEAD_SUSTAIN_MS
        if (duration >= AI_CONFIG.HEAD_SUSTAIN_MS) {
          setIsLookingAway(true)
        }
      }
    } else {
      // Reset if they look back
      setIsLookingAway(false)
      setLookAwayStartTime(null)
      setLookAwayDurationMs(0)
    }
  }, [currentPose, enabled, lookAwayStartTime])

  return {
    headPose,
    isLookingAway,
    lookAwayStartTime,
    lookAwayDurationMs
  }
}

export default useHeadPose
