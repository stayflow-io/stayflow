"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { createPayout, calculatePayoutPreview } from "@/actions/payouts"
import { getOwners } from "@/actions/owners"

type Owner = {
  id: string
  name: string
}

type Preview = {
  grossAmount: number
  expenses: number
  adminFee: number
  netAmount: number
  reservationsCount: number
  expensesCount: number
  commissionPercent: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default function NewPayoutPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [selectedOwner, setSelectedOwner] = useState<string>("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)

  useEffect(() => {
    getOwners().then((data) => setOwners(data))

    // Definir período padrão (mês anterior)
    const now = new Date()
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    setPeriodStart(firstDayLastMonth.toISOString().split("T")[0])
    setPeriodEnd(lastDayLastMonth.toISOString().split("T")[0])
  }, [])

  async function handleCalculate() {
    if (!selectedOwner || !periodStart || !periodEnd) {
      setError("Selecione o proprietario e o periodo")
      return
    }

    setIsCalculating(true)
    setError(null)

    try {
      const result = await calculatePayoutPreview(
        selectedOwner,
        new Date(periodStart),
        new Date(periodEnd)
      )

      if (result.success && result.preview) {
        setPreview(result.preview)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao calcular preview")
    } finally {
      setIsCalculating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!preview) {
      setError("Calcule o repasse antes de criar")
      return
    }

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set("ownerId", selectedOwner)
    formData.set("periodStart", periodStart)
    formData.set("periodEnd", periodEnd)
    formData.set("grossAmount", String(preview.grossAmount))
    formData.set("expenses", String(preview.expenses))
    formData.set("adminFee", String(preview.adminFee))
    formData.set("netAmount", String(preview.netAmount))

    try {
      const result = await createPayout(formData)
      if (result.success) {
        router.push("/financial/payouts")
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao criar repasse")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/financial/payouts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Repasse</h1>
          <p className="text-muted-foreground">
            Calcule e registre um repasse para proprietario
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuracao</CardTitle>
              <CardDescription>
                Selecione o proprietario e periodo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ownerId">Proprietario *</Label>
                <Select
                  value={selectedOwner}
                  onValueChange={setSelectedOwner}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietario" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Inicio do Periodo *</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Fim do Periodo *</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCalculate}
                disabled={isCalculating || !selectedOwner || !periodStart || !periodEnd}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? "Calculando..." : "Calcular Repasse"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo do Repasse</CardTitle>
              <CardDescription>
                {preview ? "Valores calculados" : "Clique em calcular para ver o resumo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Receita Bruta</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(preview.grossAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Despesas ({preview.expensesCount})</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(preview.expenses)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Taxa Administrativa</span>
                    </div>
                    <span className="font-semibold text-orange-600">
                      -{formatCurrency(preview.adminFee)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                    <div>
                      <span className="font-medium">Valor Liquido</span>
                      <p className="text-xs text-muted-foreground">
                        {preview.reservationsCount} reservas no periodo
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(preview.netAmount)}
                    </span>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" asChild disabled={isLoading}>
                      <Link href="/financial/payouts">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading || preview.netAmount <= 0}>
                      {isLoading ? "Criando..." : "Criar Repasse"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mb-4 opacity-50" />
                  <p>Selecione o proprietario e periodo</p>
                  <p className="text-sm">e clique em calcular</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
