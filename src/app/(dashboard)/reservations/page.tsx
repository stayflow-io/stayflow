import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, Building2 } from "lucide-react"
import { getReservations } from "@/actions/reservations"
import { getAllProperties } from "@/actions/properties"
import { getOwners } from "@/actions/owners"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ReservationsFilters } from "./reservations-filters"
import { Pagination } from "@/components/ui/pagination"

const statusMap = {
  PENDING: { label: "Pendente", variant: "outline" as const },
  CONFIRMED: { label: "Confirmada", variant: "default" as const },
  CHECKED_IN: { label: "Check-in", variant: "secondary" as const },
  CHECKED_OUT: { label: "Check-out", variant: "secondary" as const },
  CANCELLED: { label: "Cancelada", variant: "destructive" as const },
  NO_SHOW: { label: "No-show", variant: "destructive" as const },
}

interface Props {
  searchParams: { status?: string; property?: string; owner?: string; page?: string }
}

export default async function ReservationsPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  const [reservationsData, properties, owners] = await Promise.all([
    getReservations({ status: searchParams.status, propertyId: searchParams.property, ownerId: searchParams.owner, page }),
    getAllProperties(),
    getOwners(),
  ])

  const { items: reservations, pagination } = reservationsData
  const hasFilters = searchParams.status || searchParams.property || searchParams.owner

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">
            Gerencie suas reservas
          </p>
        </div>
        <Button asChild>
          <Link href="/reservations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Reserva
          </Link>
        </Button>
      </div>

      <ReservationsFilters properties={properties} owners={owners} />

      {reservations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasFilters ? "Nenhum resultado" : "Lista de Reservas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "Nenhuma reserva encontrada com os filtros selecionados."
                : "Nenhuma reserva encontrada. Clique em \"Nova Reserva\" para criar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const status = statusMap[reservation.status]
              return (
                <Link key={reservation.id} href={`/reservations/${reservation.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-muted rounded-lg text-center min-w-[70px]">
                            <p className="text-2xl font-bold">
                              {format(new Date(reservation.checkinDate), "dd")}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase">
                              {format(new Date(reservation.checkinDate), "MMM", { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{reservation.guestName}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />
                                {reservation.property.name}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {reservation.numGuests} hospedes
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(reservation.checkinDate), "dd/MM")} - {format(new Date(reservation.checkoutDate), "dd/MM")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Number(reservation.totalAmount))}
                            </p>
                            {reservation.channel && (
                              <p className="text-xs text-muted-foreground">
                                via {reservation.channel.name}
                              </p>
                            )}
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>
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
            baseUrl="/reservations"
          />
        </>
      )}
    </div>
  )
}
