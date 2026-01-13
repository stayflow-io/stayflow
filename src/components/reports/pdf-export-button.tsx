"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { generateOwnerReport, generateReservationsReport } from "@/lib/pdf"
import { getOwnerReportData, getReservationsReportData } from "@/actions/reports"
import type { OwnerReportData, ReservationsReportData } from "@/actions/reports"

interface OwnerReportButtonProps {
  type: "owner"
  ownerId: string
  ownerName: string
  periodStart?: Date
  periodEnd?: Date
}

interface ReservationsReportButtonProps {
  type: "reservations"
  periodStart?: Date
  periodEnd?: Date
}

type PDFExportButtonProps = OwnerReportButtonProps | ReservationsReportButtonProps

export function PDFExportButton(props: PDFExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleExport() {
    setIsLoading(true)
    try {
      if (props.type === "owner") {
        const data = await getOwnerReportData(
          props.ownerId,
          props.periodStart,
          props.periodEnd
        )
        if (data) {
          const doc = generateOwnerReport(data)
          doc.save(`relatorio-${props.ownerName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
        }
      } else {
        const data = await getReservationsReportData(
          props.periodStart,
          props.periodEnd
        )
        if (data) {
          const doc = generateReservationsReport(data)
          doc.save("relatorio-reservas.pdf")
        }
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Exportar PDF
    </Button>
  )
}
