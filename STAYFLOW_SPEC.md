# StayFlow - Especificação Técnica

## Visão Geral

**StayFlow** é uma plataforma SaaS para administradoras de imóveis de curta temporada (short-stay). O sistema centraliza a gestão de reservas, sincronização com OTAs (Airbnb, Booking, etc.), operações de limpeza/manutenção, comunicação com hóspedes e financeiro com repasse a proprietários.

---

## Stack Tecnológico

### Core (Full-Stack)
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Auth**: Auth.js (NextAuth v5)
- **Validação**: Zod

### Frontend
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (server state) + Zustand (client state)
- **Forms**: React Hook Form + Zod
- **Calendário**: react-big-calendar ou FullCalendar

### Backend (dentro do Next.js)
- **API**: Server Actions + Route Handlers
- **Jobs**: Trigger.dev ou Inngest (background jobs)
- **Queue**: Upstash Redis (se precisar de filas simples)

### Infraestrutura
- **Deploy**: Vercel (MVP) → Kubernetes (escala)
- **Database**: Neon ou Supabase (PostgreSQL serverless)
- **Storage**: Cloudflare R2 ou Uploadthing
- **CI/CD**: GitHub Actions

### Integrações
- **Channel Manager**: APIs do Airbnb, Booking.com (via Hostaway API ou direto)
- **Pagamentos**: Stripe ou Pagar.me
- **Comunicação**: Twilio (WhatsApp), Resend (email)

### Mobile (Fase 2+)
- **PWA**: next-pwa (primeiro passo)
- **App Nativo**: Expo / React Native (quando validar)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    App Router (RSC)                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ Dashboard   │  │ Reservas    │  │ Portal Owner    │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Server Actions + Route Handlers              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │  Auth    │ │Properties│ │Reservas  │ │Financial │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Prisma ORM                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │ PostgreSQL  │ │   Redis     │ │ Trigger.dev │
      │   (Neon)    │ │  (Upstash)  │ │   (Jobs)    │
      └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Estrutura de Pastas

