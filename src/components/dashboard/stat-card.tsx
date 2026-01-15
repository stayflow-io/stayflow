"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  previousValue?: number
  currentValue?: number
  format?: "number" | "currency" | "percent"
  invertColors?: boolean // true = menor e melhor (ex: tarefas atrasadas)
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  previousValue,
  currentValue,
  format = "number",
  invertColors = false,
}: StatCardProps) {
  // Calcular variacao percentual
  let variation: number | null = null
  let variationText = ""
  let trend: "up" | "down" | "neutral" = "neutral"

  if (previousValue !== undefined && currentValue !== undefined) {
    if (previousValue === 0) {
      variation = currentValue > 0 ? 100 : 0
    } else {
      variation = ((currentValue - previousValue) / previousValue) * 100
    }

    if (Math.abs(variation) < 0.5) {
      trend = "neutral"
      variationText = "Sem variacao"
    } else if (variation > 0) {
      trend = "up"
      variationText = `+${variation.toFixed(1)}%`
    } else {
      trend = "down"
      variationText = `${variation.toFixed(1)}%`
    }
  }

  // Determinar cor baseado na tendencia
  const isPositive = invertColors ? trend === "down" : trend === "up"
  const isNegative = invertColors ? trend === "up" : trend === "down"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {variation !== null && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositive && "text-green-600 dark:text-green-400",
                isNegative && "text-red-600 dark:text-red-400",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              {trend === "neutral" && <Minus className="h-3 w-3" />}
              <span>{variationText}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
