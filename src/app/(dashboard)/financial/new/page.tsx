"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { createTransaction } from "@/actions/financial"
import { getAllProperties } from "@/actions/properties"

type Property = {
  id: string
  name: string
}

const INCOME_CATEGORIES = [
  "Reserva",
  "Taxa de limpeza",
  "Taxa extra",
  "Multa",
  "Outro",
]

const EXPENSE_CATEGORIES = [
  "Limpeza",
  "Manutencao",
  "Consumo (agua/luz/gas)",
  "Internet",
  "Condominio",
  "IPTU",
  "Comissao",
  "Material de limpeza",
  "Enxoval",
  "Outro",
]

export default function NewTransactionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">("INCOME")

  useEffect(() => {
    getAllProperties().then((data) => setProperties(data))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createTransaction(formData)
      if (result.success) {
        router.push("/financial")
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao criar transacao. Verifique os dados e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const categories = transactionType === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/financial">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Transacao</h1>
          <p className="text-muted-foreground">
            Registre uma receita ou despesa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Detalhes da Transacao</CardTitle>
            <CardDescription>
              Preencha as informacoes da transacao
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="INCOME"
                    checked={transactionType === "INCOME"}
                    onChange={() => setTransactionType("INCOME")}
                    className="text-green-600"
                  />
                  <span className="text-green-600 font-medium">Receita</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="EXPENSE"
                    checked={transactionType === "EXPENSE"}
                    onChange={() => setTransactionType("EXPENSE")}
                    className="text-red-600"
                  />
                  <span className="text-red-600 font-medium">Despesa</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyId">Imovel *</Label>
              <Select name="propertyId" required disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o imovel" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select name="category" required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detalhes adicionais..."
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild disabled={isLoading}>
                <Link href="/financial">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Transacao"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
