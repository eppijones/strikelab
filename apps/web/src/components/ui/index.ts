// Core UI Components
export { Button, IconButton, PillButton, MotionButton } from './Button'
export {
  Card,
  MotionCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MetricCard,
  FeatureCard,
} from './Card'
export { Input, TextArea, SearchInput } from './Input'
export { Badge, StatusBadge, CountBadge, TagBadge } from './Badge'
export { ScoreRing } from './ScoreRing'
export { Select } from './Select'
export { Toggle, ToggleGroup, SegmentedControl } from './Toggle'
export { TagInput } from './TagInput'
export { ScaleInput } from './ScaleInput'

// StrikeLab design primitives (canonical — from packages/design-tokens / StrikelabDesign)
export { Panel, Brackets } from './Panel'
export { Stat } from './Stat'
export { Tag } from './Tag'
export { Spark } from './Spark'
export { SLLogo } from './SLLogo'

// Motion helpers
export {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ScaleOnHover,
  GlowPulse,
  AnimatedNumber,
  PageTransition,
  FloatingElement,
  ShimmerText,
  RevealOnScroll,
} from './MotionWrapper'

// Legacy (to be removed in Phase 7 — kept for transition compatibility)
export { CardGlass } from './CardGlass'
export { AIOrb } from './AIOrb'
export { AICoachOverlay } from './AICoachOverlay'
export { NeuralIcon, NeuralIconSimple, StrikeLabIcon } from './NeuralIcon'
export { DialedMeter, DialedBadge, DiagnosisProgress } from './DialedMeter'
export {
  DotGrid,
  InteractiveDotGrid,
  AuroraGlow,
  Spotlight,
  NoiseTexture,
  FilmGrain,
  GridPattern,
  PerspectiveGrid,
  RadialGrid,
  BackgroundStudio,
  DashboardBackground,
  HeroBackground,
  CardBackground,
} from './backgrounds'
export { AnimatedBackground, GlowDivider, StatusPulse } from './AnimatedBackground'
