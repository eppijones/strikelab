import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: StatsCardProps) {
  return (
    <Card variant="hover" className={cn('p-5', className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="text-2xl font-display font-bold text-ice-white mt-1">
            {value}
          </p>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-button bg-cyan/10 flex items-center justify-center text-cyan">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
