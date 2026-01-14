"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { createOwner } from "@/actions/owners"
import { useToast } from "@/hooks/use-toast"

export default function NewOwnerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createOwner(formData)
      if (result.success) {
        toast({
          title: "Proprietario criado",
          description: "O proprietario foi cadastrado com sucesso.",
        })
        router.push("/owners")
      } else if (result.error) {
        setError(result.error)
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Erro ao criar proprietario. Verifique os dados e tente novamente.")
      toast({
        title: "Erro",
        description: "Nao foi possivel criar o proprietario.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/owners">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Proprietario</h1>
          <p className="text-muted-foreground">
            Cadastre um novo proprietario no sistema
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
                  placeholder="Nome do proprietario"
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
                  placeholder="email@exemplo.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input
                  id="document"
                  name="document"
                  placeholder="000.000.000-00"
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
                  placeholder="CPF, email, telefone ou chave aleatoria"
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
                  defaultValue="80"
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
            <Link href="/owners">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Criar Proprietario"}
          </Button>
        </div>
      </form>
    </div>
  )
}
