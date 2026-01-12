import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Building2, Calendar, User, Clock, FileText } from "lucide-react"
import { getTask } from "@/actions/tasks"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TaskActions } from "./task-actions"

interface Props {
  params: { id: string }
}

const statusMap = {
  PENDING: { label: "Pendente", variant: "outline" as const },
  IN_PROGRESS: { label: "Em andamento", variant: "secondary" as const },
  COMPLETED: { label: "Concluida", variant: "default" as const },
  CANCELLED: { label: "Cancelada", variant: "destructive" as const },
}

const typeMap = {
  CLEANING: { label: "Limpeza", color: "bg-purple-100 text-purple-700" },
  MAINTENANCE: { label: "Manutencao", color: "bg-orange-100 text-orange-700" },
  INSPECTION: { label: "Vistoria", color: "bg-cyan-100 text-cyan-700" },
  OTHER: { label: "Outro", color: "bg-gray-100 text-gray-700" },
}

export default async function TaskDetailPage({ params }: Props) {
  const task = await getTask(params.id)

  if (!task) {
    notFound()
  }

  const status = statusMap[task.status]
  const type = typeMap[task.type]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{task.title}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className={`text-sm px-2 py-0.5 rounded ${type.color}`}>
                {type.label}
              </span>
            </div>
            <div className="flex items-center text-muted-foreground mt-1">
              <Building2 className="h-4 w-4 mr-1" />
              {task.property.name}
            </div>
          </div>
        </div>
        <TaskActions
          taskId={task.id}
          currentStatus={task.status}
          taskTitle={task.title}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes da Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Data Agendada</p>
                <p className="text-xl font-bold">
                  {format(new Date(task.scheduledDate), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              {task.completedAt && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Concluida em</p>
                  <p className="text-xl font-bold">
                    {format(new Date(task.completedAt), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {task.description && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Descricao
                  </h4>
                  <p className="text-muted-foreground">{task.description}</p>
                </div>
              </>
            )}

            {task.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Observacoes</h4>
                  <p className="text-sm text-muted-foreground">{task.notes}</p>
                </div>
              </>
            )}

            {task.checklist && task.checklist.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Checklist</h4>
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Imovel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{task.property.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {task.property.city}, {task.property.state}
              </p>
              <Button variant="link" className="px-0 mt-2" asChild>
                <Link href={`/properties/${task.property.id}`}>
                  Ver imovel
                </Link>
              </Button>
            </CardContent>
          </Card>

          {task.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsavel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{task.assignedTo.name}</p>
              </CardContent>
            </Card>
          )}

          {task.reservation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Reserva Vinculada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{task.reservation.guestName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(task.reservation.checkinDate), "dd/MM")} - {format(new Date(task.reservation.checkoutDate), "dd/MM/yyyy")}
                </p>
                <Button variant="link" className="px-0 mt-2" asChild>
                  <Link href={`/reservations/${task.reservation.id}`}>
                    Ver reserva
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Informacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criada em</span>
                <span>{format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizada em</span>
                <span>{format(new Date(task.updatedAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
