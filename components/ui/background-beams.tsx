"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const beams = Array.from({ length: 20 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
    }))

    const drawBeam = (x: number, y: number, radius: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, "rgba(91, 233, 185, 0.3)")
      gradient.addColorStop(1, "rgba(91, 233, 185, 0)")
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      beams.forEach((beam) => {
        beam.x += beam.vx
        beam.y += beam.vy

        if (beam.x < 0 || beam.x > width) beam.vx *= -1
        if (beam.y < 0 || beam.y > height) beam.vy *= -1

        drawBeam(beam.x, beam.y, beam.radius * 20)
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 z-0 h-screen w-screen bg-off-black",
        className
      )}
    />
  )
}