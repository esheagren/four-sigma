import { useEffect, useRef } from 'react'
import './BackgroundAnimation.css'

interface GradientBlob {
  x: number
  y: number
  baseY: number // Starting Y position (bottom of screen)
  floatOffset: number // How far up the blob floats
  radius: number
  hue: number
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

        blobs.push({
          x: Math.random() * canvas.width,
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
      timeRef.current += 1

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

      // Update and draw blobs rising from bottom
      blobsRef.current.forEach((blob, index) => {
        const time = timeRef.current * blob.speed + blob.phase

        // More dynamic floating motion - varied frequencies per blob
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

        // More noticeable pulsing for lifelike feel
        const pulse = 1 + Math.sin(time * 1.5) * 0.12 + Math.sin(time * 2.3 + index) * 0.08
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

        // Soft pastel glow effect
        const alpha = 0.4 + Math.sin(time * 0.5) * 0.1
        gradient.addColorStop(0, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${alpha})`)
        gradient.addColorStop(0.3, `hsla(${blob.hue}, ${blob.saturation - 5}%, ${blob.lightness}%, ${alpha * 0.8})`)
        gradient.addColorStop(0.6, `hsla(${blob.hue}, ${blob.saturation - 10}%, ${blob.lightness - 5}%, ${alpha * 0.4})`)
        gradient.addColorStop(1, `hsla(${blob.hue}, ${blob.saturation - 15}%, ${blob.lightness - 10}%, 0)`)

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
