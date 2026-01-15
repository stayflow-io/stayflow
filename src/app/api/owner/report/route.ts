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
      // Direct units
      units: {
        where: { deletedAt: null },
        include: {
          property: true,
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
      // Properties owned (units inherit ownership)
      properties: {
        where: { deletedAt: null },
        include: {
          units: {
            where: {
              deletedAt: null,
              ownerId: null, // Only units that inherit from property
            },
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
      },
    },
  })

  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 })
  }

  let grossAmount = 0
  let totalExpenses = 0

  // Combine direct units and inherited units
  const directUnits = owner.units.map((u) => ({
    ...u,
    propertyName: u.property.name,
  }))

  const inheritedUnits = owner.properties.flatMap((p) =>
    p.units.map((u) => ({
      ...u,
      propertyName: p.name,
    }))
  )

  const allUnits = [...directUnits, ...inheritedUnits]

  const units = allUnits.map((unit) => {
    const unitRevenue = unit.reservations.reduce(
      (sum, r) => sum + Number(r.netAmount),
      0
    )
    const unitExpenses = unit.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

    grossAmount += unitRevenue
    totalExpenses += unitExpenses

    return {
      name: `${unit.propertyName} - ${unit.name}`,
      reservations: unit.reservations.map((r) => ({
        guestName: r.guestName,
        checkinDate: r.checkinDate,
        checkoutDate: r.checkoutDate,
        totalAmount: Number(r.totalAmount),
        channelFee: Number(r.channelFee),
        cleaningFee: Number(r.cleaningFee),
        netAmount: Number(r.netAmount),
      })),
      expenses: unit.transactions.map((t) => ({
        description: t.description || t.category,
        date: t.date,
        amount: Number(t.amount),
      })),
      totalRevenue: unitRevenue,
      totalExpenses: unitExpenses,
    }
  })

  const adminFeePercent = Number(owner.commissionPercent)
  const adminFee = (grossAmount - totalExpenses) * (adminFeePercent / 100)
  const netAmount = grossAmount - totalExpenses - adminFee

  return NextResponse.json({
    ownerName: owner.name,
    periodStart: start,
    periodEnd: end,
    units,
    grossAmount,
    totalExpenses,
    adminFee,
    adminFeePercent,
    netAmount,
  })
}
