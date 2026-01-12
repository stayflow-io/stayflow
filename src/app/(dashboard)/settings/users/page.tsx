import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Mail, Shield } from "lucide-react"
import { getUsers } from "@/actions/users"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const roleMap = {
  ADMIN: { label: "Administrador", variant: "default" as const, color: "bg-purple-100 text-purple-700" },
  MANAGER: { label: "Gerente", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
  OPERATOR: { label: "Operador", variant: "outline" as const, color: "bg-gray-100 text-gray-700" },
}

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gerencie os usuarios da sua equipe
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuario
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const role = roleMap[user.role]
          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${role.color}`}>
                        {role.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/settings/users/${user.id}/edit`}>
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Niveis de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className={`px-2 py-1 rounded ${roleMap.ADMIN.color}`}>Administrador</span>
            <p className="text-muted-foreground">Acesso total ao sistema, incluindo gerenciamento de usuarios e configuracoes.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className={`px-2 py-1 rounded ${roleMap.MANAGER.color}`}>Gerente</span>
            <p className="text-muted-foreground">Pode gerenciar imoveis, reservas, tarefas e financeiro. Nao pode gerenciar usuarios.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className={`px-2 py-1 rounded ${roleMap.OPERATOR.color}`}>Operador</span>
            <p className="text-muted-foreground">Pode visualizar e atualizar reservas e tarefas atribuidas. Acesso limitado.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
