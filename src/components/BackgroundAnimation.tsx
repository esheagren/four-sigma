import { useEffect, useRef } from 'react'
import './BackgroundAnimation.css'

interface GradientBlob {
  x: number
  y: number
  targetX: number
  targetY: number
  radius: number
  targetRadius: number
  hue: number
  targetHue: number
  saturation: number
  lightness: number
  phase: number
  speed: number
}

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<GradientBlob[]>([])
  const animationFrameRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Initialize gradient blobs (molten lava lamp effect)
    const initElements = () => {
      const blobs: GradientBlob[] = []
      const blobCount = 5 // Fewer, larger blobs for Stripe-like effect

      // Color palette: warm purples, blues, oranges (positive futurism)
      const hueRanges = [
        { min: 250, max: 280 }, // Purple-blue
        { min: 200, max: 230 }, // Blue
        { min: 280, max: 320 }, // Purple-pink
        { min: 15, max: 35 },   // Orange-coral (warm accent)
      ]

      for (let i = 0; i < blobCount; i++) {
        const hueRange = hueRanges[i % hueRanges.length]
        const hue = hueRange.min + Math.random() * (hueRange.max - hueRange.min)

        blobs.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          targetX: Math.random() * canvas.width,
          targetY: Math.random() * canvas.height,
          radius: 200 + Math.random() * 400,
          targetRadius: 200 + Math.random() * 400,
          hue,
          targetHue: hue + (Math.random() - 0.5) * 40,
          saturation: 60 + Math.random() * 30,
          lightness: 65 + Math.random() * 20,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0003 + Math.random() * 0.0005,
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

    // Animation loop - Stripe-inspired molten gradient mesh
    const animate = () => {
      timeRef.current += 1

      // Base gradient (subtle, light background)
      const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      baseGradient.addColorStop(0, '#f8f9fc')
      baseGradient.addColorStop(1, '#f3f5f9')
      ctx.fillStyle = baseGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Apply blur for smooth blending (lava lamp effect)
      ctx.filter = 'blur(80px)'

      // Update and draw molten gradient blobs
      blobsRef.current.forEach((blob) => {
        const time = timeRef.current * blob.speed + blob.phase

        // Add static-like jitter to movement (data fluctuation)
        const jitterX = (Math.random() - 0.5) * 3
        const jitterY = (Math.random() - 0.5) * 3
        const jitterRadius = (Math.random() - 0.5) * 10
        const jitterHue = (Math.random() - 0.5) * 2

        // Move towards target with jitter
        blob.x += (blob.targetX - blob.x) * 0.003 + jitterX
        blob.y += (blob.targetY - blob.y) * 0.003 + jitterY
        blob.radius += (blob.targetRadius - blob.radius) * 0.002 + jitterRadius
        blob.hue += (blob.targetHue - blob.hue) * 0.001 + jitterHue

        // Pick new target when close enough
        const dist = Math.sqrt((blob.targetX - blob.x) ** 2 + (blob.targetY - blob.y) ** 2)
        if (dist < 50 || Math.random() < 0.001) {
          blob.targetX = Math.random() * canvas.width
          blob.targetY = Math.random() * canvas.height
          blob.targetRadius = 200 + Math.random() * 500
          blob.targetHue = blob.hue + (Math.random() - 0.5) * 60
        }

        // Breathing/pulsing effect with static variation
        const pulse = 1 + Math.sin(time * 2) * 0.15 + (Math.random() - 0.5) * 0.05
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

        // Vibrant, saturated core fading to transparent
        const alpha = 0.6 + Math.sin(time * 1.5) * 0.2
        gradient.addColorStop(0, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${alpha})`)
        gradient.addColorStop(0.5, `hsla(${blob.hue}, ${blob.saturation - 10}%, ${blob.lightness + 5}%, ${alpha * 0.6})`)
        gradient.addColorStop(1, `hsla(${blob.hue}, ${blob.saturation - 20}%, ${blob.lightness + 10}%, 0)`)

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
