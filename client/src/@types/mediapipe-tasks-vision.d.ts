declare module '@mediapipe/tasks-vision' {
  export interface NormalizedLandmark {
    x: number
    y: number
    z: number
    visibility?: number
  }

  export interface Category {
    index: number
    score: number
    categoryName: string
    displayName: string
  }

  export interface Classifications {
    categories: Category[]
    headIndex: number
    headName: string
  }

  export interface FaceLandmarkerResult {
    faceLandmarks: NormalizedLandmark[][]
    faceBlendshapes: Classifications[]
    facialTransformationMatrixes: any[]
  }

  export interface FaceLandmarkerOptions {
    baseOptions: {
      modelAssetPath?: string
      modelAssetBuffer?: Uint8Array
      delegate?: 'GPU' | 'CPU'
    }
    runningMode?: 'IMAGE' | 'VIDEO' | 'LIVE_STREAM'
    numFaces?: number
    minFaceDetectionConfidence?: number
    minFacePresenceConfidence?: number
    minTrackingConfidence?: number
    outputFaceBlendshapes?: boolean
    outputFacialTransformationMatrixes?: boolean
  }

  export class FaceLandmarker {
    static createFromOptions(
      resolver: WasmFileset,
      options: FaceLandmarkerOptions
    ): Promise<FaceLandmarker>

    detectForVideo(video: HTMLVideoElement, timestampMs: number): FaceLandmarkerResult
    detect(image: HTMLImageElement | HTMLCanvasElement): FaceLandmarkerResult
    close(): void

    static FACE_LANDMARKS_LEFT_IRIS: any
    static FACE_LANDMARKS_RIGHT_IRIS: any
    static FACE_LANDMARKS_LEFT_EYE: any
    static FACE_LANDMARKS_RIGHT_EYE: any
    static FACE_LANDMARKS_FACE_OVAL: any
    static FACE_LANDMARKS_CONTOURS: any
    static FACE_LANDMARKS_TESSELATION: any
  }

  export interface WasmFileset {}

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<WasmFileset>
  }

  export class DrawingUtils {
    constructor(ctx: CanvasRenderingContext2D)
    drawLandmarks(landmarks: NormalizedLandmark[], options?: any): void
    drawConnectors(landmarks: NormalizedLandmark[], connections: any, options?: any): void
  }
}
