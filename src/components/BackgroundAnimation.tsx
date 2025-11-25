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
      const blobCount = 10 // More blobs for richer effect

      // Aurora-inspired color palette: electric greens, magentas, purples, and warm reds
      const hueRanges = [
        { min: 120, max: 150 }, // Electric green (aurora)
        { min: 280, max: 310 }, // Magenta/purple
        { min: 160, max: 180 }, // Cyan/teal
        { min: 340, max: 360 }, // Red/magenta
        { min: 0, max: 20 },    // Red/orange
        { min: 260, max: 280 }, // Deep purple
        { min: 130, max: 160 }, // Bright green
        { min: 300, max: 330 }, // Pink/magenta
        { min: 180, max: 200 }, // Teal
        { min: 350, max: 370 }, // Red (wraps to magenta)
      ]

      for (let i = 0; i < blobCount; i++) {
        const hueRange = hueRanges[i % hueRanges.length]
        let hue = hueRange.min + Math.random() * (hueRange.max - hueRange.min)
        if (hue >= 360) hue -= 360

        const x = Math.random() * canvas.width
        blobs.push({
          x,
          baseY: canvas.height + 100 + Math.random() * 100, // Start further below screen
          y: canvas.height + 100 + Math.random() * 100,
          floatOffset: 50 + Math.random() * 150, // Stay concentrated at bottom
          radius: 180 + Math.random() * 280,
          hue,
          saturation: 70 + Math.random() * 25, // Higher saturation for electric colors
          lightness: 55 + Math.random() * 15,  // Brighter
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.0004,
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

        // Subtle floating motion - stay near bottom
        const floatY = Math.sin(time * 1.2) * blob.floatOffset * 0.25 +
                       Math.sin(time * 0.7 + index) * 15
        const floatX = Math.sin(time * 0.8 + blob.phase) * 80 +
                       Math.cos(time * 0.5 + index * 0.5) * 50

        // Dynamic shimmer/wobble effect
        const shimmerX = (Math.random() - 0.5) * 4
        const shimmerY = (Math.random() - 0.5) * 4

        // Position blob - anchored at bottom, more active float
        blob.y = blob.baseY - blob.floatOffset + floatY + shimmerY
        blob.x += shimmerX * 0.5 + floatX * 0.002

        // Keep blob within horizontal bounds
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius

        // Gentle pulsing for lifelike feel
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

        // Brighter alpha for more visible aurora effect
        const baseAlpha = 0.55 + Math.sin(time * 0.5) * 0.15

        gradient.addColorStop(0, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${baseAlpha})`)
        gradient.addColorStop(0.3, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${baseAlpha * 0.75})`)
        gradient.addColorStop(0.6, `hsla(${blob.hue}, ${blob.saturation - 5}%, ${blob.lightness - 5}%, ${baseAlpha * 0.4})`)
        gradient.addColorStop(1, `hsla(${blob.hue}, ${blob.saturation - 10}%, ${blob.lightness - 10}%, 0)`)

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
