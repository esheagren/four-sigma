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
            radius: 200 + Math.random() * 200,
            hue,
            saturation: 70 + Math.random() * 25,
            lightness: 55 + Math.random() * 15,
            phase: Math.random() * Math.PI * 2,
            speed: 0.12 + Math.random() * 0.1,
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

        // Oscillating progress toward center (0.1 to 0.6 range)
        const baseProgress = 0.1 + 0.25 * (Math.sin(time * 0.5 + blob.noiseSeedA) + 1)
        const waveProgress = 0.1 * Math.sin(time * 1.1 + blob.noiseSeedB)
        const progress = clamp01(baseProgress + waveProgress)

        // Lerp from spawn position toward center
        let x = lerp(blob.baseX, blob.targetX, progress)
        let y = lerp(blob.baseY, blob.targetY, progress)

        // Add lateral drift perpendicular to movement direction
        const driftAmount = 50 * Math.sin(time * 0.7 + index * 0.5)
        const driftAmount2 = 25 * Math.sin(time * 1.4 + blob.phase)

        if (blob.edge === 'top' || blob.edge === 'bottom') {
          x += driftAmount + driftAmount2
        } else {
          y += driftAmount + driftAmount2
        }

        // Gentle pulsing
        const pulse = 1 + Math.sin(time * 1.2) * 0.15 + Math.sin(time * 2.0 + index) * 0.08
        const currentRadius = blob.radius * pulse

        // Calculate distance from center for alpha modulation
        const distFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        )
        // Alpha stronger near edges, fading toward center
        const distanceFactor = clamp01(distFromCenter / maxDistance)
        const baseAlpha = 0.35 + 0.35 * distanceFactor + Math.sin(time * 0.4) * 0.08

        // Create radial gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius)

        gradient.addColorStop(0, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${baseAlpha})`)
        gradient.addColorStop(0.3, `hsla(${blob.hue}, ${blob.saturation}%, ${blob.lightness}%, ${baseAlpha * 0.75})`)
        gradient.addColorStop(0.6, `hsla(${blob.hue}, ${blob.saturation - 5}%, ${blob.lightness - 5}%, ${baseAlpha * 0.4})`)
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
