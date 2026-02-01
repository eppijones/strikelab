import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface TrendChartProps {
  data: Array<Record<string, any>>
  lines: Array<{
    dataKey: string
    name: string
    color: string
  }>
  height?: number
  showArea?: boolean
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-theme-bg-elevated/95 backdrop-blur-xl border border-theme-border rounded-xl p-3 shadow-neural">
      <p className="text-xs text-theme-text-muted mb-2 font-medium">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-theme-text-secondary">{entry.name}:</span>
          <span 
            className="text-xs font-mono font-bold"
            style={{ color: entry.color }}
          >
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ 
  data, 
  lines, 
  height = 300,
  showArea = false 
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-theme-bg-surface/30 rounded-xl border border-theme-border"
        style={{ height }}
      >
        <p className="text-sm text-theme-text-muted">No data available</p>
      </div>
    )
  }

  const Chart = showArea ? AreaChart : LineChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          {lines.map((line) => (
            <linearGradient 
              key={`gradient-${line.dataKey}`} 
              id={`gradient-${line.dataKey}`} 
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={line.color} stopOpacity={0} />
            </linearGradient>
          ))}
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(0, 212, 255, 0.05)" 
          vertical={false}
        />
        
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#606070', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
          tickLine={false}
        />
        
        <YAxis 
          tick={{ fill: '#606070', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        
        <Tooltip content={<CustomTooltip />} />

        {lines.map((line) => (
          showArea ? (
            <Area
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              fill={`url(#gradient-${line.dataKey})`}
              filter="url(#glow)"
              dot={false}
              activeDot={{
                r: 5,
                fill: line.color,
                stroke: '#06060a',
                strokeWidth: 2,
              }}
            />
          ) : (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              filter="url(#glow)"
              dot={false}
              activeDot={{
                r: 5,
                fill: line.color,
                stroke: '#06060a',
                strokeWidth: 2,
              }}
            />
          )
        ))}
      </Chart>
    </ResponsiveContainer>
  )
}
