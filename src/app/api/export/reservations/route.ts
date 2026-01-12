import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const exportFormat = searchParams.get("format") || "xlsx"
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: any = {
    tenantId: session.user.tenantId,
  }

  if (startDate) {
    where.checkinDate = { gte: new Date(startDate) }
  }
  if (endDate) {
    where.checkoutDate = { ...where.checkoutDate, lte: new Date(endDate) }
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      property: true,
      channel: true,
    },
    orderBy: { checkinDate: "desc" },
  })

  const statusMap: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmada",
    CHECKED_IN: "Check-in",
    CHECKED_OUT: "Check-out",
    CANCELLED: "Cancelada",
    NO_SHOW: "No-show",
  }

  const data = reservations.map((r) => ({
    "Hospede": r.guestName,
    "Email": r.guestEmail || "",
    "Telefone": r.guestPhone || "",
    "Imovel": r.property.name,
    "Check-in": format(new Date(r.checkinDate), "dd/MM/yyyy", { locale: ptBR }),
    "Check-out": format(new Date(r.checkoutDate), "dd/MM/yyyy", { locale: ptBR }),
    "Hospedes": r.numGuests,
    "Status": statusMap[r.status] || r.status,
    "Canal": r.channel?.name || "Direto",
    "Valor Total": Number(r.totalAmount),
    "Taxa Limpeza": Number(r.cleaningFee),
    "Taxa Canal": Number(r.channelFee),
    "Valor Liquido": Number(r.netAmount),
  }))

  if (exportFormat === "csv") {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" })

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservas_${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    })
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Set column widths
  ws["!cols"] = [
    { wch: 25 }, // Hospede
    { wch: 30 }, // Email
    { wch: 15 }, // Telefone
    { wch: 25 }, // Imovel
    { wch: 12 }, // Check-in
    { wch: 12 }, // Check-out
    { wch: 10 }, // Hospedes
    { wch: 12 }, // Status
    { wch: 15 }, // Canal
    { wch: 12 }, // Valor Total
    { wch: 12 }, // Taxa Limpeza
    { wch: 12 }, // Taxa Canal
    { wch: 12 }, // Valor Liquido
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Reservas")
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reservas_${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  })
}
