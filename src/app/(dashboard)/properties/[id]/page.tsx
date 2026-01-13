import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Bed, Bath, Users, DollarSign, User, Wifi } from "lucide-react"
import { getPropertyById } from "@/actions/properties"
import { getPropertyPhotos } from "@/actions/photos"
import { PropertyActions } from "./property-actions"
import { PhotoUpload } from "@/components/property/photo-upload"
import { ICalLink } from "@/components/property/ical-link"

interface Props {
  params: { id: string }
}

export default async function PropertyDetailPage({ params }: Props) {
  const [property, photos] = await Promise.all([
    getPropertyById(params.id),
    getPropertyPhotos(params.id),
  ])

  if (!property) {
    notFound()
  }

  const statusMap = {
    ACTIVE: { label: "Ativo", variant: "default" as const },
    INACTIVE: { label: "Inativo", variant: "secondary" as const },
    MAINTENANCE: { label: "Manutencao", variant: "destructive" as const },
  }

  const status = statusMap[property.status]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{property.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center text-sm sm:text-base text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{property.address}, {property.city} - {property.state}</span>
            </div>
          </div>
        </div>
        <div className="pl-14 sm:pl-0">
          <PropertyActions propertyId={property.id} propertyName={property.name} />
        </div>
      </div>

      {/* Fotos */}
      <Card>
        <CardContent className="pt-6">
          <PhotoUpload propertyId={property.id} photos={photos} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Imovel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {property.description && (
              <div>
                <h4 className="font-medium mb-2">Descricao</h4>
                <p className="text-muted-foreground">{property.description}</p>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Capacidade</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{property.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Quartos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{property.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Banheiros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{property.maxGuests}</p>
                    <p className="text-xs text-muted-foreground">Hospedes</p>
                  </div>
                </div>
              </div>
            </div>

            {property.amenities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Comodidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity) => (
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
              </>
            )}

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Endereco Completo</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p>{property.address}</p>
                <p>{property.city} - {property.state}</p>
                {property.zipcode && <p>CEP: {property.zipcode}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Proprietario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{property.owner.name}</p>
              <p className="text-sm text-muted-foreground">{property.owner.email}</p>
              {property.owner.phone && (
                <p className="text-sm text-muted-foreground">{property.owner.phone}</p>
              )}
              <Button variant="link" className="px-0 mt-2" asChild>
                <Link href={`/owners/${property.owner.id}`}>
                  Ver perfil completo
                </Link>
              </Button>
            </CardContent>
          </Card>

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
                  }).format(Number(property.cleaningFee))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Admin.</span>
                <span className="font-medium">{Number(property.adminFeePercent)}%</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissao Prop.</span>
                <span className="font-medium">{Number(property.owner.commissionPercent)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/reservations?property=${property.id}`}>
                  Ver Reservas
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/calendar?property=${property.id}`}>
                  Ver Calendario
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/tasks?property=${property.id}`}>
                  Ver Tarefas
                </Link>
              </Button>
              <ICalLink propertyId={property.id} propertyName={property.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
