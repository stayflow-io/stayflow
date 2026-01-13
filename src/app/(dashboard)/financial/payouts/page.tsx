import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Calendar, DollarSign } from "lucide-react"
import { getPayouts } from "@/actions/payouts"
import { getOwners } from "@/actions/owners"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PayoutsFilters } from "./payouts-filters"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const statusMap = {
  PENDING: { label: "Pendente", variant: "outline" as const },
  PROCESSING: { label: "Processando", variant: "secondary" as const },
  PAID: { label: "Pago", variant: "default" as const },
  FAILED: { label: "Falhou", variant: "destructive" as const },
}

interface Props {
  searchParams: { owner?: string; status?: string }
}

export default async function PayoutsPage({ searchParams }: Props) {
  const [payouts, owners] = await Promise.all([
    getPayouts({ ownerId: searchParams.owner, status: searchParams.status }),
    getOwners(),
  ])

  const hasFilters = searchParams.owner || searchParams.status

  const totalPending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.netAmount), 0)

  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.netAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Repasses</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie pagamentos aos proprietarios
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/financial/payouts/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Repasse
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pago (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      <PayoutsFilters owners={owners} />

      {payouts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasFilters ? "Nenhum resultado" : "Lista de Repasses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "Nenhum repasse encontrado com os filtros selecionados."
                : "Nenhum repasse registrado. Clique em \"Novo Repasse\" para criar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historico de Repasses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payouts.map((payout) => {
                const status = statusMap[payout.status]
                return (
                  <Link key={payout.id} href={`/financial/payouts/${payout.id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:shadow-md transition-shadow gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-muted rounded-full flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{payout.owner.name}</p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {format(new Date(payout.periodStart), "dd/MM", { locale: ptBR })} - {format(new Date(payout.periodEnd), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 pl-[44px] sm:pl-0">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(Number(payout.netAmount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bruto: {formatCurrency(Number(payout.grossAmount))}
                          </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
