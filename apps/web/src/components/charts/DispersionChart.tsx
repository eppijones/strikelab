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

    // High DPI support
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, '#12121a')
    bgGradient.addColorStop(1, '#0c0c12')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Filter valid shots
    const validShots = shots.filter(
      (s) => s.offlineDistance !== undefined && s.carryDistance !== undefined && !s.isMishit
    )

    if (validShots.length === 0) {
      ctx.fillStyle = '#606070'
      ctx.font = '14px Outfit'
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

    const offlineRange = Math.max(maxOffline - minOffline, 20)
    const carryRange = Math.max(maxCarry - minCarry, 20)
    const padding = 50

    // Scale functions
    const scaleX = (offline: number) => {
      const normalized = (offline - minOffline + offlineRange * 0.1) / (offlineRange * 1.2)
      return padding + normalized * (width - 2 * padding)
    }

    const scaleY = (carry: number) => {
      const normalized = (carry - minCarry + carryRange * 0.1) / (carryRange * 1.2)
      return height - padding - normalized * (height - 2 * padding)
    }

    // Draw grid with subtle glow
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.03)'
    ctx.lineWidth = 1

    // Vertical lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * (width - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw center line (target line)
    const centerX = scaleX(0)
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(centerX, padding)
    ctx.lineTo(centerX, height - padding)
    ctx.stroke()
    ctx.setLineDash([])

    // Target distance line
    if (targetDistance) {
      const targetY = scaleY(targetDistance)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding, targetY)
      ctx.lineTo(width - padding, targetY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw dispersion ellipse with gradient
    if (showEllipse && validShots.length >= 3) {
      const meanOffline = offlineValues.reduce((a, b) => a + b, 0) / offlineValues.length
      const meanCarry = carryValues.reduce((a, b) => a + b, 0) / carryValues.length

      const stdOffline = Math.sqrt(
        offlineValues.reduce((sum, v) => sum + Math.pow(v - meanOffline, 2), 0) / offlineValues.length
      )
      const stdCarry = Math.sqrt(
        carryValues.reduce((sum, v) => sum + Math.pow(v - meanCarry, 2), 0) / carryValues.length
      )

      const ellipseX = scaleX(meanOffline)
      const ellipseY = scaleY(meanCarry)
      const radiusX = (stdOffline * 2 * (width - 2 * padding)) / (offlineRange * 1.2)
      const radiusY = (stdCarry * 2 * (height - 2 * padding)) / (carryRange * 1.2)

      // Ellipse gradient fill
      const ellipseGradient = ctx.createRadialGradient(
        ellipseX, ellipseY, 0,
        ellipseX, ellipseY, Math.max(radiusX, radiusY)
      )
      ellipseGradient.addColorStop(0, 'rgba(0, 212, 255, 0.15)')
      ellipseGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)')
      ellipseGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = ellipseGradient
      ctx.beginPath()
      ctx.ellipse(ellipseX, ellipseY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      ctx.fill()

      // Ellipse stroke with glow
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.shadowColor = 'rgba(0, 212, 255, 0.5)'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.ellipse(ellipseX, ellipseY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Center crosshair
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'
      ctx.lineWidth = 1
      const crossSize = 8
      ctx.beginPath()
      ctx.moveTo(ellipseX - crossSize, ellipseY)
      ctx.lineTo(ellipseX + crossSize, ellipseY)
      ctx.moveTo(ellipseX, ellipseY - crossSize)
      ctx.lineTo(ellipseX, ellipseY + crossSize)
      ctx.stroke()

      // Center dot with glow
      ctx.fillStyle = '#00d4ff'
      ctx.shadowColor = '#00d4ff'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(ellipseX, ellipseY, 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // Draw shots with gradient and glow
    validShots.forEach((shot, index) => {
      const x = scaleX(shot.offlineDistance)
      const y = scaleY(shot.carryDistance)

      // Outer glow
      ctx.fillStyle = 'rgba(240, 240, 245, 0.1)'
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, 2 * Math.PI)
      ctx.fill()

      // Shot point with gradient
      const shotGradient = ctx.createRadialGradient(x, y, 0, x, y, 5)
      shotGradient.addColorStop(0, 'rgba(240, 240, 245, 1)')
      shotGradient.addColorStop(1, 'rgba(0, 212, 255, 0.8)')
      
      ctx.fillStyle = shotGradient
      ctx.shadowColor = 'rgba(0, 212, 255, 0.5)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Axes labels
    ctx.fillStyle = '#606070'
    ctx.font = '11px Outfit'
    ctx.textAlign = 'center'

    // X-axis label
    ctx.fillText('Offline Distance (m)', width / 2, height - 12)

    // Y-axis label
    ctx.save()
    ctx.translate(14, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Carry Distance (m)', 0, 0)
    ctx.restore()

    // Tick labels
    ctx.font = '10px JetBrains Mono'
    ctx.fillStyle = '#606070'

    // X-axis ticks
    const xTicks = [minOffline, 0, maxOffline]
    xTicks.forEach((tick) => {
      const x = scaleX(tick)
      ctx.fillText(tick.toFixed(0), x, height - padding + 18)
    })

    // Y-axis ticks
    const yTicks = [minCarry, (minCarry + maxCarry) / 2, maxCarry]
    ctx.textAlign = 'right'
    yTicks.forEach((tick) => {
      const y = scaleY(tick)
      ctx.fillText(tick.toFixed(0), padding - 8, y + 4)
    })

  }, [shots, targetDistance, width, height, showEllipse])

  return (
    <canvas
      ref={canvasRef}
      className={cn('rounded-xl', className)}
      style={{ width, height }}
    />
  )
}
