import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { periodStart, periodEnd } = await request.json()
  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  const owner = await prisma.owner.findFirst({
    where: { userId: session.user.id },
    include: {
      properties: {
        include: {
          reservations: {
            where: {
              checkoutDate: {
                gte: start,
                lte: end,
              },
              status: {
                in: ["CHECKED_OUT", "CONFIRMED"],
              },
            },
            orderBy: {
              checkinDate: "asc",
            },
          },
          transactions: {
            where: {
              type: "EXPENSE",
              date: {
                gte: start,
                lte: end,
              },
            },
            orderBy: {
              date: "asc",
            },
          },
        },
      },
    },
  })

  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 })
  }

  let grossAmount = 0
  let totalExpenses = 0

  const properties = owner.properties.map((property) => {
    const propertyRevenue = property.reservations.reduce(
      (sum, r) => sum + Number(r.netAmount),
      0
    )
    const propertyExpenses = property.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

    grossAmount += propertyRevenue
    totalExpenses += propertyExpenses

    return {
      name: property.name,
      reservations: property.reservations.map((r) => ({
        guestName: r.guestName,
        checkinDate: r.checkinDate,
        checkoutDate: r.checkoutDate,
        totalAmount: Number(r.totalAmount),
        channelFee: Number(r.channelFee),
        cleaningFee: Number(r.cleaningFee),
        netAmount: Number(r.netAmount),
      })),
      expenses: property.transactions.map((t) => ({
        description: t.description || t.category,
        date: t.date,
        amount: Number(t.amount),
      })),
      totalRevenue: propertyRevenue,
      totalExpenses: propertyExpenses,
    }
  })

  const adminFeePercent = Number(owner.commissionPercent)
  const adminFee = (grossAmount - totalExpenses) * (adminFeePercent / 100)
  const netAmount = grossAmount - totalExpenses - adminFee

  return NextResponse.json({
    ownerName: owner.name,
    periodStart: start,
    periodEnd: end,
    properties,
    grossAmount,
    totalExpenses,
    adminFee,
    adminFeePercent,
    netAmount,
  })
}
