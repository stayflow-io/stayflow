import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

// Generate iCal feed for all units of a property
export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    include: {
      units: {
        where: { deletedAt: null },
        include: {
          reservations: {
            where: {
              status: { in: ["CONFIRMED", "CHECKED_IN"] },
              checkoutDate: { gte: new Date() },
            },
            orderBy: { checkinDate: "asc" },
          },
        },
      },
    },
  })

  if (!property) {
    return new NextResponse("Property not found", { status: 404 })
  }

  // Gather all reservations from all units
  const allReservations = property.units.flatMap((unit) =>
    unit.reservations.map((reservation) => ({
      ...reservation,
      unitName: unit.name,
    }))
  )

  const icalEvents = allReservations.map((reservation) => {
    const uid = `${reservation.id}@stayflow`
    const dtstart = format(reservation.checkinDate, "yyyyMMdd")
    const dtend = format(reservation.checkoutDate, "yyyyMMdd")
    const summary = `Reserva - ${reservation.guestName} (${reservation.unitName})`
    const description = `Hospede: ${reservation.guestName}\\nUnidade: ${reservation.unitName}\\nHospedes: ${reservation.numGuests}\\nStatus: ${reservation.status}`

    return `BEGIN:VEVENT
UID:${uid}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT`
  })

  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StayFlow//Property Calendar//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${property.name} - Reservas
X-WR-TIMEZONE:America/Sao_Paulo
${icalEvents.join("\n")}
END:VCALENDAR`

  return new NextResponse(icalContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${property.name.replace(/[^a-zA-Z0-9]/g, "_")}_calendar.ics"`,
    },
  })
}
