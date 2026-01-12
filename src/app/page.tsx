import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Building2, Calendar, DollarSign, Users, CheckCircle, ArrowRight } from "lucide-react"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">StayFlow</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-white/90 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Gestao inteligente de imoveis de temporada
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Simplifique a administracao dos seus imoveis de short-stay.
              Controle reservas, financas e tarefas em uma unica plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Comecar agora
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border-2 border-white/30 bg-white/10 backdrop-blur px-6 py-3 text-lg font-medium text-white hover:bg-white/20 transition-colors"
              >
                Ja tenho conta
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que voce precisa em um so lugar
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gerencie multiplos imoveis, acompanhe reservas e mantenha suas financas organizadas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Gestao de Imoveis</h4>
              <p className="text-muted-foreground">
                Cadastre e gerencie todos os seus imoveis com informacoes detalhadas e fotos
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Calendario Integrado</h4>
              <p className="text-muted-foreground">
                Visualize reservas e disponibilidade em tempo real com sincronizacao iCal
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Controle Financeiro</h4>
              <p className="text-muted-foreground">
                Acompanhe receitas, despesas e gere repasses automaticos para proprietarios
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Multi-proprietarios</h4>
              <p className="text-muted-foreground">
                Gerencie imoveis de varios proprietarios com relatorios individualizados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher o StayFlow?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold">Economize tempo</h5>
                    <p className="text-muted-foreground">Automatize tarefas repetitivas e foque no que importa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold">Evite conflitos de reserva</h5>
                    <p className="text-muted-foreground">Calendario unificado com bloqueios automaticos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold">Transparencia financeira</h5>
                    <p className="text-muted-foreground">Relatorios detalhados para voce e seus proprietarios</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold">Acesso de qualquer lugar</h5>
                    <p className="text-muted-foreground">Plataforma 100% online e responsiva</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div
                className="aspect-video rounded-xl bg-cover bg-center shadow-2xl"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop')",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para simplificar sua gestao?
          </h3>
          <p className="text-xl opacity-90 mb-8">
            Crie sua conta gratuitamente e comece a gerenciar seus imoveis hoje mesmo
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-8 py-4 text-lg font-medium text-primary hover:bg-white/90 transition-colors"
          >
            Criar conta gratuita
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            StayFlow - Gestao de imoveis de curta temporada
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
