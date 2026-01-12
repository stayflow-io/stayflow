# StayFlow

Plataforma SaaS para administradoras de imoveis de curta temporada (short-stay). O sistema centraliza a gestao de reservas, sincronizacao com OTAs (Airbnb, Booking, etc.), operacoes de limpeza/manutencao, comunicacao com hospedes e financeiro com repasse a proprietarios.

## Stack Tecnologico

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon)
- **Auth**: Auth.js (NextAuth v5)
- **Validacao**: Zod
- **UI**: Tailwind CSS, shadcn/ui
- **Graficos**: Recharts
- **Exportacao**: xlsx

## Funcionalidades Implementadas

### Dashboard
- Visao geral com metricas principais (imoveis, reservas, receita)
- Alertas de check-ins/check-outs do dia
- Alertas de tarefas atrasadas e repasses pendentes
- Graficos de receita mensal, ocupacao por imovel e reservas por status
- Proximos check-ins e tarefas do dia

### Imoveis
- CRUD completo de imoveis
- Upload de fotos com drag-and-drop para reordenar
- Vinculo com proprietarios
- Configuracao de taxas (limpeza, administracao)
- Exportacao de calendario iCal
- Filtros por status e proprietario
- Paginacao

### Reservas
- CRUD completo de reservas
- Fluxo de status (Pendente -> Confirmada -> Check-in -> Check-out)
- Historico de eventos da reserva
- Criacao automatica de tarefa de limpeza apos check-out
- Filtros por status e imovel
- Paginacao

### Tarefas
- CRUD completo de tarefas
- Tipos: Limpeza, Manutencao, Vistoria, Outro
- Status: Pendente, Em Andamento, Concluida, Cancelada
- Atribuicao a usuarios
- Filtros por status, tipo e imovel
- Paginacao

### Financeiro
- Registro de transacoes (receitas e despesas)
- Resumo mensal (receita, despesas, lucro liquido)
- Repasses para proprietarios com calculo automatico
- Exportacao de relatorios (Excel/CSV)

### Proprietarios
- CRUD completo de proprietarios
- Configuracao de comissao
- Dados bancarios e PIX
- Historico de repasses

### Calendario
- Visualizacao mensal de reservas
- Filtro por imovel
- Navegacao entre meses

### Busca Global
- Busca unificada de imoveis, reservas, proprietarios e tarefas
- Acesso rapido via header

### Relatorios
- Exportacao de reservas (Excel/CSV)
- Exportacao financeira (Excel/CSV)
- Filtros por periodo

### Usuarios e Permissoes
- Gerenciamento de usuarios (apenas admins)
- Niveis de acesso: Admin, Gerente, Operador
- Sistema de permissoes por funcao

### Logs de Atividade
- Historico de acoes no sistema
- Registro de usuario, acao, entidade e timestamp
- Visivel apenas para admins

## Estrutura do Projeto

```
src/
├── actions/              # Server Actions
│   ├── dashboard.ts      # Dados do dashboard e graficos
│   ├── financial.ts      # Transacoes financeiras
│   ├── owners.ts         # CRUD de proprietarios
│   ├── payouts.ts        # Repasses para proprietarios
│   ├── photos.ts         # Upload de fotos
│   ├── properties.ts     # CRUD de imoveis
│   ├── reservations.ts   # CRUD de reservas
│   ├── search.ts         # Busca global
│   ├── tasks.ts          # CRUD de tarefas
│   └── users.ts          # CRUD de usuarios
├── app/
│   ├── (auth)/           # Paginas de autenticacao
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Paginas do sistema
│   │   ├── calendar/     # Visualizacao de calendario
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── financial/    # Financeiro e repasses
│   │   ├── owners/       # Proprietarios
│   │   ├── properties/   # Imoveis
│   │   ├── reports/      # Exportacao de relatorios
│   │   ├── reservations/ # Reservas
│   │   ├── settings/     # Configuracoes e usuarios
│   │   └── tasks/        # Tarefas
│   └── api/              # API Routes
│       ├── auth/         # NextAuth endpoints
│       ├── export/       # Exportacao de relatorios
│       │   ├── financial/
│       │   └── reservations/
│       └── ical/         # Feed iCal
├── components/
│   ├── auth/             # PermissionGate
│   ├── charts/           # Graficos (receita, ocupacao, status)
│   ├── layout/           # Sidebar, Header, GlobalSearch
│   ├── property/         # PhotoUpload, ICalLink
│   └── ui/               # Componentes shadcn/ui
├── hooks/
│   └── use-debounce.ts   # Hook de debounce
├── lib/
│   ├── activity-log.ts   # Sistema de logs
│   ├── auth.ts           # Configuracao NextAuth
│   ├── permissions.ts    # Sistema de permissoes
│   ├── prisma.ts         # Cliente Prisma
│   ├── utils.ts          # Utilitarios
│   └── validations/      # Schemas Zod
│       ├── owner.ts
│       ├── property.ts
│       ├── reservation.ts
│       └── task.ts
└── types/
    └── next-auth.d.ts    # Tipos do NextAuth
```

