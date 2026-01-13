import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Bed, Bath, Users } from "lucide-react"

async function getOwnerProperties(userId: string) {
  const owner = await prisma.owner.findFirst({
    where: { userId },
    include: {
      properties: {
        where: { deletedAt: null },
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
        orderBy: { name: "asc" },
      },
    },
  })

  return owner?.properties || []
}

export default async function OwnerPropertiesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/login")
  }

  const properties = await getOwnerProperties(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meus Imoveis</h1>
        <p className="text-muted-foreground">
          Visualize os imoveis que voce possui cadastrados
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum imovel encontrado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const isOccupied = property.reservations.length > 0
            return (
              <Card key={property.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <Badge variant={isOccupied ? "default" : "outline"}>
                      {isOccupied ? "Ocupado" : "Disponivel"}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {property.city}, {property.state}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center" title="Quartos">
                      <Bed className="h-4 w-4 mr-1" />
                      {property.bedrooms}
                    </div>
                    <div className="flex items-center" title="Banheiros">
                      <Bath className="h-4 w-4 mr-1" />
                      {property.bathrooms}
                    </div>
                    <div className="flex items-center" title="Hospedes">
                      <Users className="h-4 w-4 mr-1" />
                      {property.maxGuests}
                    </div>
                  </div>
                  <div className="pt-3 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de reservas:</span>
                      <span className="font-medium">{property._count.reservations}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Taxa administrativa:</span>
                      <span className="font-medium">{Number(property.adminFeePercent)}%</span>
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
