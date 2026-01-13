"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { getReservationsReportData, getFinancialReportData } from "@/actions/reports"
import { generateReservationsReport, generateFinancialTransactionsReport } from "@/lib/pdf"

interface Props {
  reportType: "reservations" | "financial"
  description: string
}

export function ReportExportForm({ reportType, description }: Props) {
  const [format, setFormat] = useState("xlsx")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleExport() {
    setIsLoading(true)

    try {
      // Handle PDF export client-side
      if (format === "pdf") {
        const periodStart = startDate ? new Date(startDate) : undefined
        const periodEnd = endDate ? new Date(endDate) : undefined

        if (reportType === "reservations") {
          const data = await getReservationsReportData(periodStart, periodEnd)
          if (data) {
            const doc = generateReservationsReport(data)
            doc.save(`reservas_${new Date().toISOString().split("T")[0]}.pdf`)
          }
        } else if (reportType === "financial") {
          const data = await getFinancialReportData(periodStart, periodEnd)
          if (data) {
            const doc = generateFinancialTransactionsReport(data)
            doc.save(`financeiro_${new Date().toISOString().split("T")[0]}.pdf`)
          }
        }
        return
      }

      // Handle Excel/CSV export via API
      const params = new URLSearchParams()
      params.set("format", format)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)

      const response = await fetch(`/api/export/${reportType}?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Erro ao exportar")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}_${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao exportar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${reportType}-start`}>Data Inicial</Label>
          <Input
            id={`${reportType}-start`}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${reportType}-end`}>Data Final</Label>
          <Input
            id={`${reportType}-end`}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Formato</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
            <SelectItem value="csv">CSV (.csv)</SelectItem>
            <SelectItem value="pdf">PDF (.pdf)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleExport} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatorio
          </>
        )}
      </Button>
    </div>
  )
}
