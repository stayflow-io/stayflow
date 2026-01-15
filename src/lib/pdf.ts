import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

interface ReportOptions {
  tenantName?: string
  tenantLogo?: string | null
}

// Helper para adicionar header com logo nos PDFs
async function addReportHeader(
  doc: jsPDF,
  title: string,
  options?: ReportOptions
): Promise<number> {
  let yPosition = 14
  const pageWidth = doc.internal.pageSize.getWidth()

  // Se tiver logo, adiciona ela
  if (options?.tenantLogo) {
    try {
      // Baixa a imagem e converte para base64
      const response = await fetch(options.tenantLogo)
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)

      // Adiciona a logo (max 40x15mm para manter proporcao)
      doc.addImage(base64, "PNG", 14, yPosition, 40, 15)
      yPosition = 32
    } catch (error) {
      // Se falhar, usa texto
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text(options?.tenantName || "StayFlow", 14, 20)
      yPosition = 28
    }
  } else {
    // Sem logo, usa o nome do tenant ou StayFlow
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text(options?.tenantName || "StayFlow", 14, 20)
    yPosition = 28
  }

  // Titulo do relatorio
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, yPosition)

  return yPosition + 10
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

interface FinancialReportData {
  ownerName: string
  periodStart: Date
  periodEnd: Date
  properties: {
    name: string
    units: {
      name: string
      reservations: {
        guestName: string
        checkinDate: Date
        checkoutDate: Date
        totalAmount: number
        channelFee: number
        cleaningFee: number
        netAmount: number
      }[]
      expenses: {
        description: string
        date: Date
        amount: number
      }[]
      totalRevenue: number
      totalExpenses: number
    }[]
    totalRevenue: number
    totalExpenses: number
  }[]
  grossAmount: number
  totalExpenses: number
  adminFee: number
  adminFeePercent: number
  netAmount: number
}

