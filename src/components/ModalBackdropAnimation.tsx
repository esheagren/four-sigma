import { useEffect, useRef } from 'react'
import './ModalBackdropAnimation.css'

type Edge = 'top' | 'bottom' | 'left' | 'right'

interface EdgeBlob {
  edge: Edge
  baseX: number
  baseY: number
  targetX: number
  targetY: number
  radius: number
  hue: number
  saturation: number
  lightness: number
  phase: number
  speed: number
  noiseSeedA: number
  noiseSeedB: number
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function ModalBackdropAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<EdgeBlob[]>([])
  const animationFrameRef = useRef<number>()
  const timeRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Aurora-inspired color palette (same as BackgroundAnimation)
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
      { min: 140, max: 170 }, // Green-cyan
      { min: 290, max: 320 }, // Purple-pink
    ]

    const initElements = (width: number, height: number) => {
      const blobs: EdgeBlob[] = []
      const blobsPerEdge = 3
      const edges: Edge[] = ['top', 'bottom', 'left', 'right']
      const centerX = width / 2
      const centerY = height / 2

      edges.forEach((edge, edgeIndex) => {
        for (let i = 0; i < blobsPerEdge; i++) {
          const hueRange = hueRanges[(edgeIndex * blobsPerEdge + i) % hueRanges.length]
          let hue = hueRange.min + Math.random() * (hueRange.max - hueRange.min)
          if (hue >= 360) hue -= 360

          // Calculate spawn position based on edge
          let baseX: number, baseY: number
          const spread = 0.7 // Use 70% of edge length
          const offset = (i + 0.5) / blobsPerEdge // Evenly distributed

          switch (edge) {
            case 'top':
              baseX = width * (0.15 + spread * offset)
              baseY = -180
              break
            case 'bottom':
              baseX = width * (0.15 + spread * offset)
              baseY = height + 180
              break
            case 'left':
              baseX = -180
              baseY = height * (0.15 + spread * offset)
              break
            case 'right':
              baseX = width + 180
              baseY = height * (0.15 + spread * offset)
              break
          }

          blobs.push({
            edge,
            baseX,
            baseY,
            targetX: centerX,
            targetY: centerY,
            radius: 150 + Math.random() * 100, // Smaller radius for subtle edge glow
            hue,
            saturation: 60 + Math.random() * 20, // Slightly less saturated
            lightness: 50 + Math.random() * 15,
            phase: Math.random() * Math.PI * 2,
            speed: 0.08 + Math.random() * 0.06, // Slower, more subtle movement
            noiseSeedA: Math.random() * Math.PI * 2,
            noiseSeedB: Math.random() * Math.PI * 2,
          })
        }
      })

      blobsRef.current = blobs
    }

    const resizeCanvas = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      initElements(width, height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000)
      lastTsRef.current = ts
      timeRef.current += dt
      const t = timeRef.current
      const width = window.innerWidth
      const height = window.innerHeight
      const centerX = width / 2
      const centerY = height / 2
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

      // Clear canvas (transparent background)
      ctx.clearRect(0, 0, width, height)

      // Apply blur for smooth, dreamy blending
      ctx.filter = 'blur(120px)'
      ctx.globalCompositeOperation = 'screen'

      blobsRef.current.forEach((blob, index) => {
        const time = t * blob.speed + blob.phase

        // Stay very close to edges - only 5-15% toward center
        const baseProgress = 0.05 + 0.05 * (Math.sin(time * 0.4 + blob.noiseSeedA) + 1)
        const waveProgress = 0.02 * Math.sin(time * 0.8 + blob.noiseSeedB)
        const progress = clamp01(baseProgress + waveProgress)

        // Lerp from spawn position toward center (barely moves inward)
        let x = lerp(blob.baseX, blob.targetX, progress)
        let y = lerp(blob.baseY, blob.targetY, progress)

        // Subtle lateral drift along the edge
        const driftAmount = 30 * Math.sin(time * 0.5 + index * 0.5)
        const driftAmount2 = 15 * Math.sin(time * 1.0 + blob.phase)

        if (blob.edge === 'top' || blob.edge === 'bottom') {
          x += driftAmount + driftAmount2
        } else {
          y += driftAmount + driftAmount2
        }

        // Very gentle pulsing
        const pulse = 1 + Math.sin(time * 0.8) * 0.08 + Math.sin(time * 1.5 + index) * 0.04
        const currentRadius = blob.radius * pulse

        // Lower alpha for subtle edge glow
        const baseAlpha = 0.2 + Math.sin(time * 0.3) * 0.05

        // Create radial gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius)

        gradient.addColorStop(0, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${baseAlpha})`)
        gradient.addColorStop(0.4, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${baseAlpha * 0.6})`)
        gradient.addColorStop(0.7, `hsla(${blob.hue}, ${blob.saturation - 5}%, ${blob.lightness - 5}%, ${baseAlpha * 0.25})`)
        gradient.addColorStop(1, `hsla(${blob.hue}, ${blob.saturation - 10}%, ${blob.lightness - 10}%, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2)
        ctx.fill()
      })

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

  return <canvas ref={canvasRef} className="modal-backdrop-animation" />
}
