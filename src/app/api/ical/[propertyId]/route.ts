import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

// Generate iCal feed for a property
export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    include: {
      reservations: {
        where: {
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkoutDate: { gte: new Date() },
        },
        orderBy: { checkinDate: "asc" },
      },
    },
  })

  if (!property) {
    return new NextResponse("Property not found", { status: 404 })
  }

  const icalEvents = property.reservations.map((reservation) => {
    const uid = `${reservation.id}@stayflow`
    const dtstart = format(reservation.checkinDate, "yyyyMMdd")
    const dtend = format(reservation.checkoutDate, "yyyyMMdd")
    const summary = `Reserva - ${reservation.guestName}`
    const description = `Hospede: ${reservation.guestName}\\nHospedes: ${reservation.numGuests}\\nStatus: ${reservation.status}`

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
