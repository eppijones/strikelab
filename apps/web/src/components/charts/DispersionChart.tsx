import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Shot {
  offlineDistance: number
  carryDistance: number
  club?: string
  isMishit?: boolean
}

interface DispersionChartProps {
  shots: Shot[]
  targetDistance?: number
  width?: number
  height?: number
  showEllipse?: boolean
  className?: string
}

export function DispersionChart({
  shots,
  targetDistance,
  width = 400,
  height = 500,
  showEllipse = true,
  className,
}: DispersionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.fillStyle = '#1A1A22'
    ctx.fillRect(0, 0, width, height)

    // Filter valid shots
    const validShots = shots.filter(
      (s) => s.offlineDistance !== undefined && s.carryDistance !== undefined && !s.isMishit
    )

    if (validShots.length === 0) {
      ctx.fillStyle = '#8A8A99'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('No shot data available', width / 2, height / 2)
      return
    }

    // Calculate bounds
    const offlineValues = validShots.map((s) => s.offlineDistance)
    const carryValues = validShots.map((s) => s.carryDistance)

    const minOffline = Math.min(...offlineValues)
    const maxOffline = Math.max(...offlineValues)
    const minCarry = Math.min(...carryValues)
    const maxCarry = Math.max(...carryValues)

    // Add padding
    const offlineRange = Math.max(maxOffline - minOffline, 20)
    const carryRange = Math.max(maxCarry - minCarry, 20)
    const padding = 40

    // Scale functions
    const scaleX = (offline: number) => {
      const normalized = (offline - minOffline + offlineRange * 0.1) / (offlineRange * 1.2)
      return padding + normalized * (width - 2 * padding)
    }

    const scaleY = (carry: number) => {
      const normalized = (carry - minCarry + carryRange * 0.1) / (carryRange * 1.2)
      return height - padding - normalized * (height - 2 * padding)
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * (width - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw center line (target line)
    const centerX = scaleX(0)
    ctx.strokeStyle = 'rgba(35, 213, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(centerX, padding)
    ctx.lineTo(centerX, height - padding)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw target distance line if provided
    if (targetDistance) {
      const targetY = scaleY(targetDistance)
      ctx.strokeStyle = 'rgba(35, 213, 255, 0.3)'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding, targetY)
      ctx.lineTo(width - padding, targetY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Calculate and draw dispersion ellipse
    if (showEllipse && validShots.length >= 3) {
      const meanOffline =
        offlineValues.reduce((a, b) => a + b, 0) / offlineValues.length
      const meanCarry =
        carryValues.reduce((a, b) => a + b, 0) / carryValues.length

      const stdOffline = Math.sqrt(
        offlineValues.reduce((sum, v) => sum + Math.pow(v - meanOffline, 2), 0) /
          offlineValues.length
      )
      const stdCarry = Math.sqrt(
        carryValues.reduce((sum, v) => sum + Math.pow(v - meanCarry, 2), 0) /
          carryValues.length
      )

      const ellipseX = scaleX(meanOffline)
      const ellipseY = scaleY(meanCarry)
      const radiusX = (stdOffline * 2 * (width - 2 * padding)) / (offlineRange * 1.2)
      const radiusY = (stdCarry * 2 * (height - 2 * padding)) / (carryRange * 1.2)

      // Draw ellipse fill
      ctx.fillStyle = 'rgba(35, 213, 255, 0.1)'
      ctx.beginPath()
      ctx.ellipse(ellipseX, ellipseY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      ctx.fill()

      // Draw ellipse stroke
      ctx.strokeStyle = 'rgba(35, 213, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(ellipseX, ellipseY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw center point
      ctx.fillStyle = '#23D5FF'
      ctx.beginPath()
      ctx.arc(ellipseX, ellipseY, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw shots
    validShots.forEach((shot) => {
      const x = scaleX(shot.offlineDistance)
      const y = scaleY(shot.carryDistance)

      // Shot point
      ctx.fillStyle = 'rgba(244, 244, 246, 0.8)'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Glow effect
      ctx.fillStyle = 'rgba(244, 244, 246, 0.2)'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw axes labels
    ctx.fillStyle = '#8A8A99'
    ctx.font = '11px Inter'
    ctx.textAlign = 'center'

    // X-axis label
    ctx.fillText('Offline Distance (m)', width / 2, height - 10)

    // Y-axis label
    ctx.save()
    ctx.translate(12, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Carry Distance (m)', 0, 0)
    ctx.restore()

    // Draw tick labels
    ctx.font = '10px Inter'
    
    // X-axis ticks
    const xTicks = [minOffline, 0, maxOffline]
    xTicks.forEach((tick) => {
      const x = scaleX(tick)
      ctx.fillText(tick.toFixed(0), x, height - padding + 15)
    })

    // Y-axis ticks
    const yTicks = [minCarry, (minCarry + maxCarry) / 2, maxCarry]
    ctx.textAlign = 'right'
    yTicks.forEach((tick) => {
      const y = scaleY(tick)
      ctx.fillText(tick.toFixed(0), padding - 5, y + 4)
    })
  }, [shots, targetDistance, width, height, showEllipse])

  return (
    <canvas
      ref={canvasRef}
      className={cn('rounded-card', className)}
      style={{ width, height }}
    />
  )
}
