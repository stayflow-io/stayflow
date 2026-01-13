"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileDown, Loader2 } from "lucide-react"
import { getOwnerReportData } from "@/actions/reports"
import { generateOwnerReport } from "@/lib/pdf"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"

export default function OwnerReportsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("last-month")

  async function handleGenerateReport() {
    setIsLoading(true)
    try {
      let periodStart: Date
      let periodEnd: Date

      const now = new Date()

      switch (selectedPeriod) {
        case "current-month":
          periodStart = startOfMonth(now)
          periodEnd = endOfMonth(now)
          break
        case "last-month":
          periodStart = startOfMonth(subMonths(now, 1))
          periodEnd = endOfMonth(subMonths(now, 1))
          break
        case "last-3-months":
          periodStart = startOfMonth(subMonths(now, 3))
          periodEnd = endOfMonth(subMonths(now, 1))
          break
        default:
          periodStart = startOfMonth(subMonths(now, 1))
          periodEnd = endOfMonth(subMonths(now, 1))
      }

      // The owner ID will be fetched from the session in the server action
      const response = await fetch("/api/owner/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart, periodEnd }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          // Parse dates back from JSON
          data.periodStart = new Date(data.periodStart)
          data.periodEnd = new Date(data.periodEnd)
          data.properties = data.properties.map((p: any) => ({
            ...p,
            reservations: p.reservations.map((r: any) => ({
              ...r,
              checkinDate: new Date(r.checkinDate),
              checkoutDate: new Date(r.checkoutDate),
            })),
            expenses: p.expenses.map((e: any) => ({
              ...e,
              date: new Date(e.date),
            })),
          }))

          const doc = generateOwnerReport(data)
          doc.save(`relatorio-${format(data.periodStart, "yyyy-MM")}.pdf`)
        }
      }
    } catch (error) {
      console.error("Erro ao gerar relatorio:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatorios</h1>
        <p className="text-muted-foreground">
          Exporte relatorios financeiros dos seus imoveis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatorio Financeiro</CardTitle>
          <CardDescription>
            Gere um relatorio detalhado com reservas, despesas e valores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Periodo</Label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="current-month">Mes atual</option>
              <option value="last-month">Mes anterior</option>
              <option value="last-3-months">Ultimos 3 meses</option>
            </select>
          </div>

          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Gerar Relatorio PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
