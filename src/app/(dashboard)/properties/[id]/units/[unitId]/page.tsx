import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bed, Bath, Users, DollarSign, User, Pencil, Wifi, ImageIcon } from "lucide-react"
import { getUnit } from "@/actions/units"
import { UnitActions } from "./unit-actions"
import NextImage from "next/image"

interface Props {
  params: { id: string; unitId: string }
}

export default async function UnitDetailPage({ params }: Props) {
  const unit = await getUnit(params.unitId)

  if (!unit || unit.property.id !== params.id) {
    notFound()
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    ACTIVE: { label: "Ativo", variant: "default" },
    INACTIVE: { label: "Inativo", variant: "secondary" },
    MAINTENANCE: { label: "Manutencao", variant: "destructive" },
  }

  const status = statusMap[unit.status] || statusMap.ACTIVE

  // Determine effective owner
  const effectiveOwner = unit.owner || (unit.property.ownerId ? { name: "Herdado do imovel" } : null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href={`/properties/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{unit.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {unit.property.name} - {unit.property.address}, {unit.property.city}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-14 sm:pl-0">
          <Button variant="outline" asChild>
            <Link href={`/properties/${params.id}/units/${unit.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <UnitActions unitId={unit.id} unitName={unit.name} propertyId={params.id} />
        </div>
      </div>

      {/* Fotos */}
      {unit.photos?.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unit.photos.map((photo: { id: string; url: string }) => (
                <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <NextImage
                    src={photo.url}
                    alt="Foto da unidade"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes da Unidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {unit.description && (
              <div>
                <h4 className="font-medium mb-2">Descricao</h4>
                <p className="text-muted-foreground">{unit.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-3">Capacidade</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{unit.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Quartos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{unit.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Banheiros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{unit.maxGuests}</p>
                    <p className="text-xs text-muted-foreground">Hospedes</p>
                  </div>
                </div>
              </div>
            </div>

            {unit.amenities?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Comodidades</h4>
                <div className="flex flex-wrap gap-2">
                  {unit.amenities.map((amenity: string) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      <Wifi className="h-3 w-3" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {effectiveOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Proprietario
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unit.owner ? (
                  <>
                    <p className="font-medium">{unit.owner.name}</p>
                    <p className="text-sm text-muted-foreground">{unit.owner.email}</p>
                    {unit.owner.phone && (
                      <p className="text-sm text-muted-foreground">{unit.owner.phone}</p>
                    )}
                    <Button variant="link" className="px-0 mt-2" asChild>
                      <Link href={`/owners/${unit.owner.id}`}>
                        Ver perfil completo
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Herdado do imovel
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Limpeza</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(unit.cleaningFee))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Admin.</span>
                <span className="font-medium">{Number(unit.adminFeePercent)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/reservations?unit=${unit.id}`}>
                  Ver Reservas
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/calendar?unit=${unit.id}`}>
                  Ver Calendario
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/tasks?unit=${unit.id}`}>
                  Ver Tarefas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