```
stayflow/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + Header
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx            # Lista
│   │   │   │   ├── new/page.tsx        # Criar
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Detalhes
│   │   │   │       └── edit/page.tsx   # Editar
│   │   │   ├── reservations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx
│   │   │   ├── financial/
│   │   │   │   ├── page.tsx
│   │   │   │   └── reports/page.tsx
│   │   │   ├── owners/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── owner/                      # Portal do Proprietário
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── reports/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── airbnb/route.ts
│   │   │   │   └── booking/route.ts
│   │   │   └── cron/
│   │   │       └── sync-calendars/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── actions/                        # Server Actions
│   │   ├── auth.ts
│   │   ├── properties.ts
│   │   ├── reservations.ts
│   │   ├── calendar.ts
│   │   ├── tasks.ts
│   │   ├── financial.ts
│   │   └── owners.ts
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── forms/
│   │   │   ├── property-form.tsx
│   │   │   ├── reservation-form.tsx
│   │   │   └── task-form.tsx
│   │   ├── tables/
│   │   │   ├── properties-table.tsx
│   │   │   └── reservations-table.tsx
│   │   ├── calendar/
│   │   │   └── booking-calendar.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       ├── header.tsx
│   │       └── mobile-nav.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma client
│   │   ├── auth.ts                     # Auth.js config
│   │   ├── validations/                # Zod schemas
│   │   │   ├── property.ts
│   │   │   ├── reservation.ts
│   │   │   └── task.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-properties.ts
│   │   ├── use-reservations.ts
│   │   └── use-calendar.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── jobs/                           # Trigger.dev jobs
│       ├── sync-calendar.ts
│       ├── send-guest-message.ts
│       └── generate-owner-report.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   ├── manifest.json                   # PWA
│   └── icons/
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Schema do Banco (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== MULTITENANCY ====================

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      String   @default("starter")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users        User[]
  properties   Property[]
  owners       Owner[]
  reservations Reservation[]
  tasks        Task[]
  transactions Transaction[]
  templates    MessageTemplate[]
}

model User {
  id           String    @id @default(cuid())
  tenantId     String
  email        String    @unique
  name         String
  passwordHash String
  role         UserRole  @default(OPERATOR)
  phone        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  tasks        Task[]
  transactions Transaction[]
  owner        Owner?
}

enum UserRole {
  ADMIN
  MANAGER
  OPERATOR
  OWNER
}

// ==================== PROPERTIES ====================

model Owner {
  id                String    @id @default(cuid())
  tenantId          String
  userId            String?   @unique
  name              String
  email             String
  phone             String?
  document          String?   // CPF/CNPJ
  pixKey            String?
  bankAccount       Json?     // { bank, agency, account }
  commissionPercent Decimal   @default(20)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  tenant     Tenant     @relation(fields: [tenantId], references: [id])
  user       User?      @relation(fields: [userId], references: [id])
  properties Property[]
  payouts    OwnerPayout[]
}

model Property {
  id              String         @id @default(cuid())
  tenantId        String
  ownerId         String
  name            String
  address         String
  city            String
  state           String
  zipcode         String?
  bedrooms        Int
  bathrooms       Int
  maxGuests       Int
  description     String?
  amenities       String[]
  cleaningFee     Decimal        @default(0)
  adminFeePercent Decimal        @default(20)
  status          PropertyStatus @default(ACTIVE)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?

  tenant         Tenant            @relation(fields: [tenantId], references: [id])
  owner          Owner             @relation(fields: [ownerId], references: [id])
  photos         PropertyPhoto[]
  channels       PropertyChannel[]
  reservations   Reservation[]
  calendarBlocks CalendarBlock[]
  tasks          Task[]
  transactions   Transaction[]
}

enum PropertyStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
}

model PropertyPhoto {
  id         String   @id @default(cuid())
  propertyId String
  url        String
  order      Int      @default(0)
  createdAt  DateTime @default(now())

  property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
}

// ==================== CHANNEL MANAGER ====================

model Channel {
  id         String @id @default(cuid())
  name       String @unique // airbnb, booking, expedia
  apiBaseUrl String
  active     Boolean @default(true)

  propertyChannels PropertyChannel[]
  reservations     Reservation[]
}

model PropertyChannel {
  id                String   @id @default(cuid())
  propertyId        String
  channelId         String
  externalListingId String
  syncEnabled       Boolean  @default(true)
  credentials       Json?    // Encrypted
  lastSyncAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  property Property @relation(fields: [propertyId], references: [id])
  channel  Channel  @relation(fields: [channelId], references: [id])

  @@unique([propertyId, channelId])
}

model CalendarBlock {
  id         String   @id @default(cuid())
  propertyId String
  startDate  DateTime
  endDate    DateTime
  reason     String?
  createdAt  DateTime @default(now())

  property Property @relation(fields: [propertyId], references: [id])
}

// ==================== RESERVATIONS ====================

model Reservation {
  id                    String            @id @default(cuid())
  tenantId              String
  propertyId            String
  channelId             String?
  externalReservationId String?
  guestName             String
  guestEmail            String?
  guestPhone            String?
  checkinDate           DateTime
  checkoutDate          DateTime
  numGuests             Int
  totalAmount           Decimal
  channelFee            Decimal           @default(0)
  cleaningFee           Decimal           @default(0)
  netAmount             Decimal
  status                ReservationStatus @default(CONFIRMED)
  notes                 String?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  tenant       Tenant             @relation(fields: [tenantId], references: [id])
  property     Property           @relation(fields: [propertyId], references: [id])
  channel      Channel?           @relation(fields: [channelId], references: [id])
  events       ReservationEvent[]
  tasks        Task[]
  transactions Transaction[]
  messages     MessageLog[]
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

model ReservationEvent {
  id            String   @id @default(cuid())
  reservationId String
  eventType     String
  payload       Json?
  createdAt     DateTime @default(now())
  createdBy     String?

  reservation Reservation @relation(fields: [reservationId], references: [id])
}

// ==================== OPERATIONS ====================

model Task {
  id            String     @id @default(cuid())
  tenantId      String
  propertyId    String
  reservationId String?
  type          TaskType
  title         String
  description   String?
  assignedToId  String?
  status        TaskStatus @default(PENDING)
  scheduledDate DateTime
  completedAt   DateTime?
  notes         String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  tenant      Tenant          @relation(fields: [tenantId], references: [id])
  property    Property        @relation(fields: [propertyId], references: [id])
  reservation Reservation?    @relation(fields: [reservationId], references: [id])
  assignedTo  User?           @relation(fields: [assignedToId], references: [id])
  checklist   TaskChecklist[]
}

enum TaskType {
  CLEANING
  MAINTENANCE
  INSPECTION
  OTHER
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model TaskChecklist {
  id       String  @id @default(cuid())
  taskId   String
  item     String
  checked  Boolean @default(false)
  photoUrl String?

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

// ==================== COMMUNICATION ====================

model MessageTemplate {
  id          String         @id @default(cuid())
  tenantId    String
  name        String
  channel     MessageChannel
  triggerType MessageTrigger
  triggerDays Int            @default(0)
  subject     String?
  body        String
  active      Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  tenant Tenant       @relation(fields: [tenantId], references: [id])
  logs   MessageLog[]
}

enum MessageChannel {
  EMAIL
  WHATSAPP
  SMS
}

enum MessageTrigger {
  BOOKING_CONFIRMED
  BEFORE_CHECKIN
  ON_CHECKIN
  ON_CHECKOUT
  AFTER_CHECKOUT
}

model MessageLog {
  id            String        @id @default(cuid())
  reservationId String
  templateId    String?
  channel       MessageChannel
  recipient     String
  subject       String?
  body          String
  status        MessageStatus
  sentAt        DateTime?
  error         String?
  createdAt     DateTime      @default(now())

  reservation Reservation      @relation(fields: [reservationId], references: [id])
  template    MessageTemplate? @relation(fields: [templateId], references: [id])
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}

// ==================== FINANCIAL ====================

model Transaction {
  id            String          @id @default(cuid())
  tenantId      String
  propertyId    String
  reservationId String?
  type          TransactionType
  category      String
  amount        Decimal
  date          DateTime
  description   String?
  reconciled    Boolean         @default(false)
  createdById   String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  property    Property     @relation(fields: [propertyId], references: [id])
  reservation Reservation? @relation(fields: [reservationId], references: [id])
  createdBy   User?        @relation(fields: [createdById], references: [id])
}

enum TransactionType {
  INCOME
  EXPENSE
}

model OwnerPayout {
  id          String       @id @default(cuid())
  ownerId     String
  periodStart DateTime
  periodEnd   DateTime
  grossAmount Decimal
  expenses    Decimal
  adminFee    Decimal
  netAmount   Decimal
  status      PayoutStatus @default(PENDING)
  paidAt      DateTime?
  receiptUrl  String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  owner Owner @relation(fields: [ownerId], references: [id])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

---

## Server Actions (Exemplos)

### Properties

```typescript
// src/actions/properties.ts
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { propertySchema } from "@/lib/validations/property"
import { revalidatePath } from "next/cache"

