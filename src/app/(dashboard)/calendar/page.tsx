import { getAllProperties } from "@/actions/properties"
import { getOwners } from "@/actions/owners"
import { CalendarWrapper } from "./calendar-wrapper"

export default async function CalendarPage() {
  const [properties, owners] = await Promise.all([
    getAllProperties(),
    getOwners(),
  ])

  // Enriquecer properties com owner info
  const propertiesWithOwner = properties.map(p => ({
    ...p,
    ownerId: p.ownerId,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendario</h1>
        <p className="text-muted-foreground">
          Visualize reservas e disponibilidade
        </p>
      </div>

      <CalendarWrapper properties={propertiesWithOwner} owners={owners} />
    </div>
  )
}
