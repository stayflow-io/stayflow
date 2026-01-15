"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface RevenueData {
  month: string
  revenue: number
  revenueLastYear?: number
}

interface Props {
  data: RevenueData[]
  showComparison?: boolean
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
  }).format(value)
}

export function RevenueChart({ data, showComparison = true }: Props) {
  const hasLastYearData = showComparison && data.some(d => (d.revenueLastYear ?? 0) > 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorRevenueLastYear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={formatCurrency}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === "revenue" ? "Este ano" : "Ano anterior"
          ]}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        {hasLastYearData && (
          <Legend
            formatter={(value) => value === "revenue" ? "Este ano" : "Ano anterior"}
            wrapperStyle={{ fontSize: "12px" }}
          />
        )}
        {hasLastYearData && (
          <Area
            type="monotone"
            dataKey="revenueLastYear"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorRevenueLastYear)"
          />
        )}
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
