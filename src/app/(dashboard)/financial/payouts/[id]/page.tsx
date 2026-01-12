import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { getPayout } from "@/actions/payouts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PayoutActions } from "./payout-actions"

interface Props {
  params: { id: string }
}

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

export default async function PayoutDetailPage({ params }: Props) {
  const payout = await getPayout(params.id)

  if (!payout) {
    notFound()
  }

  const status = statusMap[payout.status]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/financial/payouts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Repasse</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center text-muted-foreground mt-1">
              <User className="h-4 w-4 mr-1" />
              {payout.owner.name}
            </div>
          </div>
        </div>
        <PayoutActions
          payoutId={payout.id}
          currentStatus={payout.status}
          ownerName={payout.owner.name}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Repasse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Inicio do Periodo
                </div>
                <p className="text-xl font-bold">
                  {format(new Date(payout.periodStart), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Fim do Periodo
                </div>
                <p className="text-xl font-bold">
                  {format(new Date(payout.periodEnd), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Receita Bruta</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(Number(payout.grossAmount))}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span>Despesas</span>
                </div>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(Number(payout.expenses))}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span>Taxa Administrativa</span>
                </div>
                <span className="font-semibold text-orange-600">
                  -{formatCurrency(Number(payout.adminFee))}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <span className="font-medium text-lg">Valor Liquido</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(payout.netAmount))}
                </span>
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
              <p className="font-medium">{payout.owner.name}</p>
              <p className="text-sm text-muted-foreground">{payout.owner.email}</p>
              {payout.owner.pixKey && (
                <div className="mt-3 p-2 bg-muted rounded text-sm">
                  <p className="text-muted-foreground">Chave PIX</p>
                  <p className="font-mono">{payout.owner.pixKey}</p>
                </div>
              )}
              <Button variant="link" className="px-0 mt-2" asChild>
                <Link href={`/owners/${payout.owner.id}`}>
                  Ver perfil completo
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{format(new Date(payout.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
              {payout.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago em</span>
                  <span>{format(new Date(payout.paidAt), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
