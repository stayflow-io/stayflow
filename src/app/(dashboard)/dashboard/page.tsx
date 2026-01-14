import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, CalendarCheck, ClipboardList, DollarSign, AlertCircle, LogIn, LogOut, TrendingUp, BarChart3, PieChart, Sparkles } from "lucide-react"
import { getDashboardStats, getRevenueByMonth, getOccupancyByProperty, getReservationsByStatus } from "@/actions/dashboard"
import { getRevenueForecast } from "@/actions/reports"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { OccupancyChart } from "@/components/charts/occupancy-chart"
import { ReservationsByStatusChart } from "@/components/charts/reservations-by-status"

export default async function DashboardPage() {
  const [data, revenueData, occupancyData, statusData, forecastData] = await Promise.all([
    getDashboardStats(),
    getRevenueByMonth(),
    getOccupancyByProperty(),
    getReservationsByStatus(),
    getRevenueForecast(),
  ])

  const hasAlerts = data.overdueTasks > 0 || data.todayCheckins.length > 0 || data.todayCheckouts.length > 0 || data.pendingPayouts > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visao geral do seu negocio - {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Alertas */}
      {hasAlerts && (
        <div className="space-y-3">
          {data.todayCheckins.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <LogIn className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {data.todayCheckins.length} check-in{data.todayCheckins.length > 1 ? "s" : ""} hoje
                </p>
                <p className="text-sm text-blue-700">
                  {data.todayCheckins.map(r => r.guestName).join(", ")}
                </p>
              </div>
              <Link href="/reservations?status=CONFIRMED" className="text-sm text-blue-600 hover:underline">
                Ver reservas
              </Link>
            </div>
          )}

          {data.todayCheckouts.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <LogOut className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-900">
                  {data.todayCheckouts.length} check-out{data.todayCheckouts.length > 1 ? "s" : ""} hoje
                </p>
                <p className="text-sm text-orange-700">
                  {data.todayCheckouts.map(r => r.guestName).join(", ")}
                </p>
              </div>
              <Link href="/reservations?status=CHECKED_IN" className="text-sm text-orange-600 hover:underline">
                Ver reservas
              </Link>
            </div>
          )}

          {data.overdueTasks > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">
                  {data.overdueTasks} tarefa{data.overdueTasks > 1 ? "s" : ""} atrasada{data.overdueTasks > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-700">
                  Tarefas com data anterior a hoje ainda pendentes
                </p>
              </div>
              <Link href="/tasks?status=PENDING" className="text-sm text-red-600 hover:underline">
                Ver tarefas
              </Link>
            </div>
          )}

          {data.pendingPayouts > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">
                  {data.pendingPayouts} repasse{data.pendingPayouts > 1 ? "s" : ""} pendente{data.pendingPayouts > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-yellow-700">
                  Pagamentos a proprietarios aguardando processamento
                </p>
              </div>
              <Link href="/financial/payouts?status=PENDING" className="text-sm text-yellow-600 hover:underline">
                Ver repasses
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Imoveis Ativos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.propertiesCount}</div>
            <p className="text-xs text-muted-foreground">
              imoveis cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas do Mes
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reservationsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              check-ins este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tarefas Hoje
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">
              pendentes para hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita do Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.revenueThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              receita bruta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Receita Mensal
            </CardTitle>
            <CardDescription>
              Evolucao da receita nos ultimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Taxa de Ocupacao
            </CardTitle>
            <CardDescription>
              Ocupacao por imovel no mes atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {occupancyData.length > 0 ? (
              <OccupancyChart data={occupancyData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum imovel cadastrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Reservas por Status
            </CardTitle>
            <CardDescription>
              Distribuicao das reservas do mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ReservationsByStatusChart data={statusData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma reserva no mes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proximos Check-ins</CardTitle>
            <CardDescription>
              Reservas com check-in nos proximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma reserva encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcomingCheckins.map((reservation) => (
                  <Link
                    key={reservation.id}
                    href={`/reservations/${reservation.id}`}
                    className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-muted -mx-2 px-2 py-1 rounded transition-colors"
                  >
                    <div>
                      <p className="font-medium">{reservation.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.property.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(reservation.checkinDate), "dd/MM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.numGuests} hospedes
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas de Hoje</CardTitle>
            <CardDescription>
              Limpezas e manutencoes programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa para hoje
              </p>
            ) : (
              <div className="space-y-3">
                {data.todayTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-muted -mx-2 px-2 py-1 rounded transition-colors"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.property?.name || "Sem imóvel"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={task.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                        {task.status === "IN_PROGRESS" ? "Em andamento" : "Pendente"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previsao de Receita */}
      {forecastData && forecastData.forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Previsao de Receita
            </CardTitle>
            <CardDescription>
              Receita prevista com base nas reservas confirmadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Receita Prevista</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(forecastData.totals.revenue)}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Reservas Confirmadas</p>
                <p className="text-2xl font-bold">{forecastData.totals.reservations}</p>
              </div>
            </div>
            <div className="space-y-3">
              {forecastData.forecast.map((month) => {
                const [year, monthNum] = month.month.split("-")
                const monthName = format(new Date(parseInt(year), parseInt(monthNum) - 1), "MMMM yyyy", { locale: ptBR })
                return (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{monthName}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.reservations} reserva{month.reservations !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(month.revenue)}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
