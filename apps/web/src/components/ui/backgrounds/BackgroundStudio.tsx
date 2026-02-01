import { cn } from '@/lib/utils'
import { DotGrid } from './DotGrid'
import { AuroraGlow, Spotlight } from './AuroraGlow'
import { NoiseTexture } from './NoiseTexture'
import { GridPattern, RadialGrid } from './GridPattern'

type BackgroundPreset = 
  | 'minimal'      // Just subtle noise
  | 'dots'         // Dot grid + noise
  | 'aurora'       // Aurora glow + noise
  | 'grid'         // Grid pattern + noise
  | 'dashboard'    // Aurora + dots (for main dashboard)
  | 'hero'         // Full effect for hero sections
  | 'card'         // Subtle for card backgrounds
  | 'radial'       // Concentric circles (golf-inspired)

interface BackgroundStudioProps {
  preset?: BackgroundPreset
  className?: string
  children?: React.ReactNode
  // Individual overrides
  showDots?: boolean
  showAurora?: boolean
  showNoise?: boolean
  showGrid?: boolean
  // Intensity controls
  auroraIntensity?: 'subtle' | 'medium' | 'strong'
  auroraPosition?: 'top' | 'center' | 'bottom'
  auroraColor?: 'sage' | 'champagne' | 'mixed'
  noiseOpacity?: number
  dotOpacity?: number
  gridOpacity?: number
}

export function BackgroundStudio({
  preset = 'minimal',
  className,
  children,
  showDots,
  showAurora,
  showNoise,
  showGrid,
  auroraIntensity = 'subtle',
  auroraPosition = 'top',
  auroraColor = 'sage',
  noiseOpacity = 0.02,
  dotOpacity = 0.4,
  gridOpacity = 0.3,
}: BackgroundStudioProps) {
  // Respect reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Determine what to show based on preset
  const presetConfig = {
    minimal: { dots: false, aurora: false, noise: true, grid: false },
    dots: { dots: true, aurora: false, noise: true, grid: false },
    aurora: { dots: false, aurora: true, noise: true, grid: false },
    grid: { dots: false, aurora: false, noise: true, grid: true },
    dashboard: { dots: true, aurora: true, noise: true, grid: false },
    hero: { dots: true, aurora: true, noise: true, grid: false },
    card: { dots: false, aurora: false, noise: true, grid: false },
    radial: { dots: false, aurora: false, noise: true, grid: false, radial: true },
  }

  const config = presetConfig[preset]
  
  const shouldShowDots = showDots ?? config.dots
  const shouldShowAurora = showAurora ?? config.aurora
  const shouldShowNoise = showNoise ?? config.noise
  const shouldShowGrid = showGrid ?? config.grid
  const shouldShowRadial = preset === 'radial'

  return (
    <div className={cn('relative', className)}>
      {/* Background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shouldShowAurora && (
          <AuroraGlow 
            intensity={auroraIntensity}
            position={auroraPosition}
            color={auroraColor}
          />
        )}
        
        {shouldShowGrid && (
          <GridPattern 
            opacity={gridOpacity} 
            animate={!prefersReducedMotion}
          />
        )}
        
        {shouldShowRadial && (
          <RadialGrid opacity={0.15} />
        )}
        
        {shouldShowDots && (
          <DotGrid 
            opacity={dotOpacity} 
            animate={!prefersReducedMotion}
          />
        )}
        
        {shouldShowNoise && (
          <NoiseTexture opacity={noiseOpacity} />
        )}
      </div>

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}

// Convenience wrappers for common uses
export function DashboardBackground({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundStudio 
      preset="dashboard" 
      auroraIntensity="subtle"
      auroraPosition="top"
    >
      {children}
    </BackgroundStudio>
  )
}

export function HeroBackground({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundStudio 
      preset="hero" 
      auroraIntensity="medium"
      auroraPosition="center"
    >
      {children}
    </BackgroundStudio>
  )
}

export function CardBackground({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundStudio preset="card" noiseOpacity={0.015}>
      {children}
    </BackgroundStudio>
  )
}

// Re-export Spotlight for direct use
export { Spotlight }
