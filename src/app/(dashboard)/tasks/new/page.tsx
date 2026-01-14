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
import { createTask } from "@/actions/tasks"
import { getAllProperties } from "@/actions/properties"
import { useToast } from "@/hooks/use-toast"

type Property = {
  id: string
  name: string
}

const TASK_TYPES = [
  { value: "CLEANING", label: "Limpeza" },
  { value: "MAINTENANCE", label: "Manutencao" },
  { value: "INSPECTION", label: "Vistoria" },
  { value: "OTHER", label: "Outro" },
]

export default function NewTaskPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])

  useEffect(() => {
    getAllProperties().then((data) => setProperties(data))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createTask(formData)
      if (result.success) {
        toast({
          title: "Tarefa criada",
          description: "A tarefa foi agendada com sucesso.",
        })
        router.push("/tasks")
      } else if (result.error) {
        setError(result.error)
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Erro ao criar tarefa. Verifique os dados e tente novamente.")
      toast({
        title: "Erro",
        description: "Nao foi possivel criar a tarefa.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Data de hoje formatada para o input date
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Tarefa</h1>
          <p className="text-muted-foreground">
            Agende uma limpeza, manutencao ou vistoria
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Tarefa</CardTitle>
              <CardDescription>
                Informacoes sobre a tarefa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Limpeza pos check-out"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detalhes adicionais sobre a tarefa..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
              <CardDescription>
                Quando a tarefa deve ser realizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Data *</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="date"
                  defaultValue={today}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Instrucoes especiais, materiais necessarios..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href="/tasks">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Criar Tarefa"}
          </Button>
        </div>
      </form>
    </div>
  )
}
