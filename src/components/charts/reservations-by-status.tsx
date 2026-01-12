"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

interface StatusData {
  name: string
  value: number
  color: string
}

interface Props {
  data: StatusData[]
}

export function ReservationsByStatusChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          formatter={(value: number) => [value, "Reservas"]}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
