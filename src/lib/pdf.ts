import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FinancialReportData {
  ownerName: string
  periodStart: Date
  periodEnd: Date
  properties: {
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
  grossAmount: number
  totalExpenses: number
  adminFee: number
  adminFeePercent: number
  netAmount: number
}

export function generateOwnerReport(data: FinancialReportData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("StayFlow", 14, 20)

  doc.setFontSize(16)
  doc.text("Relatorio Financeiro", 14, 30)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Proprietario: ${data.ownerName}`, 14, 40)
  doc.text(
    `Periodo: ${format(data.periodStart, "dd/MM/yyyy")} a ${format(data.periodEnd, "dd/MM/yyyy")}`,
    14,
    46
  )
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 52)

  let yPosition = 62

  // Properties
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

    // Reservations table
    if (property.reservations.length > 0) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Reservas:", 14, yPosition)
      yPosition += 4

      autoTable(doc, {
        startY: yPosition,
        head: [["Hospede", "Check-in", "Check-out", "Total", "Taxas", "Liquido"]],
        body: property.reservations.map((r) => [
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
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 8
    }

    // Expenses table
    if (property.expenses.length > 0) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(10)
      doc.text("Despesas:", 14, yPosition)
      yPosition += 4

      autoTable(doc, {
        startY: yPosition,
        head: [["Descricao", "Data", "Valor"]],
        body: property.expenses.map((e) => [
          e.description,
          format(e.date, "dd/MM/yyyy"),
          formatCurrency(e.amount),
        ]),
        theme: "striped",
        headStyles: { fillColor: [51, 51, 51] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 8
    }

    // Property subtotals
    doc.setFontSize(9)
    doc.text(`Receita: ${formatCurrency(property.totalRevenue)}`, 14, yPosition)
    doc.text(
      `Despesas: ${formatCurrency(property.totalExpenses)}`,
      80,
      yPosition
    )
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

export function generateReservationsReport(data: ReservationsReportData): jsPDF {
  const doc = new jsPDF("landscape")

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("StayFlow", 14, 20)

  doc.setFontSize(16)
  doc.text("Relatorio de Reservas", 14, 30)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Periodo: ${format(data.periodStart, "dd/MM/yyyy")} a ${format(data.periodEnd, "dd/MM/yyyy")}`,
    14,
    40
  )
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 46)

  // Table
  autoTable(doc, {
    startY: 56,
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

export function generateFinancialTransactionsReport(data: FinancialTransactionsReportData): jsPDF {
  const doc = new jsPDF("landscape")

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("StayFlow", 14, 20)

  doc.setFontSize(16)
  doc.text("Relatorio Financeiro", 14, 30)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Periodo: ${format(data.periodStart, "dd/MM/yyyy")} a ${format(data.periodEnd, "dd/MM/yyyy")}`,
    14,
    40
  )
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 46)

  // Table
  autoTable(doc, {
    startY: 56,
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
