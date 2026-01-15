import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Building2, Home, User } from "lucide-react"
import { getProperties } from "@/actions/properties"
import { getOwners } from "@/actions/owners"
import { PropertiesFilters } from "./properties-filters"
import { Pagination } from "@/components/ui/pagination"

interface Props {
  searchParams: { status?: string; owner?: string; page?: string }
}

export default async function PropertiesPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  const [propertiesData, owners] = await Promise.all([
    getProperties({ status: searchParams.status, ownerId: searchParams.owner, page }),
    getOwners(),
  ])

  const { items: properties, pagination } = propertiesData
  const hasFilters = searchParams.status || searchParams.owner

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Imoveis</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seus imoveis cadastrados
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Imovel
          </Link>
        </Button>
      </div>

      <PropertiesFilters owners={owners} />

      {properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasFilters ? "Nenhum resultado" : "Lista de Imoveis"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "Nenhum imovel encontrado com os filtros selecionados."
                : "Nenhum imovel cadastrado ainda. Clique em \"Novo Imovel\" para comecar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              // Calculate totals from units
              const totalUnits = property._count.units
              const activeUnits = property.units?.filter(u => u.status === "ACTIVE").length || 0

              return (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                        <Badge variant={property.status === "ACTIVE" ? "default" : "secondary"}>
                          {property.status === "ACTIVE" ? "Ativo" : property.status === "INACTIVE" ? "Inativo" : "Manutencao"}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.city}, {property.state}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center" title="Unidades">
                          <Home className="h-4 w-4 mr-1" />
                          {totalUnits}<span className="hidden sm:inline ml-1">unidade{totalUnits !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center" title="Unidades Ativas">
                          <Building2 className="h-4 w-4 mr-1" />
                          {activeUnits}<span className="hidden sm:inline ml-1">ativa{activeUnits !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Proprietario:
                        </span>
                        <span className="font-medium">
                          {property.owner?.name || "Nenhum"}
                        </span>
                      </div>
                      {property.units && property.units.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>Unidades: </span>
                          {property.units.slice(0, 3).map(u => u.name).join(", ")}
                          {property.units.length > 3 && ` +${property.units.length - 3}`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            baseUrl="/properties"
          />
        </>
      )}
    </div>
  )
}
