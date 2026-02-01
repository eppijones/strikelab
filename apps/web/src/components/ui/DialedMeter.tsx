import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type DialedState = 'searching' | 'close' | 'dialed' | 'locked'

interface DialedMeterProps {
  state: DialedState
  label?: string
  sublabel?: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const stateConfig = {
  searching: {
    label: 'Searching',
    sublabel: 'Gathering patterns',
    progress: 15,
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    textColor: 'text-gray-400',
    icon: '◎',
  },
  close: {
    label: 'Close',
    sublabel: 'Pattern emerging',
    progress: 50,
    color: 'from-cyan-500 to-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    icon: '●',
  },
  dialed: {
    label: 'Dialed',
    sublabel: 'Consistent pattern',
    progress: 85,
    color: 'from-cyan-400 to-cyan-300',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-400/40',
    textColor: 'text-cyan-300',
    icon: '●',
  },
  locked: {
    label: 'Locked',
    sublabel: 'Validated fix',
    progress: 100,
    color: 'from-green-500 to-green-400',
    bgColor: 'bg-green-500/15',
    borderColor: 'border-green-500/40',
    textColor: 'text-green-400',
    icon: '✓',
  },
}

export function DialedMeter({ 
  state, 
  label, 
  sublabel,
  className,
  showIcon = true,
  size = 'md'
}: DialedMeterProps) {
  const config = stateConfig[state]
  
  const sizes = {
    sm: { padding: 'px-3 py-2', text: 'text-xs', bar: 'h-1' },
    md: { padding: 'px-4 py-3', text: 'text-sm', bar: 'h-1.5' },
    lg: { padding: 'px-5 py-4', text: 'text-base', bar: 'h-2' },
  }

  return (
    <div 
      className={cn(
        'rounded-xl border backdrop-blur-sm transition-all duration-300',
        config.bgColor,
        config.borderColor,
        sizes[size].padding,
        className
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        {showIcon && (
          <motion.span 
            className={cn('flex items-center justify-center w-6 h-6 rounded-full', config.bgColor)}
            animate={state === 'searching' ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className={cn(sizes[size].text, config.textColor)}>{config.icon}</span>
          </motion.span>
        )}
        <div>
          <p className={cn('font-semibold', sizes[size].text, config.textColor)}>
            {label || config.label}
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={cn('w-full rounded-full bg-gray-700/30 overflow-hidden', sizes[size].bar)}>
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', config.color)}
          initial={{ width: 0 }}
          animate={{ width: `${config.progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      
      <p className="text-[10px] text-theme-text-muted mt-1.5">
        {sublabel || config.sublabel}
      </p>
    </div>
  )
}

// Compact inline version
export function DialedBadge({ state }: { state: DialedState }) {
  const config = stateConfig[state]
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
      config.bgColor,
      config.borderColor,
      config.textColor
    )}>
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  )
}

// Progress steps for coach workflow
interface DiagnosisStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed'
}

export function DiagnosisProgress({ steps }: { steps: DiagnosisStep[] }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            step.status === 'completed' && 'bg-theme-success-dim text-theme-success border border-theme-success/20',
            step.status === 'active' && 'bg-theme-accent-dim text-theme-accent border border-theme-accent/30 shadow-glow-sm',
            step.status === 'pending' && 'bg-theme-bg-elevated text-theme-text-muted border border-theme-border'
          )}>
            {step.status === 'completed' ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : step.status === 'active' ? (
              <motion.span 
                className="w-1.5 h-1.5 rounded-full bg-current"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
            )}
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-8 h-px mx-1',
              step.status === 'completed' ? 'bg-theme-success/50' : 'bg-theme-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
