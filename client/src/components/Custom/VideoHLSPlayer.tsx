import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  src: string
  classNames?: string
}

const VideoPlayer = ({ src, classNames }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(videoRef.current)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('Video is ready to play')
        })

        return () => {
          hls.destroy()
        }
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src
      }
    }
  }, [src])

  return (
    <div className={classNames}>
      <video ref={videoRef} controls autoPlay style={{ width: '100%', height: 'auto' }} />
    </div>
  )
}

export default VideoPlayer
