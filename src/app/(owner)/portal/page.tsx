import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, DollarSign, CalendarCheck, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

async function getOwnerData(userId: string) {
  const owner = await prisma.owner.findFirst({
    where: { userId },
    include: {
      properties: {
        where: { deletedAt: null },
        include: {
          units: {
            where: { deletedAt: null },
            include: {
              reservations: {
                where: {
                  status: { in: ["CONFIRMED", "CHECKED_IN"] },
                  checkoutDate: { gte: new Date() },
                },
                orderBy: { checkinDate: "asc" },
                take: 5,
              },
            },
          },
          _count: {
            select: { units: true },
          },
        },
      },
      units: {
        where: { deletedAt: null },
        include: {
          property: true,
          reservations: {
            where: {
              status: { in: ["CONFIRMED", "CHECKED_IN"] },
              checkoutDate: { gte: new Date() },
            },
            orderBy: { checkinDate: "asc" },
            take: 5,
          },
        },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!owner) return null

  // Calculate totals - count all units belonging to this owner
  const totalUnits = owner.units.length + owner.properties.reduce(
    (sum, p) => sum + p.units.filter(u => u.ownerId === null).length,
    0
  )
  const pendingPayouts = owner.payouts.filter((p) => p.status === "PENDING").length
  const totalPaidOut = owner.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.netAmount), 0)

  // Get upcoming reservations across all units
  // From units directly owned
  const directUnitReservations = owner.units.flatMap((u) =>
    u.reservations.map((r) => ({
      ...r,
      propertyName: u.property.name,
      unitName: u.name,
    }))
  )

  // From units inherited from properties (where unit.ownerId is null)
  const inheritedUnitReservations = owner.properties.flatMap((p) =>
    p.units
      .filter((u) => u.ownerId === null)
      .flatMap((u) =>
        u.reservations.map((r) => ({
          ...r,
          propertyName: p.name,
          unitName: u.name,
        }))
      )
  )

  const upcomingReservations = [...directUnitReservations, ...inheritedUnitReservations]
    .sort((a, b) => a.checkinDate.getTime() - b.checkinDate.getTime())
    .slice(0, 5)

  return {
    owner,
    stats: {
      totalUnits,
      pendingPayouts,
      totalPaidOut,
      upcomingReservations,
    },
  }
}

export default async function OwnerPortalPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/login")
  }

  const data = await getOwnerData(session.user.id)

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Portal do Proprietario</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Sua conta ainda nao esta vinculada a um proprietario.
              Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { owner, stats } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ola, {owner.name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu portal de proprietario
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Unidades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">unidades ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repasses Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.totalPaidOut)}
            </div>
            <p className="text-xs text-muted-foreground">total historico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proximas Reservas</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingReservations.length}</div>
            <p className="text-xs text-muted-foreground">reservas confirmadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proximas Reservas</CardTitle>
            <CardDescription>Reservas confirmadas nas suas unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma reserva confirmada
              </p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{reservation.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.propertyName} - {reservation.unitName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(reservation.checkinDate, "dd/MM")} - {format(reservation.checkoutDate, "dd/MM")}
                      </p>
                      <p className="text-sm text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(reservation.netAmount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimos Repasses</CardTitle>
            <CardDescription>Seus pagamentos mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {owner.payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum repasse encontrado
              </p>
            ) : (
              <div className="space-y-3">
                {owner.payouts.map((payout) => (
                  <Link
                    key={payout.id}
                    href={`/portal/payouts/${payout.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {format(payout.periodStart, "MMM yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payout.status === "PAID"
                          ? "Pago"
                          : payout.status === "PENDING"
                          ? "Pendente"
                          : payout.status}
                      </p>
                    </div>
                    <p className={`font-bold ${payout.status === "PAID" ? "text-green-600" : ""}`}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(payout.netAmount))}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
