import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Calendar, User, CheckCircle2 } from "lucide-react"
import { getTasks } from "@/actions/tasks"
import { getAllProperties } from "@/actions/properties"
import { getOwners } from "@/actions/owners"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TaskStatusButton } from "./task-status-button"
import { TasksFilters } from "./tasks-filters"
import { Pagination } from "@/components/ui/pagination"

const statusMap = {
  PENDING: { label: "Pendente", variant: "outline" as const, color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "Em andamento", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Concluida", variant: "default" as const, color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", variant: "destructive" as const, color: "bg-red-100 text-red-700" },
}

const typeMap = {
  CLEANING: { label: "Limpeza", color: "bg-purple-100 text-purple-700" },
  MAINTENANCE: { label: "Manutencao", color: "bg-orange-100 text-orange-700" },
  INSPECTION: { label: "Vistoria", color: "bg-cyan-100 text-cyan-700" },
  OTHER: { label: "Outro", color: "bg-gray-100 text-gray-700" },
}

interface Props {
  searchParams: { status?: string; type?: string; property?: string; owner?: string; page?: string }
}

export default async function TasksPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  const [tasksData, properties, owners] = await Promise.all([
    getTasks({
      status: searchParams.status,
      type: searchParams.type,
      propertyId: searchParams.property,
      ownerId: searchParams.owner,
      page,
    }),
    getAllProperties(),
    getOwners(),
  ])

  const { items: tasks, pagination } = tasksData
  const hasFilters = searchParams.status || searchParams.type || searchParams.property || searchParams.owner

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie limpezas e manutencoes
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Link>
        </Button>
      </div>

      <TasksFilters properties={properties} owners={owners} />

      {tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasFilters ? "Nenhum resultado" : "Lista de Tarefas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "Nenhuma tarefa encontrada com os filtros selecionados."
                : "Nenhuma tarefa encontrada. Clique em \"Nova Tarefa\" para criar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {tasks.map((task) => {
              const status = statusMap[task.status]
              const type = typeMap[task.type]
              const isCompleted = task.status === "COMPLETED"

              return (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${isCompleted ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                        )}
                        <Link href={`/tasks/${task.id}`} className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold hover:underline ${isCompleted ? "line-through" : ""}`}>
                              {task.title}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded ${type.color}`}>
                              {type.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {task.property.name}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.scheduledDate), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {task.assignedTo && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignedTo.name}
                              </span>
                            )}
                            {isCompleted && task.completedAt && (
                              <span>
                                Concluida em {format(new Date(task.completedAt), "dd/MM", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            baseUrl="/tasks"
          />
        </>
      )}
    </div>
  )
}
