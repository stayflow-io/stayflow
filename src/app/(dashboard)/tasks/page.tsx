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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tarefas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie limpezas e manutencoes
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="mt-1 sm:mt-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                          )}
                        </div>
                        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold hover:underline truncate ${isCompleted ? "line-through" : ""}`}>
                              {task.title}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${type.color}`}>
                              {type.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                            <span className="flex items-center">
                              <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[100px] sm:max-w-none">{task.unit?.property.name} - {task.unit?.name}</span>
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                              {format(new Date(task.scheduledDate), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {task.assignedTo && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-[80px] sm:max-w-none">{task.assignedTo.name}</span>
                              </span>
                            )}
                            {isCompleted && task.completedAt && (
                              <span className="whitespace-nowrap">
                                Concluida em {format(new Date(task.completedAt), "dd/MM", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                      <Badge variant={status.variant} className="self-start sm:self-center">{status.label}</Badge>
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
