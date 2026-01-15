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
    where.date = { gte: new Date(startDate) }
  }
  if (endDate) {
    where.date = { ...where.date, lte: new Date(endDate) }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      unit: {
        include: {
          property: true,
        },
      },
    },
    orderBy: { date: "desc" },
  })

  const typeMap: Record<string, string> = {
    INCOME: "Receita",
    EXPENSE: "Despesa",
  }

  const data = transactions.map((t) => ({
    Data: format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR }),
    Tipo: typeMap[t.type] || t.type,
    Categoria: t.category,
    Descricao: t.description || "",
    Imovel: `${t.unit.property.name} - ${t.unit.name}`,
    Valor: t.type === "INCOME" ? Number(t.amount) : -Number(t.amount),
  }))

  // Calculate totals
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "INCOME") {
        acc.income += Number(t.amount)
      } else {
        acc.expenses += Number(t.amount)
      }
      return acc
    },
    { income: 0, expenses: 0 }
  )

  if (exportFormat === "csv") {
    const headers = ["Data", "Tipo", "Categoria", "Descricao", "Imovel", "Valor"]
    const csvRows = [
      headers.join(";"),
      ...data.map((row) =>
        headers.map((h) => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`).join(";")
      ),
    ]
    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financeiro_${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    })
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Financeiro")

  // Add headers
  worksheet.columns = [
    { header: "Data", key: "Data", width: 12 },
    { header: "Tipo", key: "Tipo", width: 10 },
    { header: "Categoria", key: "Categoria", width: 20 },
    { header: "Descricao", key: "Descricao", width: 30 },
    { header: "Imovel", key: "Imovel", width: 25 },
    { header: "Valor", key: "Valor", width: 15 },
  ]

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(row)
  })

  // Add summary
  worksheet.addRow({})
  worksheet.addRow({ Data: "RESUMO" })
  worksheet.addRow({ Data: "Total Receitas", Valor: totals.income })
  worksheet.addRow({ Data: "Total Despesas", Valor: -totals.expenses })
  worksheet.addRow({ Data: "Lucro Liquido", Valor: totals.income - totals.expenses })

  // Style header row
  worksheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="financeiro_${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  })
}
