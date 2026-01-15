import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Building2, User, Calendar, Phone, Mail, DollarSign } from "lucide-react"
import { getReservation } from "@/actions/reservations"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ReservationActions } from "./reservation-actions"

interface Props {
  params: { id: string }
}

const statusMap = {
  PENDING: { label: "Pendente", variant: "outline" as const },
  CONFIRMED: { label: "Confirmada", variant: "default" as const },
  CHECKED_IN: { label: "Check-in realizado", variant: "secondary" as const },
  CHECKED_OUT: { label: "Check-out realizado", variant: "secondary" as const },
  CANCELLED: { label: "Cancelada", variant: "destructive" as const },
  NO_SHOW: { label: "No-show", variant: "destructive" as const },
}

export default async function ReservationDetailPage({ params }: Props) {
  const reservation = await getReservation(params.id)

  if (!reservation) {
    notFound()
  }

  const status = statusMap[reservation.status]
  const nights = Math.ceil(
    (new Date(reservation.checkoutDate).getTime() - new Date(reservation.checkinDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/reservations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{reservation.guestName}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center text-sm sm:text-base text-muted-foreground mt-1">
              <Building2 className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{reservation.unit.property.name} - {reservation.unit.name}</span>
            </div>
          </div>
        </div>
        <div className="pl-14 sm:pl-0">
          <ReservationActions
            reservationId={reservation.id}
            currentStatus={reservation.status}
            guestName={reservation.guestName}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes da Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="text-2xl font-bold">
                  {format(new Date(reservation.checkinDate), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="text-2xl font-bold">
                  {format(new Date(reservation.checkoutDate), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{nights} {nights === 1 ? "noite" : "noites"}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.numGuests} {reservation.numGuests === 1 ? "hospede" : "hospedes"}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Contato do Hospede</h4>
              <div className="space-y-2">
                {reservation.guestEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${reservation.guestEmail}`} className="hover:underline">
                      {reservation.guestEmail}
                    </a>
                  </div>
                )}
                {reservation.guestPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${reservation.guestPhone}`} className="hover:underline">
                      {reservation.guestPhone}
                    </a>
                  </div>
                )}
                {!reservation.guestEmail && !reservation.guestPhone && (
                  <p className="text-sm text-muted-foreground">Nenhum contato informado</p>
                )}
              </div>
            </div>

            {reservation.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Observacoes</h4>
                  <p className="text-sm text-muted-foreground">{reservation.notes}</p>
                </div>
              </>
            )}

            {reservation.events.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Historico</h4>
                  <div className="space-y-2">
                    {reservation.events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{event.eventType}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(reservation.totalAmount))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Limpeza</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(reservation.cleaningFee))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa do Canal</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(reservation.channelFee))}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Valor Liquido</span>
                <span className="text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(reservation.netAmount))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Imovel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{reservation.unit.property.name} - {reservation.unit.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Proprietario: {reservation.unit.owner?.name || reservation.unit.property.owner?.name || "Nenhum"}
              </p>
              <Button variant="link" className="px-0 mt-2" asChild>
                <Link href={`/properties/${reservation.unit.property.id}`}>
                  Ver imovel
                </Link>
              </Button>
            </CardContent>
          </Card>

          {reservation.channel && (
            <Card>
              <CardHeader>
                <CardTitle>Canal de Reserva</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium capitalize">{reservation.channel.name}</p>
                {reservation.externalReservationId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ID: {reservation.externalReservationId}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
