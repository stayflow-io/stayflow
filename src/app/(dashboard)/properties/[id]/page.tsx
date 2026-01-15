import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Bed, Bath, Users, DollarSign, User, Plus, Home, Building2 } from "lucide-react"
import { getPropertyById } from "@/actions/properties"
import { PropertyActions } from "./property-actions"
import { ICalLink } from "@/components/property/ical-link"
import { AmenityBadge } from "@/components/ui/amenity-badge"

interface Props {
  params: { id: string }
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getPropertyById(params.id)

  if (!property) {
    notFound()
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    ACTIVE: { label: "Ativo", variant: "default" },
    INACTIVE: { label: "Inativo", variant: "secondary" },
    MAINTENANCE: { label: "Manutencao", variant: "destructive" },
  }

  const status = statusMap[property.status] || statusMap.ACTIVE

  // Calcular totais das units
  const totalBedrooms = property.units?.reduce((sum: number, u: any) => sum + u.bedrooms, 0) || 0
  const totalBathrooms = property.units?.reduce((sum: number, u: any) => sum + u.bathrooms, 0) || 0
  const totalGuests = property.units?.reduce((sum: number, u: any) => sum + u.maxGuests, 0) || 0

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

      {/* Resumo Geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{property.units?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Unidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalBedrooms}</p>
                <p className="text-xs text-muted-foreground">Quartos (total)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalBathrooms}</p>
                <p className="text-xs text-muted-foreground">Banheiros (total)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalGuests}</p>
                <p className="text-xs text-muted-foreground">Hospedes (total)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Unidades */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Unidades</CardTitle>
              <CardDescription>
                Apartamentos, quartos ou espacos deste imovel
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/properties/${property.id}/units/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {property.units?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma unidade cadastrada</p>
                <p className="text-sm">Adicione unidades para comecar a gerenciar reservas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {property.units?.map((unit: any) => {
                  const unitStatus = statusMap[unit.status] || statusMap.ACTIVE
                  return (
                    <Link
                      key={unit.id}
                      href={`/properties/${property.id}/units/${unit.id}`}
                      className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{unit.name}</h4>
                            <Badge variant={unitStatus.variant} className="text-xs">
                              {unitStatus.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {unit.bedrooms} quartos
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {unit.bathrooms} banheiros
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {unit.maxGuests} hospedes
                            </span>
                          </div>
                          {unit.owner && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Proprietario: {unit.owner.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(unit.cleaningFee))}
                          </p>
                          <p className="text-xs text-muted-foreground">taxa limpeza</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {unit._count?.reservations || 0} reservas
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Proprietario */}
          {property.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Proprietario Padrao
                </CardTitle>
                <CardDescription>
                  Proprietario padrao das unidades sem owner especifico
                </CardDescription>
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
          )}

          {/* Detalhes do Imovel */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Imovel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Descricao</h4>
                  <p className="text-sm text-muted-foreground">{property.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-1">Endereco</h4>
                <div className="text-sm text-muted-foreground">
                  <p>{property.address}</p>
                  <p>{property.city} - {property.state}</p>
                  {property.zipcode && <p>CEP: {property.zipcode}</p>}
                </div>
              </div>

              {property.amenities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Comodidades do Imovel</h4>
                  <div className="flex flex-wrap gap-1">
                    {property.amenities.map((amenity: string) => (
                      <AmenityBadge key={amenity} amenity={amenity} className="text-xs py-0.5 px-2" />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acoes Rapidas */}
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