export async function generateOwnerReport(
  data: FinancialReportData,
  options?: ReportOptions
): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header com logo
  let yPosition = await addReportHeader(doc, "Relatorio Financeiro", options)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Proprietario: ${data.ownerName}`, 14, yPosition)
  yPosition += 6
  doc.text(
    `Periodo: ${format(data.periodStart, "dd/MM/yyyy")} a ${format(data.periodEnd, "dd/MM/yyyy")}`,
    14,
    yPosition
  )
  yPosition += 6
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, yPosition)
  yPosition += 10

  // Properties and their units
  for (const property of data.properties) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(property.name, 14, yPosition)
    yPosition += 8

    // Units
    for (const unit of property.units) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(`  ${unit.name}`, 14, yPosition)
      yPosition += 6

      // Reservations table
      if (unit.reservations.length > 0) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text("  Reservas:", 14, yPosition)
        yPosition += 4

        autoTable(doc, {
          startY: yPosition,
          head: [["Hospede", "Check-in", "Check-out", "Total", "Taxas", "Liquido"]],
          body: unit.reservations.map((r) => [
            r.guestName,
            format(r.checkinDate, "dd/MM"),
            format(r.checkoutDate, "dd/MM"),
            formatCurrency(r.totalAmount),
            formatCurrency(r.channelFee + r.cleaningFee),
            formatCurrency(r.netAmount),
          ]),
          theme: "striped",
          headStyles: { fillColor: [51, 51, 51] },
          styles: { fontSize: 8 },
          margin: { left: 20, right: 14 },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 6
      }

      // Expenses table
      if (unit.expenses.length > 0) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(10)
        doc.text("  Despesas:", 14, yPosition)
        yPosition += 4

        autoTable(doc, {
          startY: yPosition,
          head: [["Descricao", "Data", "Valor"]],
          body: unit.expenses.map((e) => [
            e.description,
            format(e.date, "dd/MM/yyyy"),
            formatCurrency(e.amount),
          ]),
          theme: "striped",
          headStyles: { fillColor: [51, 51, 51] },
          styles: { fontSize: 8 },
          margin: { left: 20, right: 14 },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 6
      }

      // Unit subtotals
      doc.setFontSize(8)
      doc.text(`  Receita: ${formatCurrency(unit.totalRevenue)}`, 20, yPosition)
      doc.text(
        `Despesas: ${formatCurrency(unit.totalExpenses)}`,
        90,
        yPosition
      )
      yPosition += 8
    }

    // Property subtotals
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`Subtotal ${property.name}: Receita: ${formatCurrency(property.totalRevenue)} | Despesas: ${formatCurrency(property.totalExpenses)}`, 14, yPosition)
    yPosition += 12
  }

  // Summary
  if (yPosition > 220) {
    doc.addPage()
    yPosition = 20
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(14, yPosition, pageWidth - 14, yPosition)
  yPosition += 10

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo do Periodo", 14, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const summaryData = [
    ["Receita Bruta", formatCurrency(data.grossAmount)],
    ["Despesas", formatCurrency(data.totalExpenses)],
    [`Taxa Administrativa (${data.adminFeePercent}%)`, formatCurrency(data.adminFee)],
  ]

  autoTable(doc, {
    startY: yPosition,
    body: summaryData,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 4

  doc.setDrawColor(51, 51, 51)
  doc.line(14, yPosition, pageWidth - 14, yPosition)
  yPosition += 8

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Valor Liquido a Receber:", 14, yPosition)
  doc.text(formatCurrency(data.netAmount), pageWidth - 14, yPosition, {
    align: "right",
  })

  return doc
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

interface ReservationsReportData {
  periodStart: Date
  periodEnd: Date
  reservations: {
    property: string
    guestName: string
    checkinDate: Date
    checkoutDate: Date
    nights: number
    totalAmount: number
    status: string
  }[]
  totals: {
    reservations: number
    nights: number
    revenue: number
  }
}

export async function generateReservationsReport(
  data: ReservationsReportData,
  options?: ReportOptions
): Promise<jsPDF> {
  const doc = new jsPDF("landscape")

  // Header com logo
  let yPosition = await addReportHeader(doc, "Relatorio de Reservas", options)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Periodo: ${format(data.periodStart, "dd/MM/yyyy")} a ${format(data.periodEnd, "dd/MM/yyyy")}`,
    14,
    yPosition
  )
  yPosition += 6
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, yPosition)
  yPosition += 10

  // Table
  autoTable(doc, {
    startY: yPosition,
    head: [["Imovel", "Hospede", "Check-in", "Check-out", "Noites", "Valor", "Status"]],
    body: data.reservations.map((r) => [
      r.property,
      r.guestName,
      format(r.checkinDate, "dd/MM/yyyy"),
      format(r.checkoutDate, "dd/MM/yyyy"),
      r.nights.toString(),
      formatCurrency(r.totalAmount),
      r.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: [51, 51, 51] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Totals
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`Total de Reservas: ${data.totals.reservations}`, 14, finalY)
  doc.text(`Total de Noites: ${data.totals.nights}`, 100, finalY)
  doc.text(`Receita Total: ${formatCurrency(data.totals.revenue)}`, 180, finalY)

  return doc
}

interface FinancialTransactionsReportData {
  periodStart: Date
  periodEnd: Date
  transactions: {
    date: Date
    type: string
    category: string
    property: string
    description: string
    amount: number
  }[]
  totals: {
    income: number
    expenses: number
    balance: number
  }
}

export async function generateFinancialTransactionsReport(
  data: FinancialTransactionsReportData,
  options?: ReportOptions
): Promise<jsPDF> {
  const doc = new jsPDF("landscape")

  // Header com logo
  let yPosition = await addReportHeader(doc, "Relatorio Financeiro", options)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Periodo: ${format(data.periodStart, "dd/MM/yyyy")} a ${format(data.periodEnd, "dd/MM/yyyy")}`,
    14,
    yPosition
  )
  yPosition += 6
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, yPosition)
  yPosition += 10

  // Table
  autoTable(doc, {
    startY: yPosition,
    head: [["Data", "Tipo", "Categoria", "Imovel", "Descricao", "Valor"]],
    body: data.transactions.map((t) => [
      format(t.date, "dd/MM/yyyy"),
      t.type === "INCOME" ? "Receita" : "Despesa",
      t.category,
      t.property,
      t.description || "-",
      formatCurrency(t.amount),
    ]),
    theme: "striped",
    headStyles: { fillColor: [51, 51, 51] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Totals
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`Receitas: ${formatCurrency(data.totals.income)}`, 14, finalY)
  doc.text(`Despesas: ${formatCurrency(data.totals.expenses)}`, 100, finalY)
  doc.text(`Saldo: ${formatCurrency(data.totals.balance)}`, 180, finalY)

  return doc
}
