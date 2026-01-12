import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Users, Mail, Phone, Crown, User, Shield, Settings2, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getSettingsData(tenantId: string) {
  const [tenant, users] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return { tenant, users }
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  OPERATOR: "Operador",
  OWNER: "Proprietario",
}

const planLabels: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "bg-gray-100 text-gray-700" },
  professional: { label: "Professional", color: "bg-blue-100 text-blue-700" },
  enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-700" },
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) return null

  const { tenant, users } = await getSettingsData(session.user.tenantId)

  if (!tenant) return null

  const plan = planLabels[tenant.plan] || planLabels.starter

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie as configuracoes da sua conta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Perfil da Empresa
              </CardTitle>
              <span className={`text-xs px-2 py-1 rounded-full ${plan.color}`}>
                {plan.label}
              </span>
            </div>
            <CardDescription>
              Informacoes da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome da Empresa</p>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Identificador</p>
              <p className="font-medium">{tenant.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membro desde</p>
              <p className="font-medium">
                {new Date(tenant.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Minha Conta
            </CardTitle>
            <CardDescription>
              Suas informacoes de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p>{session.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{roleLabels[session.user.role] || session.user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios da Equipe
                </CardTitle>
                <CardDescription>
                  Membros com acesso ao sistema
                </CardDescription>
              </div>
              {session.user.role === "ADMIN" && (
                <Button asChild>
                  <Link href="/settings/users">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.id === session.user.id && (
                          <span className="text-xs text-muted-foreground">(voce)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.phone && (
                      <span className="text-sm text-muted-foreground hidden md:block">
                        {user.phone}
                      </span>
                    )}
                    <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integracoes</CardTitle>
            <CardDescription>
              Conecte com plataformas de reserva
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs">A</span>
                </div>
                <span className="font-medium">Airbnb</span>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">B</span>
                </div>
                <span className="font-medium">Booking.com</span>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-xs">E</span>
                </div>
                <span className="font-medium">Expedia</span>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificacoes</CardTitle>
            <CardDescription>
              Configure alertas e lembretes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email de check-in</p>
                <p className="text-sm text-muted-foreground">Lembrete 1 dia antes</p>
              </div>
              <Badge>Ativo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email de check-out</p>
                <p className="text-sm text-muted-foreground">Lembrete no dia</p>
              </div>
              <Badge>Ativo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tarefa pendente</p>
                <p className="text-sm text-muted-foreground">Alerta diario</p>
              </div>
              <Badge variant="outline">Inativo</Badge>
            </div>
          </CardContent>
        </Card>

        {session.user.role === "ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Logs de Atividade
              </CardTitle>
              <CardDescription>
                Historico de acoes no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/settings/activity">
                  Ver Historico Completo
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
