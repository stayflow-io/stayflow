import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, User, Building2, Calendar, ClipboardList, DollarSign } from "lucide-react"
import { getActivityLogs } from "@/lib/activity-log"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const actionLabels: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Criou", color: "bg-green-100 text-green-700" },
  UPDATE: { label: "Atualizou", color: "bg-blue-100 text-blue-700" },
  DELETE: { label: "Excluiu", color: "bg-red-100 text-red-700" },
  LOGIN: { label: "Login", color: "bg-purple-100 text-purple-700" },
  STATUS_CHANGE: { label: "Alterou status", color: "bg-yellow-100 text-yellow-700" },
}

const entityLabels: Record<string, { label: string; icon: typeof Activity }> = {
  property: { label: "Imovel", icon: Building2 },
  reservation: { label: "Reserva", icon: Calendar },
  task: { label: "Tarefa", icon: ClipboardList },
  transaction: { label: "Transacao", icon: DollarSign },
  user: { label: "Usuario", icon: User },
}

interface Props {
  searchParams: { page?: string }
}

export default async function ActivityLogPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const page = Number(searchParams.page) || 1
  const { items: logs, pagination } = await getActivityLogs({ page })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logs de Atividade</h1>
        <p className="text-muted-foreground">
          Historico de acoes realizadas no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            Mostrando {logs.length} de {pagination.totalItems} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma atividade registrada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const action = actionLabels[log.action] || { label: log.action, color: "bg-gray-100 text-gray-700" }
                const entity = entityLabels[log.entityType] || { label: log.entityType, icon: Activity }
                const EntityIcon = entity.icon

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="p-2 bg-muted rounded-lg">
                      <EntityIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {log.user?.name || "Sistema"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${action.color}`}>
                          {action.label}
                        </span>
                        <span className="text-muted-foreground">
                          {entity.label}
                        </span>
                      </div>
                      {log.metadata && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof log.metadata === "object"
                            ? JSON.stringify(log.metadata)
                            : log.metadata}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(log.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                        {log.ipAddress && log.ipAddress !== "unknown" && (
                          <span className="ml-2">IP: {log.ipAddress}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
