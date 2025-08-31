'use client'

import { useRef, useEffect } from 'react'

interface VideoCardProps {
  src: string
  className?: string
}

export const VideoCard: React.FC<VideoCardProps> = ({ 
  src, 
  className = '' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Ensure video plays automatically and loops
      video.muted = true
      video.loop = true
      video.playsInline = true
      
      // Attempt to play the video
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented, video will play when user interacts
          console.log('Video autoplay prevented by browser')
        })
      }
    }
  }, [])

  return (
    <div className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover rounded-xl"
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Subtle overlay for better visual integration */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent rounded-xl" />
      
      {/* Live indicator */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">LIVE TOUR</span>
        </div>
      </div>
    </div>
  )
}
