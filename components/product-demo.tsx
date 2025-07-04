"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { IPhoneMockup } from "react-device-mockup"

export function ProductDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [screenWidth, setScreenWidth] = useState(250)

  useEffect(() => {
    // Set initial screen width
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth < 640 ? 160 : 250)
    }
    
    updateScreenWidth()
    
    window.addEventListener('resize', updateScreenWidth)
    
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  useEffect(() => {
    const video = document.querySelector("video")
    if (video) {
      video.play()
      setIsPlaying(true)
    }
  }, [])

  const togglePlayPause = () => {
    const video = document.querySelector("video")
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full flex justify-center mb-8 md:mb-16"
    >
      <IPhoneMockup 
        screenWidth={screenWidth}
        screenType="island" 
        hideStatusBar
      >
        <div className="relative flex justify-center w-full h-full overflow-hidden mt-3.5">
          <video
            src="/demo-reel.webm"
            className="absolute top-0 left-1/2 w-full h-full cursor-pointer mt-1"
            style={{ 
              transform: 'translateX(-50%) scale(1.09)',
              objectFit: 'contain'
            }}
            loop
            muted
            playsInline
            onClick={togglePlayPause}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      </IPhoneMockup>
    </motion.div>
  )
}