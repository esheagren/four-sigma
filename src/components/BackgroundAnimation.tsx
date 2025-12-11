import { useEffect, useRef } from 'react'
import './BackgroundAnimation.css'

interface GradientBlob {
  baseX: number
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
  driftSpeed: number
  noiseSeedA: number
  noiseSeedB: number
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<GradientBlob[]>([])
  const animationFrameRef = useRef<number>()
  const timeRef = useRef(0) // seconds
  const lastTsRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Initialize gradient blobs rising from bottom
    const initElements = (width: number, height: number) => {
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

        const baseX = Math.random() * width
        const baseY = height + 120 + Math.random() * 140
        blobs.push({
          baseX,
          x: baseX,
          baseY, // Start further below screen
          y: baseY,
          floatOffset: 50 + Math.random() * 150, // Stay concentrated at bottom
          radius: 180 + Math.random() * 280,
          hue,
          saturation: 70 + Math.random() * 25, // Higher saturation for electric colors
          lightness: 55 + Math.random() * 15,  // Brighter
          phase: Math.random() * Math.PI * 2,
          // Speed in "time units" per second for smooth deterministic motion
          speed: 0.12 + Math.random() * 0.18,
          driftSpeed: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 6), // px/s
          noiseSeedA: Math.random() * Math.PI * 2,
          noiseSeedB: Math.random() * Math.PI * 2,
        })
      }

      blobsRef.current = blobs
    }

    // Set canvas size
    const resizeCanvas = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      // Render in device pixels for smoother gradients (esp. on Retina)
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))

      // Draw using CSS pixel coordinates
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      initElements(width, height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation loop - dark top with warm pastel glow rising from bottom
    const animate = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000) // cap dt to avoid jumps
      lastTsRef.current = ts
      timeRef.current += dt
      const t = timeRef.current
      const width = window.innerWidth
      const height = window.innerHeight

      // Dark gradient - very dark purple at top, color only at very bottom
      const baseGradient = ctx.createLinearGradient(0, 0, 0, height)
      baseGradient.addColorStop(0, '#05000a')    // Almost black with purple tint
      baseGradient.addColorStop(0.6, '#05000a')  // Stay dark much longer
      baseGradient.addColorStop(0.8, '#0a0012')  // Very dark purple
      baseGradient.addColorStop(0.9, '#0f0a1a')  // Dark purple
      baseGradient.addColorStop(1, '#150f22')    // Slightly lighter purple at bottom
      ctx.fillStyle = baseGradient
      ctx.fillRect(0, 0, width, height)

      // Apply blur for smooth, dreamy blending
      ctx.filter = 'blur(120px)'
      ctx.globalCompositeOperation = 'screen'

      // Update and draw blobs (smooth deterministic motion to avoid "static" flicker)
      blobsRef.current.forEach((blob, index) => {
        const time = t * blob.speed + blob.phase

        // Smooth "flame lick" lift (more motion near bottom, softer above)
        const lick = 0.55 + 0.45 * Math.sin(time * 1.1 + blob.noiseSeedA)
        const lick2 = 0.5 + 0.5 * Math.sin(time * 2.2 + blob.noiseSeedB + index * 0.7)
        const liftFactor = clamp01(0.25 + 0.75 * (0.6 * lick + 0.4 * lick2))
        const lift = blob.floatOffset * liftFactor

        // Gentle lateral waviness (no per-frame randomness)
        const waveX =
          Math.sin(time * 0.7 + blob.phase) * 70 +
          Math.sin(time * 1.3 + index * 0.9) * 30

        // Slow drift + wave, wrapped across screen (prevents accumulation jitter)
        const drift = blob.driftSpeed * t
        let x = blob.baseX + drift + waveX
        x = ((x % (width + blob.radius * 2)) + (width + blob.radius * 2)) % (width + blob.radius * 2)
        x -= blob.radius

        // Vertical: anchored below bottom, lift up with smooth licks + subtle turbulence
        const turbY =
          Math.sin(time * 1.6 + index * 1.3) * 10 +
          Math.sin(time * 3.1 + blob.phase) * 6
        const y = blob.baseY - lift + turbY

        blob.x = x
        blob.y = y

        // Gentle pulsing for lifelike feel
        const pulse = 1 + Math.sin(time * 1.4) * 0.12 + Math.sin(time * 2.2 + index) * 0.08
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

        // Brighter alpha, but modulated smoothly with lick strength
        const baseAlpha = 0.45 + 0.25 * liftFactor + Math.sin(time * 0.45) * 0.08

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
      ctx.globalCompositeOperation = 'source-over'

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="background-animation" />
}
