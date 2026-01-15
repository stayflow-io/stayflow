import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Home } from "lucide-react"
import Link from "next/link"

async function getOwnerUnits(userId: string) {
  const owner = await prisma.owner.findFirst({
    where: { userId },
    include: {
      // Units directly owned
      units: {
        where: { deletedAt: null },
        include: {
          property: true,
          _count: {
            select: { reservations: true },
          },
          reservations: {
            where: {
              status: "CHECKED_IN",
            },
          },
        },
        orderBy: { name: "asc" },
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
              _count: {
                select: { reservations: true },
              },
              reservations: {
                where: {
                  status: "CHECKED_IN",
                },
              },
            },
          },
        },
      },
    },
  })

  if (!owner) return []

  // Combine direct units and inherited units
  const directUnits = owner.units.map((u) => ({
    ...u,
    propertyName: u.property.name,
    propertyCity: u.property.city,
    propertyState: u.property.state,
  }))

  const inheritedUnits = owner.properties.flatMap((p) =>
    p.units.map((u) => ({
      ...u,
      property: p,
      propertyName: p.name,
      propertyCity: p.city,
      propertyState: p.state,
    }))
  )

  return [...directUnits, ...inheritedUnits].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export default async function OwnerPropertiesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/login")
  }

  const units = await getOwnerUnits(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Unidades</h1>
        <p className="text-muted-foreground">
          Visualize as unidades que voce possui cadastradas
        </p>
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma unidade encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => {
            const isOccupied = unit.reservations.length > 0
            return (
              <Card key={unit.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    <Badge variant={isOccupied ? "default" : "outline"}>
                      {isOccupied ? "Ocupado" : "Disponivel"}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3 mr-1" />
                    {unit.propertyName}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {unit.propertyCity}, {unit.propertyState}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center" title="Quartos">
                      <Home className="h-4 w-4 mr-1" />
                      {unit.bedrooms} quartos
                    </div>
                    <div className="flex items-center" title="Hospedes">
                      Max {unit.maxGuests} hospedes
                    </div>
                  </div>
                  <div className="pt-3 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de reservas:</span>
                      <span className="font-medium">{unit._count.reservations}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Taxa administrativa:</span>
                      <span className="font-medium">{Number(unit.adminFeePercent)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
