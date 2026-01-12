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
import { getTask, updateTask } from "@/actions/tasks"
import { getAllProperties } from "@/actions/properties"

type Property = {
  id: string
  name: string
}

type Task = {
  id: string
  propertyId: string
  type: string
  title: string
  description: string | null
  scheduledDate: Date
  notes: string | null
  status: string
}

const TASK_TYPES = [
  { value: "CLEANING", label: "Limpeza" },
  { value: "MAINTENANCE", label: "Manutencao" },
  { value: "INSPECTION", label: "Vistoria" },
  { value: "OTHER", label: "Outro" },
]

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluida" },
  { value: "CANCELLED", label: "Cancelada" },
]

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    async function loadData() {
      const [taskData, propertiesData] = await Promise.all([
        getTask(params.id),
        getAllProperties(),
      ])

      if (taskData) {
        setTask(taskData)
      }
      setProperties(propertiesData)
    }
    loadData()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await updateTask(params.id, formData)
      if (result.success) {
        router.push(`/tasks/${params.id}`)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao atualizar tarefa. Verifique os dados e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  function formatDateForInput(date: Date) {
    return new Date(date).toISOString().split("T")[0]
  }

  if (!task) {
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
          <Link href={`/tasks/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Tarefa</h1>
          <p className="text-muted-foreground">
            {task.title}
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
                  defaultValue={task.title}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" defaultValue={task.type} disabled={isLoading}>
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
                <Select name="propertyId" defaultValue={task.propertyId} disabled={isLoading}>
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
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={task.status} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
                  defaultValue={task.description || ""}
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
                  defaultValue={formatDateForInput(task.scheduledDate)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={task.notes || ""}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href={`/tasks/${params.id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