## Instalacao

### Pre-requisitos

- Node.js 18+
- PostgreSQL 15+ (ou Neon)

### Setup

1. **Clonar repositorio**
   ```bash
   git clone <repo-url>
   cd stayflow
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variaveis de ambiente**
   ```bash
   cp .env.example .env
   ```

   Preencha as variaveis:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="seu-secret-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Configurar banco de dados**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Popular com dados de teste (opcional)**
   ```bash
   npx prisma db seed
   ```

6. **Rodar desenvolvimento**
   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000)

## Credenciais de Teste

Apos executar o seed:

| Usuario | Email | Senha |
|---------|-------|-------|
| Admin | admin@stayflow.com | 123456 |
| Gerente | gerente@stayflow.com | 123456 |
| Operador | operador@stayflow.com | 123456 |

## Niveis de Acesso

| Funcionalidade | Admin | Gerente | Operador |
|----------------|-------|---------|----------|
| Dashboard | Total | Total | Limitado |
| Imoveis | CRUD | CRUD | Leitura |
| Reservas | CRUD | CRUD | CRUD |
| Tarefas | CRUD | CRUD | CRUD |
| Financeiro | Total | Total | - |
| Proprietarios | CRUD | CRUD | Leitura |
| Usuarios | CRUD | - | - |
| Relatorios | Total | Total | - |
| Configuracoes | Total | Leitura | Leitura |
| Logs | Total | - | - |

## Integracao iCal

Cada imovel possui um feed iCal que pode ser sincronizado com:
- Google Calendar
- Apple Calendar
- Outlook
- Qualquer aplicativo compativel com iCal

**URL do Feed:** `/api/ical/[propertyId]`

### Como usar

1. Acesse a pagina de detalhes do imovel
2. Clique em "Exportar Calendario (iCal)"
3. Copie o link ou adicione diretamente ao seu calendario

## Exportacao de Dados

### API de Reservas
```
GET /api/export/reservations?format=xlsx&startDate=2024-01-01&endDate=2024-12-31
```

### API Financeira
```
GET /api/export/financial?format=csv&startDate=2024-01-01&endDate=2024-12-31
```

**Formatos suportados:** `xlsx`, `csv`

**Parametros:**
- `format`: Formato do arquivo (xlsx ou csv)
- `startDate`: Data inicial (opcional)
- `endDate`: Data final (opcional)

## Comandos

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de producao
npm run start            # Iniciar em producao
npm run lint             # Verificar codigo

# Prisma
npx prisma generate      # Gerar Prisma Client
npx prisma db push       # Aplicar schema ao banco
npx prisma studio        # Abrir Prisma Studio (GUI)
npx prisma db seed       # Popular com dados de teste
npx prisma migrate dev   # Criar migracao
```

## Modelos do Banco de Dados

### Principais Entidades

- **Tenant**: Empresa/conta (multitenancy)
- **User**: Usuarios do sistema
- **Owner**: Proprietarios dos imoveis
- **Property**: Imoveis para aluguel
- **Reservation**: Reservas de hospedes
- **Task**: Tarefas de limpeza/manutencao
- **Transaction**: Transacoes financeiras
- **OwnerPayout**: Repasses para proprietarios
- **ActivityLog**: Logs de atividade

### Relacionamentos

```
Tenant
  └── Users
  └── Owners
        └── Properties
              └── Photos
              └── Reservations
                    └── Events
              └── Tasks
              └── Transactions
        └── Payouts
  └── ActivityLogs
```

## Proximas Funcionalidades

- [ ] Integracao Airbnb (API oficial)
- [ ] Integracao Booking.com
- [ ] Mensagens automaticas WhatsApp
- [ ] Precificacao dinamica
- [ ] App mobile (PWA)
- [ ] Notificacoes push
- [ ] Integracao com gateways de pagamento

## Licenca

Proprietario - Todos os direitos reservados.
