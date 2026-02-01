import { cn } from '@/lib/utils'

interface NoiseTextureProps {
  className?: string
  opacity?: number
  blend?: 'normal' | 'overlay' | 'soft-light' | 'multiply'
}

export function NoiseTexture({ 
  className, 
  opacity = 0.03,
  blend = 'normal'
}: NoiseTextureProps) {
  // SVG noise pattern - very performant
  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`

  const blendModes = {
    normal: 'normal',
    overlay: 'overlay',
    'soft-light': 'soft-light',
    multiply: 'multiply',
  }

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{
        backgroundImage: noiseSvg,
        opacity,
        mixBlendMode: blendModes[blend],
      }}
    />
  )
}

// Film grain variant - more pronounced
export function FilmGrain({ 
  className, 
  opacity = 0.05 
}: { 
  className?: string
  opacity?: number 
}) {
  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.9' numOctaves='3' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  )
}
