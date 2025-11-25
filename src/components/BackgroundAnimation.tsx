import { useEffect, useRef } from 'react'
import { useAnimation } from '../context/AnimationContext'
import './BackgroundAnimation.css'

interface GradientBlob {
  x: number
  y: number
  baseY: number // Starting Y position (bottom of screen)
  baseX: number // Original X position for reset after explosion
  floatOffset: number // How far up the blob floats
  radius: number
  hue: number
  saturation: number
  lightness: number
  phase: number
  speed: number
}

interface AnimationParams {
  speedMultiplier: number
  saturationBoost: number
  lightnessBoost: number
  alphaBoost: number
  convergenceStrength: number
  explosionStrength: number
}

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<GradientBlob[]>([])
  const animationFrameRef = useRef<number>()
  const timeRef = useRef(0)

  // Animation context for dynamic control
  const { intensity, convergenceProgress } = useAnimation()

  // Mutable params ref to avoid re-renders during animation
  const paramsRef = useRef<AnimationParams>({
    speedMultiplier: 1,
    saturationBoost: 0,
    lightnessBoost: 0,
    alphaBoost: 0,
    convergenceStrength: 0,
    explosionStrength: 0,
  })

  // Update animation params when context values change
  useEffect(() => {
    paramsRef.current = {
      speedMultiplier: 1 + intensity * 2.5,          // 1x -> 3.5x
      saturationBoost: intensity * 35,               // 0 -> 35%
      lightnessBoost: intensity * 15,                // 0 -> 15%
      alphaBoost: intensity * 0.3,                   // 0 -> 0.3
      convergenceStrength: convergenceProgress < 0.7
        ? convergenceProgress / 0.7
        : 0,
      explosionStrength: convergenceProgress > 0.7
        ? (convergenceProgress - 0.7) / 0.3
        : 0,
    }
  }, [intensity, convergenceProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Initialize gradient blobs rising from bottom
    const initElements = () => {
      const blobs: GradientBlob[] = []
      const blobCount = 8

      // Color palette: cool pastels - purple, blue, green, teal
      const hueRanges = [
        { min: 260, max: 280 }, // Purple
        { min: 220, max: 240 }, // Blue
        { min: 140, max: 170 }, // Green
        { min: 180, max: 200 }, // Teal/cyan
        { min: 270, max: 290 }, // Violet
        { min: 200, max: 220 }, // Sky blue
        { min: 120, max: 145 }, // Lime/green
      ]

      for (let i = 0; i < blobCount; i++) {
        const hueRange = hueRanges[i % hueRanges.length]
        // Handle hue wrap-around for dusty rose
        let hue = hueRange.min + Math.random() * (hueRange.max - hueRange.min + (hueRange.max < hueRange.min ? 360 : 0))
        if (hue >= 360) hue -= 360

        const x = Math.random() * canvas.width
        blobs.push({
          x,
          baseX: x, // Store original position for reset
          baseY: canvas.height + 50 + Math.random() * 150, // Start below screen
          y: canvas.height + 50 + Math.random() * 150,
          floatOffset: 100 + Math.random() * 250, // How high they float up
          radius: 200 + Math.random() * 300,
          hue,
          saturation: 35 + Math.random() * 20, // Lower saturation for pastel
          lightness: 55 + Math.random() * 20,  // Higher lightness for pastel
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.0004, // Faster for more dynamic movement
        })
      }

      blobsRef.current = blobs
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initElements()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation loop - dark top with warm pastel glow rising from bottom
    const animate = () => {
      const params = paramsRef.current

      // Apply speed multiplier to time
      timeRef.current += 1 * params.speedMultiplier

      // Dark gradient - very dark purple at top, color only at very bottom
      const baseGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      baseGradient.addColorStop(0, '#05000a')    // Almost black with purple tint
      baseGradient.addColorStop(0.6, '#05000a')  // Stay dark much longer
      baseGradient.addColorStop(0.8, '#0a0012')  // Very dark purple
      baseGradient.addColorStop(0.9, '#0f0a1a')  // Dark purple
      baseGradient.addColorStop(1, '#150f22')    // Slightly lighter purple at bottom
      ctx.fillStyle = baseGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Apply blur for smooth, dreamy blending
      ctx.filter = 'blur(120px)'

      // Center point for convergence/explosion
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Update and draw blobs rising from bottom
      blobsRef.current.forEach((blob, index) => {
        const time = timeRef.current * blob.speed + blob.phase

        // Check if we're in convergence or explosion mode
        const isConverging = params.convergenceStrength > 0
        const isExploding = params.explosionStrength > 0

        if (isConverging) {
          // Pull blobs toward center
          const dx = centerX - blob.x
          const dy = centerY - blob.y
          blob.x += dx * params.convergenceStrength * 0.08
          blob.y += dy * params.convergenceStrength * 0.08
        } else if (isExploding) {
          // Push blobs outward from center
          const dx = blob.x - centerX
          const dy = blob.y - centerY
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          blob.x += (dx / dist) * params.explosionStrength * 35
          blob.y += (dy / dist) * params.explosionStrength * 35
        } else {
          // Normal floating motion
          const floatY = Math.sin(time * 1.2) * blob.floatOffset * 0.4 +
                         Math.sin(time * 0.7 + index) * 30
          const floatX = Math.sin(time * 0.8 + blob.phase) * 60 +
                         Math.cos(time * 0.5 + index * 0.5) * 40

          // Dynamic shimmer/wobble effect
          const shimmerX = (Math.random() - 0.5) * 4
          const shimmerY = (Math.random() - 0.5) * 4

          // Position blob - anchored at bottom, more active float
          blob.y = blob.baseY - blob.floatOffset + floatY + shimmerY
          blob.x += shimmerX * 0.5 + floatX * 0.002

          // Keep blob within horizontal bounds
          if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius
          if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius
        }

        // More noticeable pulsing for lifelike feel (amplified during intensity)
        const pulseAmplitude = 0.12 + params.alphaBoost * 0.15
        const pulse = 1 + Math.sin(time * 1.5) * pulseAmplitude + Math.sin(time * 2.3 + index) * 0.08
        const currentRadius = blob.radius * pulse

        // Create radial gradient for blob
        const gradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          currentRadius
        )

        // Apply boosted color values
        const boostedSaturation = Math.min(blob.saturation + params.saturationBoost, 100)
        const boostedLightness = Math.min(blob.lightness + params.lightnessBoost, 85)
        const baseAlpha = 0.4 + Math.sin(time * 0.5) * 0.1
        const boostedAlpha = Math.min(baseAlpha + params.alphaBoost, 0.9)

        gradient.addColorStop(0, `hsla(${blob.hue}, ${boostedSaturation}%, ${boostedLightness}%, ${boostedAlpha})`)
        gradient.addColorStop(0.3, `hsla(${blob.hue}, ${boostedSaturation - 5}%, ${boostedLightness}%, ${boostedAlpha * 0.8})`)
        gradient.addColorStop(0.6, `hsla(${blob.hue}, ${boostedSaturation - 10}%, ${boostedLightness - 5}%, ${boostedAlpha * 0.4})`)
        gradient.addColorStop(1, `hsla(${blob.hue}, ${boostedSaturation - 15}%, ${boostedLightness - 10}%, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, currentRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Reset filter
      ctx.filter = 'none'

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="background-animation" />
}
