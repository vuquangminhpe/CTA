// AI Exam Proctoring — Postprocessing
// Parse YOLO26n NMS-free outputs into DetectionBox[] and HeadPose

import { DetectionBox, HeadPose, AI_CONFIG } from './aiTypes'

// Use as a default, can be overridden by actual shape
const DEFAULT_OUTPUT_DETECTIONS: number = AI_CONFIG.MODEL_OUTPUT_DETECTIONS

/**
 * Parse detection model output [1, 300, 6] → DetectionBox[]
 * Each row: [x1, y1, x2, y2, confidence, class_id]
 * YOLO26 NMS-free → 300 predictions already filtered, we just threshold by confidence
 */
export function postprocessDetections(
  rawOutput: Float32Array | number[],
  threshold: number,
  labels: Record<number, string>,
  shape?: number[]
): DetectionBox[] {
  const detections: DetectionBox[] = []

  // Auto-detect format from shape
  // Common YOLO outputs: [1, N, 6] or [1, 6, N] (transposed)
  let numDetections = DEFAULT_OUTPUT_DETECTIONS
  let stride = 6
  let transposed = false

  if (shape && shape.length === 3) {
    if (shape[2] === 6 || shape[2] === 5) {
      // [1, N, 6] — standard format
      numDetections = shape[1]
      stride = shape[2]
    } else if (shape[1] === 6 || shape[1] === 5) {
      // [1, 6, N] — transposed format
      numDetections = shape[2]
      stride = shape[1]
      transposed = true
    } else {
      // Unknown — try to infer
      numDetections = shape[1]
      stride = shape[2]
    }
  }

  for (let i = 0; i < numDetections; i++) {
    let x1: number, y1: number, x2: number, y2: number, conf: number, classId: number

    if (transposed) {
      // [1, 6, N]: each row is a feature, each column is a detection
      x1 = rawOutput[0 * numDetections + i]
      y1 = rawOutput[1 * numDetections + i]
      x2 = rawOutput[2 * numDetections + i]
      y2 = rawOutput[3 * numDetections + i]
      conf = rawOutput[4 * numDetections + i]
      classId = stride > 5 ? Math.round(rawOutput[5 * numDetections + i]) : 0
    } else {
      // [1, N, 6]: each row is a detection
      const offset = i * stride
      x1 = rawOutput[offset]
      y1 = rawOutput[offset + 1]
      x2 = rawOutput[offset + 2]
      y2 = rawOutput[offset + 3]
      conf = rawOutput[offset + 4]
      classId = stride > 5 ? Math.round(rawOutput[offset + 5]) : 0
    }

    if (conf < threshold) continue

    detections.push({ x1, y1, x2, y2, conf, classId, label: labels[classId] || `class_${classId}` })
  }

  return detections
}

/**
 * Parse pose model output [1, 300, 56] → boxes + keypoints
 * 56 = 4(box) + 1(conf) + 1(cls) + 17kpts × 3(x,y,visibility)
 * Returns both detection boxes and raw keypoint arrays
 */
export function postprocessPose(
  rawOutput: Float32Array | number[],
  threshold: number,
  labels: Record<number, string>,
  shape?: number[]
): { boxes: DetectionBox[]; allKeypoints: number[][] } {
  const boxes: DetectionBox[] = []
  const allKeypoints: number[][] = []

  // Auto-detect format: [1, N, 56] or [1, 56, N]
  // Pose stride is 56 (4+1+17*3, no cls) or 57 (4+1+1+17*3, with cls)
  let numDetections = DEFAULT_OUTPUT_DETECTIONS
  let stride = 56
  let transposed = false

  if (shape && shape.length === 3) {
    const dim1 = shape[1]
    const dim2 = shape[2]
    // Identify which dimension is the pose stride (~56-57)
    const isPoseStride = (d: number) => d >= 50 && d <= 60

    if (isPoseStride(dim2) && !isPoseStride(dim1)) {
      // [1, N, 56] — standard format (e.g. [1, 300, 56] from NMS export)
      numDetections = dim1
      stride = dim2
      transposed = false
    } else if (isPoseStride(dim1) && !isPoseStride(dim2)) {
      // [1, 56, N] — transposed format (e.g. [1, 56, 8400] raw export)
      numDetections = dim2
      stride = dim1
      transposed = true
    } else {
      // Fallback: smaller dimension is likely the stride
      if (dim1 <= dim2) {
        stride = dim1
        numDetections = dim2
        transposed = true
      } else {
        numDetections = dim1
        stride = dim2
        transposed = false
      }
    }
    console.log(
      `[postprocessPose] shape=${JSON.stringify(shape)}, stride=${stride}, numDet=${numDetections}, transposed=${transposed}`
    )
  }

  // Calculate where keypoints actually start based on stride
  // If stride is 57, kpts start at 6 (x,y,w,h,conf,cls)
  // If stride is 56, kpts start at 5 (x,y,w,h,conf) -- cls is omitted or merged
  const kptOffset = stride >= 57 ? 6 : 5

  for (let i = 0; i < numDetections; i++) {
    let x1: number, y1: number, x2: number, y2: number, conf: number, classId: number

    if (transposed) {
      x1 = rawOutput[0 * numDetections + i]
      y1 = rawOutput[1 * numDetections + i]
      x2 = rawOutput[2 * numDetections + i]
      y2 = rawOutput[3 * numDetections + i]
      conf = rawOutput[4 * numDetections + i]
      classId = stride >= 57 ? Math.round(rawOutput[5 * numDetections + i]) : 0
    } else {
      const offset = i * stride
      x1 = rawOutput[offset]
      y1 = rawOutput[offset + 1]
      x2 = rawOutput[offset + 2]
      y2 = rawOutput[offset + 3]
      conf = rawOutput[offset + 4]
      classId = stride >= 57 ? Math.round(rawOutput[offset + 5]) : 0
    }

    if (conf < threshold) continue

    boxes.push({ x1, y1, x2, y2, conf, classId, label: labels[classId] || `class_${classId}` })

    // Extract 17 keypoints × 3 (x, y, visibility)
    // Make sure we don't read past the array bounds if the tensor is malformed
    const kpts: number[] = []
    for (let k = 0; k < 17 * 3; k++) {
      if (kptOffset + k >= stride) break // prevent out of bounds reading within stride

      let val = 0
      if (transposed) {
        const idx = (kptOffset + k) * numDetections + i
        val = rawOutput[idx] ?? 0
      } else {
        const idx = i * stride + kptOffset + k
        val = rawOutput[idx] ?? 0
      }
      kpts.push(val)
    }
    allKeypoints.push(kpts)
  }

  return { boxes, allKeypoints }
}

