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
    where.date = { gte: new Date(startDate) }
  }
  if (endDate) {
    where.date = { ...where.date, lte: new Date(endDate) }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      property: true,
    },
    orderBy: { date: "desc" },
  })

  const typeMap: Record<string, string> = {
    INCOME: "Receita",
    EXPENSE: "Despesa",
  }

  const data = transactions.map((t) => ({
    "Data": format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR }),
    "Tipo": typeMap[t.type] || t.type,
    "Categoria": t.category,
    "Descricao": t.description || "",
    "Imovel": t.property.name,
    "Valor": t.type === "INCOME" ? Number(t.amount) : -Number(t.amount),
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
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" })

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financeiro_${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    })
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Add summary at the end
  const summaryData = [
    {},
    { "Data": "RESUMO", "Tipo": "", "Categoria": "", "Descricao": "", "Imovel": "", "Valor": "" },
    { "Data": "Total Receitas", "Tipo": "", "Categoria": "", "Descricao": "", "Imovel": "", "Valor": totals.income },
    { "Data": "Total Despesas", "Tipo": "", "Categoria": "", "Descricao": "", "Imovel": "", "Valor": -totals.expenses },
    { "Data": "Lucro Liquido", "Tipo": "", "Categoria": "", "Descricao": "", "Imovel": "", "Valor": totals.income - totals.expenses },
  ]

  // Set column widths
  ws["!cols"] = [
    { wch: 12 }, // Data
    { wch: 10 }, // Tipo
    { wch: 20 }, // Categoria
    { wch: 30 }, // Descricao
    { wch: 25 }, // Imovel
    { wch: 15 }, // Valor
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Financeiro")
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="financeiro_${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  })
}
