import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

async function getOwnerPayouts(userId: string) {
  const owner = await prisma.owner.findFirst({
    where: { userId },
    include: {
      payouts: {
        orderBy: { periodStart: "desc" },
      },
    },
  })

  return owner?.payouts || []
}

const statusMap = {
  PENDING: { label: "Pendente", variant: "outline" as const },
  PROCESSING: { label: "Processando", variant: "secondary" as const },
  PAID: { label: "Pago", variant: "default" as const },
  FAILED: { label: "Falhou", variant: "destructive" as const },
}

export default async function OwnerPayoutsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/login")
  }

  const payouts = await getOwnerPayouts(session.user.id)

  const totalPending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.netAmount), 0)

  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.netAmount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meus Repasses</h1>
        <p className="text-muted-foreground">
          Acompanhe os pagamentos dos seus imoveis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              total historico
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historico de Repasses</CardTitle>
          <CardDescription>
            Todos os seus repasses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum repasse encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => {
                const status = statusMap[payout.status]
                return (
                  <Link
                    key={payout.id}
                    href={`/portal/payouts/${payout.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {format(payout.periodStart, "MMMM yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(payout.periodStart, "dd/MM")} a {format(payout.periodEnd, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-bold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payout.netAmount))}
                        </p>
                        {payout.paidAt && (
                          <p className="text-xs text-muted-foreground">
                            Pago em {format(payout.paidAt, "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
