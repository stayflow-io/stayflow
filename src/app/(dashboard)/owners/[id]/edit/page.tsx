"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { getOwner, updateOwner } from "@/actions/owners"

type Owner = {
  id: string
  name: string
  email: string
  phone: string | null
  document: string | null
  pixKey: string | null
  commissionPercent: any
}

export default function EditOwnerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owner, setOwner] = useState<Owner | null>(null)

  useEffect(() => {
    async function loadOwner() {
      const data = await getOwner(params.id)
      if (data) {
        setOwner(data)
      }
    }
    loadOwner()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await updateOwner(params.id, formData)
      if (result.success) {
        router.push(`/owners/${params.id}`)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao atualizar proprietario. Verifique os dados e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!owner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/owners/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Proprietario</h1>
          <p className="text-muted-foreground">
            {owner.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Pessoais</CardTitle>
              <CardDescription>
                Dados do proprietario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={owner.name}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={owner.email}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={owner.phone || ""}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input
                  id="document"
                  name="document"
                  defaultValue={owner.document || ""}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados Financeiros</CardTitle>
              <CardDescription>
                Informacoes para pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  name="pixKey"
                  defaultValue={owner.pixKey || ""}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionPercent">Comissao do Proprietario (%)</Label>
                <Input
                  id="commissionPercent"
                  name="commissionPercent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={Number(owner.commissionPercent)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Percentual que o proprietario recebe de cada reserva
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href={`/owners/${params.id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
