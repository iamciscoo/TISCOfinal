'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoCardProps {
  src: string
  poster?: string
  className?: string
  preload?: 'none' | 'metadata' | 'auto'
  lazy?: boolean
  muted?: boolean
  loop?: boolean
  autoPlay?: boolean // Autoplay when in view
}

export const VideoCard: React.FC<VideoCardProps> = ({ 
  src,
  poster,
  className = '',
  preload = 'none',
  lazy = true,
  muted = true,
  loop = true,
  autoPlay = true,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return

    // Use IntersectionObserver to lazy-load and control playback
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const visible = entry.isIntersecting && entry.intersectionRatio > 0
        setInView(visible)
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure desired attributes
    video.muted = muted
    video.loop = loop
    video.playsInline = true

    // Always play immediately when video is loaded (no waiting for in-view)
    if (autoPlay) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay might be blocked; it will play on user interaction
        })
      }
    }

    // Pause only when completely out of view (performance optimization)
    if (!inView && lazy) {
      try { video.pause() } catch {}
    } else if (inView && autoPlay) {
      // Resume playing when back in view
      try { video.play() } catch {}
    }
  }, [inView, lazy, muted, loop, autoPlay])

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-xl"
        muted={muted}
        loop={loop}
        playsInline
        autoPlay={autoPlay}
        preload={preload}
        poster={poster}
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