export async function createProperty(data: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const validated = propertySchema.parse({
    name: data.get("name"),
    ownerId: data.get("ownerId"),
    address: data.get("address"),
    city: data.get("city"),
    state: data.get("state"),
    bedrooms: Number(data.get("bedrooms")),
    bathrooms: Number(data.get("bathrooms")),
    maxGuests: Number(data.get("maxGuests")),
    cleaningFee: Number(data.get("cleaningFee")),
  })

  const property = await prisma.property.create({
    data: {
      ...validated,
      tenantId: session.user.tenantId,
    },
  })

  revalidatePath("/properties")
  return { success: true, id: property.id }
}

export async function getProperties() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.property.findMany({
    where: {
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    include: {
      owner: true,
      photos: { orderBy: { order: "asc" }, take: 1 },
      _count: { select: { reservations: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteProperty(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.property.update({
    where: { id, tenantId: session.user.tenantId },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/properties")
  return { success: true }
}
```

### Reservations

```typescript
// src/actions/reservations.ts
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getReservations(filters?: {
  status?: string
  propertyId?: string
  startDate?: Date
  endDate?: Date
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.propertyId && { propertyId: filters.propertyId }),
      ...(filters?.startDate && { checkinDate: { gte: filters.startDate } }),
      ...(filters?.endDate && { checkoutDate: { lte: filters.endDate } }),
    },
    include: {
      property: true,
      channel: true,
    },
    orderBy: { checkinDate: "asc" },
  })
}

export async function updateReservationStatus(
  id: string,
  status: string
) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const reservation = await prisma.reservation.update({
    where: { id, tenantId: session.user.tenantId },
    data: { status: status as any },
  })

  // Log event
  await prisma.reservationEvent.create({
    data: {
      reservationId: id,
      eventType: "STATUS_CHANGED",
      payload: { newStatus: status },
      createdBy: session.user.id,
    },
  })

  // Auto-create cleaning task on checkout
  if (status === "CHECKED_OUT") {
    await prisma.task.create({
      data: {
        tenantId: session.user.tenantId,
        propertyId: reservation.propertyId,
        reservationId: id,
        type: "CLEANING",
        title: `Limpeza pós-checkout`,
        scheduledDate: new Date(),
      },
    })
  }

  revalidatePath("/reservations")
  return { success: true }
}
```

---

## Rotas API (Webhooks)

```typescript
// src/app/api/webhooks/airbnb/route.ts

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const signature = headers().get("x-airbnb-signature")

  // TODO: Validar signature

  const { event_type, reservation } = body

  if (event_type === "reservation_created") {
    // Buscar property pelo external listing id
    const propertyChannel = await prisma.propertyChannel.findFirst({
      where: { externalListingId: reservation.listing_id },
      include: { property: true },
    })

    if (!propertyChannel) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Criar reserva
    await prisma.reservation.create({
      data: {
        tenantId: propertyChannel.property.tenantId,
        propertyId: propertyChannel.propertyId,
        channelId: propertyChannel.channelId,
        externalReservationId: reservation.id,
        guestName: reservation.guest.name,
        guestEmail: reservation.guest.email,
        guestPhone: reservation.guest.phone,
        checkinDate: new Date(reservation.checkin),
        checkoutDate: new Date(reservation.checkout),
        numGuests: reservation.guests,
        totalAmount: reservation.total,
        channelFee: reservation.host_fee,
        cleaningFee: reservation.cleaning_fee,
        netAmount: reservation.payout,
        status: "CONFIRMED",
      },
    })
  }

  return NextResponse.json({ received: true })
}
```

---

## Comandos para Iniciar (Claude Code)

```bash
# 1. Criar projeto
npx create-next-app@latest stayflow --typescript --tailwind --eslint --app --src-dir

cd stayflow

# 2. Instalar dependências
pnpm add prisma @prisma/client next-auth@beta
pnpm add zod react-hook-form @hookform/resolvers
pnpm add @tanstack/react-query zustand
pnpm add date-fns lucide-react

# 3. shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label table dialog form select badge

# 4. Prisma
npx prisma init
# Copiar schema acima para prisma/schema.prisma
npx prisma generate
npx prisma db push

# 5. Variáveis de ambiente
cp .env.example .env.local
# Configurar DATABASE_URL e NEXTAUTH_SECRET

# 6. Rodar
pnpm dev
```

---

## MVP Scope (Fase 1 - 6 semanas)

### Semana 1: Foundation
- [ ] Setup Next.js + Prisma + Auth.js
- [ ] Layout base (sidebar, header)
- [ ] CRUD de usuários e auth

### Semana 2: Properties
- [ ] CRUD completo de imóveis
- [ ] Upload de fotos (Uploadthing)
- [ ] CRUD de proprietários

### Semana 3: Reservations
- [ ] CRUD de reservas (manual)
- [ ] Calendário visual
- [ ] Mudança de status

### Semana 4: Operations
- [ ] Tasks de limpeza automáticas
- [ ] Lista de tarefas com filtros
- [ ] Marcar como concluída

### Semana 5: Financial
- [ ] Registro de transações
- [ ] Relatório por período
- [ ] Cálculo de repasse ao owner

### Semana 6: Polish
- [ ] Portal do proprietário (read-only)
- [ ] PWA básico
- [ ] Testes e2e críticos
- [ ] Deploy na Vercel

### Fase 2 (pós-MVP):
- Integração Airbnb API
- Integração Booking.com
- Mensagens automatizadas (WhatsApp)
- Precificação dinâmica
- App mobile com Expo

---

## Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/stayflow"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Storage
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# Email
RESEND_API_KEY=

# WhatsApp (Twilio) - Fase 2
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# Channels - Fase 2
AIRBNB_CLIENT_ID=
AIRBNB_CLIENT_SECRET=
```

---

## Notas para o Claude Code

1. **Next.js App Router**: Use Server Components por padrão, Client Components só quando necessário (interatividade)
2. **Server Actions**: Prefira Server Actions para mutações ao invés de API Routes
3. **Zod everywhere**: Validação no client (forms) e server (actions)
4. **Multi-tenant desde o início**: Sempre filtrar por `tenantId` nas queries
5. **Soft delete**: Use `deletedAt` ao invés de deletar registros
6. **Tipagem forte**: Infira tipos do Prisma, evite `any`
7. **shadcn/ui**: Use os componentes prontos, não reinvente
8. **PWA ready**: Configure `next-pwa` desde o início para facilitar mobile depois

---

## Exemplo de Comando para Claude Code

```
Leia o arquivo STAYFLOW_SPEC.md e:
1. Crie a estrutura de pastas conforme especificado
2. Configure o Prisma com o schema fornecido
3. Implemente o Auth.js com login por email/senha
4. Crie o layout base com sidebar usando shadcn/ui
5. Implemente o CRUD de properties com Server Actions
```

---

*Documento atualizado para Next.js full-stack. Stack simplificada, pronta para evoluir para PWA e depois app nativo com Expo.*
