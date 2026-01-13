import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    Hospede: r.guestName,
    Email: r.guestEmail || "",
    Telefone: r.guestPhone || "",
    Imovel: r.property.name,
    Checkin: format(new Date(r.checkinDate), "dd/MM/yyyy", { locale: ptBR }),
    Checkout: format(new Date(r.checkoutDate), "dd/MM/yyyy", { locale: ptBR }),
    Hospedes: r.numGuests,
    Status: statusMap[r.status] || r.status,
    Canal: r.channel?.name || "Direto",
    ValorTotal: Number(r.totalAmount),
    TaxaLimpeza: Number(r.cleaningFee),
    TaxaCanal: Number(r.channelFee),
    ValorLiquido: Number(r.netAmount),
  }))

  if (exportFormat === "csv") {
    const headers = [
      "Hospede", "Email", "Telefone", "Imovel", "Check-in", "Check-out",
      "Hospedes", "Status", "Canal", "Valor Total", "Taxa Limpeza", "Taxa Canal", "Valor Liquido"
    ]
    const csvRows = [
      headers.join(";"),
      ...data.map((row) => [
        row.Hospede, row.Email, row.Telefone, row.Imovel, row.Checkin, row.Checkout,
        row.Hospedes, row.Status, row.Canal, row.ValorTotal, row.TaxaLimpeza, row.TaxaCanal, row.ValorLiquido
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
    ]
    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservas_${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    })
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Reservas")

  // Add headers
  worksheet.columns = [
    { header: "Hospede", key: "Hospede", width: 25 },
    { header: "Email", key: "Email", width: 30 },
    { header: "Telefone", key: "Telefone", width: 15 },
    { header: "Imovel", key: "Imovel", width: 25 },
    { header: "Check-in", key: "Checkin", width: 12 },
    { header: "Check-out", key: "Checkout", width: 12 },
    { header: "Hospedes", key: "Hospedes", width: 10 },
    { header: "Status", key: "Status", width: 12 },
    { header: "Canal", key: "Canal", width: 15 },
    { header: "Valor Total", key: "ValorTotal", width: 12 },
    { header: "Taxa Limpeza", key: "TaxaLimpeza", width: 12 },
    { header: "Taxa Canal", key: "TaxaCanal", width: 12 },
    { header: "Valor Liquido", key: "ValorLiquido", width: 12 },
  ]

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(row)
  })

  // Style header row
  worksheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reservas_${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  })
}
