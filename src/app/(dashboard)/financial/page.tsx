import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, TrendingUp, TrendingDown, Building2 } from "lucide-react"
import { getTransactions, getFinancialSummary } from "@/actions/financial"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function FinancialPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [transactions, summary] = await Promise.all([
    getTransactions(),
    getFinancialSummary(startOfMonth, endOfMonth),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Controle receitas e despesas - {format(now, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href="/financial/payouts">
              Repasses
            </Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/financial/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Transacao
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Receita do Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Despesas do Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.expenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Liquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacoes Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma transacao encontrada. Clique em "Nova Transacao" para registrar.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 20).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      transaction.type === "INCOME"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {transaction.type === "INCOME" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{transaction.category}</p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">{transaction.property.name}</span>
                        </span>
                        {transaction.description && (
                          <span className="truncate max-w-[120px] sm:max-w-none">- {transaction.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-11 sm:pl-0 flex-shrink-0">
                    <p className={`font-semibold ${
                      transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
