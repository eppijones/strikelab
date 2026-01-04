import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  name: string
  value: number
  color?: string
}

interface BarChartProps {
  data: DataPoint[]
  height?: number
  className?: string
  showGrid?: boolean
  barColor?: string
}

export function BarChart({
  data,
  height = 200,
  className,
  showGrid = false,
  barColor = '#23D5FF',
}: BarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="name"
            tick={{ fill: '#8A8A99', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8A8A99', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A22',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            labelStyle={{ color: '#F4F4F6', fontWeight: 500 }}
            itemStyle={{ color: '#8A8A99' }}
            cursor={{ fill: 'rgba(35, 213, 255, 0.1)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || barColor}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
