import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  name: string
  [key: string]: string | number
}

interface TrendChartProps {
  data: DataPoint[]
  lines: Array<{
    dataKey: string
    name: string
    color?: string
  }>
  height?: number
  className?: string
}

export function TrendChart({
  data,
  lines,
  height = 300,
  className,
}: TrendChartProps) {
  const defaultColors = ['#23D5FF', '#22c55e', '#eab308', '#ef4444', '#a855f7']

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />
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
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: '#8A8A99', fontSize: '12px' }}>{value}</span>
            )}
          />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ fill: line.color || defaultColors[index % defaultColors.length], r: 4 }}
              activeDot={{ r: 6, stroke: '#0A0A0F', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
