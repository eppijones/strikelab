import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { StrikeLabIcon } from './NeuralIcon'

interface AIOrbProps {
  onClick?: () => void
  className?: string
  active?: boolean
}

export function AIOrb({ onClick, className, active = false }: AIOrbProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-14 h-14 flex items-center justify-center rounded-full',
        'bg-white/60 dark:bg-nordic-forest/40',
        'backdrop-blur-[16px] -webkit-backdrop-blur-[16px]',
        'border border-white/80 dark:border-white/20',
        'shadow-[0_8px_32px_rgba(142,184,151,0.2)]',
        'group overflow-hidden',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Inner Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-nordic-sage/10 rounded-full"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <StrikeLabIcon 
        className={cn(
          'w-7 h-7 transition-colors duration-500',
          active ? 'text-nordic-forest' : 'text-nordic-sage'
        )} 
      />
      
      {/* Pulse Rings */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute inset-0 border border-nordic-sage/30 rounded-full"
          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>
    </motion.button>
  )
}