/**
 * Calculate head pose from COCO 17-keypoint format.
 * Key points used:
 *   0 = nose
 *   1 = left_eye, 2 = right_eye
 *   3 = left_ear, 4 = right_ear
 *
 * Returns yaw (horizontal), pitch (vertical), roll (tilt) in degrees.
 */
export function calculateHeadPose(keypoints: number[]): HeadPose {
  // Each keypoint = (x, y, visibility), 3 values each
  const noseX = keypoints[0],
    noseY = keypoints[1],
    noseVis = keypoints[2]
  const leftEarX = keypoints[3 * 3],
    leftEarY = keypoints[3 * 3 + 1],
    leftEarVis = keypoints[3 * 3 + 2]
  const rightEarX = keypoints[4 * 3],
    rightEarY = keypoints[4 * 3 + 1],
    rightEarVis = keypoints[4 * 3 + 2]

  // Can't compute anything without nose
  const minVis = 0.3
  if (noseVis < minVis) {
    return { yaw: 0, pitch: 0, roll: 0 }
  }

  const leftEarOk = leftEarVis >= minVis
  const rightEarOk = rightEarVis >= minVis

  // ═══ CASE 1: Both ears visible — full computation ═══
  if (leftEarOk && rightEarOk) {
    const earSpanX = rightEarX - leftEarX
    const earSpanY = rightEarY - leftEarY
    const earDist = Math.sqrt(earSpanX * earSpanX + earSpanY * earSpanY)

    if (earDist < 1) {
      return { yaw: 0, pitch: 0, roll: 0 }
    }

    // Yaw: horizontal rotation — nose offset from ear midpoint
    const midEarX = (leftEarX + rightEarX) / 2
    const noseOffsetX = noseX - midEarX
    const yaw = Math.atan2(noseOffsetX, earDist * 0.5) * (180 / Math.PI)

    // Pitch: vertical tilt — with baseline correction
    // The nose is anatomically ~0.33 × earDist BELOW mid-ear when facing straight.
    // Without this offset, a neutral face always reads ~30°+ pitch.
    const midEarY = (leftEarY + rightEarY) / 2
    const noseOffsetY = noseY - midEarY
    const baselineY = earDist * 0.33
    const pitch = Math.atan2(noseOffsetY - baselineY, earDist * 0.5) * (180 / Math.PI)

    // Roll: head tilt (ear-to-ear angle from horizontal)
    const roll = Math.atan2(earSpanY, Math.abs(earSpanX)) * (180 / Math.PI)

    return { yaw, pitch, roll }
  }

  // ═══ CASE 2: Only ONE ear visible — head is significantly turned ═══
  if (leftEarOk || rightEarOk) {
    const earX = leftEarOk ? leftEarX : rightEarX
    const earY = leftEarOk ? leftEarY : rightEarY

    const dx = noseX - earX
    const dy = noseY - earY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return { yaw: 0, pitch: 0, roll: 0 }

    // Direction convention:
    //   COCO left_ear = person's left (right side of image when facing camera)
    //   COCO right_ear = person's right (left side of image when facing camera)
    //
    //   left_ear gone  → person turned to their RIGHT → positive yaw
    //   right_ear gone → person turned to their LEFT  → negative yaw
    const yawSign = rightEarOk ? 1 : -1

    // When one ear just disappears (vis drops below 0.3), yaw is typically ≥ 35°.
    // Scale with nose-to-ear distance: further apart = more turned.
    // Typical nose-to-ear distance when barely turned: ~70-90px on 640×640.
    const estimatedYaw = Math.min(75, Math.max(38, 38 + (dist - 80) * 0.2))

    return { yaw: yawSign * estimatedYaw, pitch: 0, roll: 0 }
  }

  // ═══ CASE 3: Neither ear visible — cannot compute ═══
  return { yaw: 0, pitch: 0, roll: 0 }
}
