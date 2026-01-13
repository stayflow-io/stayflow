import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

// Helpers
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Data
const firstNames = [
  "Pedro", "Ana", "Carlos", "Maria", "Joao", "Fernanda", "Ricardo", "Julia",
  "Marcos", "Camila", "Lucas", "Beatriz", "Rafael", "Larissa", "Bruno", "Amanda",
  "Felipe", "Patricia", "Rodrigo", "Isabela", "Gustavo", "Mariana", "Diego", "Leticia",
  "Leonardo", "Gabriela", "Thiago", "Natalia", "Andre", "Carolina"
]

const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Rodrigues", "Almeida",
  "Lima", "Ferreira", "Gomes", "Martins", "Araujo", "Ribeiro", "Carvalho", "Lopes",
  "Nascimento", "Moreira", "Barbosa", "Cardoso"
]

const cities = [
  { city: "Rio de Janeiro", state: "RJ", neighborhoods: ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca", "Botafogo", "Flamengo", "Lapa", "Santa Teresa"] },
  { city: "Sao Paulo", state: "SP", neighborhoods: ["Jardins", "Pinheiros", "Vila Madalena", "Moema", "Itaim Bibi", "Brooklin", "Paulista", "Consolacao"] },
  { city: "Florianopolis", state: "SC", neighborhoods: ["Jurere", "Canasvieiras", "Lagoa da Conceicao", "Centro", "Campeche", "Ingleses"] },
  { city: "Salvador", state: "BA", neighborhoods: ["Barra", "Rio Vermelho", "Pelourinho", "Ondina", "Pituba", "Itapua"] },
  { city: "Fortaleza", state: "CE", neighborhoods: ["Meireles", "Aldeota", "Praia de Iracema", "Mucuripe", "Varjota"] },
  { city: "Gramado", state: "RS", neighborhoods: ["Centro", "Bavaria", "Planalto", "Floresta", "Carniel"] },
  { city: "Buzios", state: "RJ", neighborhoods: ["Centro", "Geriba", "Ferradura", "Joao Fernandes", "Manguinhos"] },
  { city: "Paraty", state: "RJ", neighborhoods: ["Centro Historico", "Jabaquara", "Cabore", "Pontal"] },
]

const propertyTypes = [
  { prefix: "Apartamento", bedrooms: [1, 2, 3], bathrooms: [1, 2], maxGuests: [2, 4, 6] },
  { prefix: "Studio", bedrooms: [1], bathrooms: [1], maxGuests: [2, 3] },
  { prefix: "Casa", bedrooms: [3, 4, 5], bathrooms: [2, 3, 4], maxGuests: [6, 8, 10, 12] },
  { prefix: "Flat", bedrooms: [1, 2], bathrooms: [1, 2], maxGuests: [2, 4] },
  { prefix: "Cobertura", bedrooms: [3, 4], bathrooms: [2, 3], maxGuests: [6, 8] },
  { prefix: "Loft", bedrooms: [1], bathrooms: [1], maxGuests: [2, 4] },
  { prefix: "Chale", bedrooms: [2, 3], bathrooms: [1, 2], maxGuests: [4, 6] },
]

const amenitiesList = [
  "wifi", "ar-condicionado", "tv", "cozinha equipada", "maquina de lavar",
  "secadora", "ferro de passar", "varanda", "churrasqueira", "piscina",
  "academia", "estacionamento", "elevador", "portaria 24h", "pet friendly",
  "vista mar", "vista montanha", "lareira", "banheira", "sauna"
]

const taskTitles = {
  CLEANING: ["Limpeza completa", "Troca de roupas de cama", "Limpeza profunda", "Higienizacao pos check-out", "Limpeza geral"],
  MAINTENANCE: ["Verificar vazamento", "Consertar ar-condicionado", "Trocar lampadas", "Reparar fechadura", "Desentupir ralo", "Verificar aquecedor", "Consertar torneira"],
  INSPECTION: ["Vistoria pre check-in", "Inspecao de rotina", "Verificar inventario", "Conferir estado geral"],
  OTHER: ["Entrega de chaves", "Receber hospede", "Reposicao de amenities", "Instalacao de equipamento"]
}

const expenseCategories = [
  "Limpeza", "Manutencao", "Condominio", "IPTU", "Internet",
  "Energia", "Agua", "Gas", "Material de limpeza", "Amenities",
  "Lavanderia", "Jardinagem", "Seguro", "Taxa de administracao"
]

async function main() {
  console.log("🗑️  Limpando dados existentes...")

  await prisma.activityLog.deleteMany()
  await prisma.messageLog.deleteMany()
  await prisma.messageTemplate.deleteMany()
  await prisma.reservationEvent.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.propertyPhoto.deleteMany()
  await prisma.propertyChannel.deleteMany()
  await prisma.calendarBlock.deleteMany()
  await prisma.taskChecklist.deleteMany()
  await prisma.task.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.ownerPayout.deleteMany()
  await prisma.property.deleteMany()
  await prisma.owner.deleteMany()
  await prisma.user.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.tenant.deleteMany()

  console.log("🏢 Criando tenant...")

  const tenant = await prisma.tenant.create({
    data: {
      name: "StayFlow Demo",
      slug: "demo",
      plan: "professional",
    },
  })

  console.log("👥 Criando usuarios...")

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@stayflow.com",
      name: "Carlos Administrador",
      passwordHash: await hash("123456", 10),
      role: "ADMIN",
      phone: "(11) 99999-0000",
    },
  })

  const gerente = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "gerente@stayflow.com",
      name: "Mariana Gerente",
      passwordHash: await hash("123456", 10),
      role: "MANAGER",
      phone: "(11) 99999-1111",
    },
  })

  const operador1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "operador@stayflow.com",
      name: "Lucas Operador",
      passwordHash: await hash("123456", 10),
      role: "OPERATOR",
      phone: "(11) 99999-2222",
    },
  })

  const operador2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "maria@stayflow.com",
      name: "Maria Silva",
      passwordHash: await hash("123456", 10),
      role: "OPERATOR",
      phone: "(11) 99999-3333",
    },
  })

  const operador3 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "joao@stayflow.com",
      name: "Joao Santos",
      passwordHash: await hash("123456", 10),
      role: "OPERATOR",
      phone: "(11) 99999-4444",
    },
  })

  const operadores = [operador1, operador2, operador3]
  const allUsers = [admin, gerente, ...operadores]

  console.log("📡 Criando canais...")

  const airbnb = await prisma.channel.create({
    data: { name: "Airbnb", apiBaseUrl: "https://api.airbnb.com", active: true },
  })
  const booking = await prisma.channel.create({
    data: { name: "Booking.com", apiBaseUrl: "https://api.booking.com", active: true },
  })
  const expedia = await prisma.channel.create({
    data: { name: "Expedia", apiBaseUrl: "https://api.expedia.com", active: true },
  })
  const vrbo = await prisma.channel.create({
    data: { name: "VRBO", apiBaseUrl: "https://api.vrbo.com", active: true },
  })

  const channels = [airbnb, booking, expedia, vrbo]

  console.log("🏠 Criando proprietarios...")

  // Criar usuário proprietário com login
  const ownerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "proprietario@stayflow.com",
      name: "Pedro Silva",
      passwordHash: await hash("123456", 10),
      role: "OWNER",
      phone: "(11) 99999-5555",
    },
  })

  const owners: Array<{ id: string; name: string }> = []

  // Primeiro proprietário vinculado ao usuário com login
  const firstOwner = await prisma.owner.create({
    data: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      name: "Pedro Silva",
      email: "proprietario@stayflow.com",
      phone: "(11) 99999-5555",
      document: "123.456.789-00",
      pixKey: "proprietario@stayflow.com",
      commissionPercent: 80,
    },
  })
  owners.push(firstOwner)

  // Demais proprietários sem login
  for (let i = 1; i < 10; i++) {
    const firstName = firstNames[i]
    const lastName = lastNames[i]
    const name = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`

    const owner = await prisma.owner.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        phone: `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        document: `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`,
        pixKey: Math.random() > 0.5 ? email : `${randomInt(11, 99)}9${randomInt(10000000, 99999999)}`,
        commissionPercent: randomItem([75, 80, 85]),
      },
    })
    owners.push(owner)
  }

  console.log("🏡 Criando imoveis...")

  const properties: Array<{ id: string; name: string; status: string; cleaningFee: any; maxGuests: number }> = []
  for (let i = 0; i < 20; i++) {
    const cityData = randomItem(cities)
    const neighborhood = randomItem(cityData.neighborhoods)
    const propType = randomItem(propertyTypes)
    const bedrooms = randomItem(propType.bedrooms)
    const bathrooms = randomItem(propType.bathrooms)
    const maxGuests = randomItem(propType.maxGuests)
    const owner = randomItem(owners)

    const suffixes = ["Vista Mar", "Completo", "Luxo", "Aconchegante", "Moderno", "Premium", "Reformado", "Central", "Exclusivo", "Charmoso"]
    const name = `${propType.prefix} ${neighborhood} ${randomItem(suffixes)}`

    const numAmenities = randomInt(5, 12)
    const amenities = [...amenitiesList].sort(() => Math.random() - 0.5).slice(0, numAmenities)

    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        ownerId: owner.id,
        name,
        address: `Rua ${randomItem(lastNames)}, ${randomInt(1, 2000)}${propType.prefix === "Casa" ? "" : `, Apto ${randomInt(101, 2505)}`}`,
        city: cityData.city,
        state: cityData.state,
        zipcode: `${randomInt(10000, 99999)}-${randomInt(100, 999)}`,
        bedrooms,
        bathrooms,
        maxGuests,
        description: `${propType.prefix} ${bedrooms > 1 ? `com ${bedrooms} quartos` : ""} em ${neighborhood}, ${cityData.city}. ${amenities.slice(0, 3).join(", ")} e muito mais.`,
        amenities,
        cleaningFee: randomItem([100, 120, 150, 180, 200, 250, 300, 350]),
        adminFeePercent: randomItem([15, 20, 25]),
        status: i < 18 ? "ACTIVE" : randomItem(["INACTIVE", "MAINTENANCE"]),
      },
    })
    properties.push(property)
  }

  const activeProperties = properties.filter((p) => p.status === "ACTIVE")

  console.log("📅 Criando reservas...")

  const today = new Date()
  today.setHours(14, 0, 0, 0)

  const reservationStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]

  const reservations: Array<{ id: string; propertyId: string; guestName: string; checkinDate: Date; totalAmount: any; status: string }> = []
  for (let i = 0; i < 40; i++) {
    const property = randomItem(activeProperties)
    const channel = Math.random() > 0.2 ? randomItem(channels) : null
    const firstName = randomItem(firstNames)
    const lastName = randomItem(lastNames)

    let checkinOffset: number
    let status: string

    if (i < 8) {
      checkinOffset = randomInt(-60, -15)
      status = "CHECKED_OUT"
    } else if (i < 12) {
      checkinOffset = randomInt(-5, -1)
      status = "CHECKED_IN"
    } else if (i < 15) {
      checkinOffset = randomInt(0, 1)
      status = "CONFIRMED"
    } else if (i < 30) {
      checkinOffset = randomInt(2, 45)
      status = "CONFIRMED"
    } else if (i < 35) {
      checkinOffset = randomInt(10, 60)
      status = "PENDING"
    } else {
      checkinOffset = randomInt(-30, 30)
      status = "CANCELLED"
    }

    const checkinDate = addDays(today, checkinOffset)
    const nights = randomInt(2, 10)
    const checkoutDate = addDays(checkinDate, nights)
    const numGuests = randomInt(1, property.maxGuests)
    const nightlyRate = randomInt(150, 800)
    const totalAmount = nightlyRate * nights
    const channelFee = channel ? totalAmount * 0.03 : 0
    const cleaningFee = Number(property.cleaningFee)
    const netAmount = totalAmount - channelFee

    const reservation = await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        channelId: channel?.id,
        externalReservationId: channel ? `${channel.name.substring(0, 3).toUpperCase()}-${randomInt(100000, 999999)}` : null,
        guestName: `${firstName} ${lastName}`,
        guestEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomItem(["gmail.com", "hotmail.com", "outlook.com", "email.com"])}`,
        guestPhone: `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        checkinDate,
        checkoutDate,
        numGuests,
        totalAmount,
        channelFee,
        cleaningFee,
        netAmount,
        status: status as any,
        notes: Math.random() > 0.7 ? randomItem([
          "Hospede solicita late check-out",
          "Viagem de negocios",
          "Lua de mel",
          "Aniversario de casamento",
          "Ferias em familia",
          "Primeira vez na cidade",
          "Hospede recorrente",
          "Reserva de ultima hora",
        ]) : null,
      },
    })
    reservations.push(reservation)
  }

  console.log("✅ Criando tarefas...")

  const taskTypes = ["CLEANING", "MAINTENANCE", "INSPECTION", "OTHER"] as const
  const taskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

  for (let i = 0; i < 25; i++) {
    const property = randomItem(activeProperties)
    const type = randomItem([...taskTypes])
    const titles = taskTitles[type]
    const title = randomItem(titles)

    let scheduledOffset: number
    let status: string
    let completedAt: Date | null = null

    if (i < 8) {
      scheduledOffset = randomInt(-30, -1)
      status = "COMPLETED"
      completedAt = addDays(today, scheduledOffset)
    } else if (i < 12) {
      scheduledOffset = randomInt(-2, 0)
      status = "IN_PROGRESS"
    } else if (i < 20) {
      scheduledOffset = randomInt(0, 14)
      status = "PENDING"
    } else {
      scheduledOffset = randomInt(-15, 15)
      status = "CANCELLED"
    }

    const relatedReservation = Math.random() > 0.5
      ? reservations.find((r) => r.propertyId === property.id)
      : null

    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        reservationId: relatedReservation?.id,
        type: type as any,
        title,
        description: `${title} para ${property.name}`,
        assignedToId: Math.random() > 0.3 ? randomItem(operadores).id : null,
        status: status as any,
        scheduledDate: addDays(today, scheduledOffset),
        completedAt,
      },
    })
  }

  console.log("💰 Criando transacoes...")

  // Receitas das reservas com check-out
  const checkedOutReservations = reservations.filter((r) => r.status === "CHECKED_OUT")
  for (const reservation of checkedOutReservations) {
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        type: "INCOME",
        category: "Reserva",
        amount: Number(reservation.totalAmount),
        date: reservation.checkinDate,
        description: `Reserva ${reservation.guestName}`,
        createdById: admin.id,
        reconciled: true,
      },
    })
  }

  // Despesas variadas
  for (let i = 0; i < 50; i++) {
    const property = randomItem(activeProperties)
    const category = randomItem(expenseCategories)
    const daysAgo = randomInt(0, 90)

    let amount: number
    switch (category) {
      case "Condominio": amount = randomInt(400, 1500); break
      case "IPTU": amount = randomInt(200, 800); break
      case "Energia": amount = randomInt(100, 400); break
      case "Agua": amount = randomInt(50, 200); break
      case "Internet": amount = randomInt(80, 150); break
      case "Limpeza": amount = randomInt(100, 250); break
      case "Manutencao": amount = randomInt(50, 500); break
      default: amount = randomInt(30, 300)
    }

    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        type: "EXPENSE",
        category,
        amount,
        date: addDays(today, -daysAgo),
        description: `${category} - ${property.name}`,
        createdById: randomItem([admin, gerente]).id,
        reconciled: daysAgo > 30,
      },
    })
  }

  console.log("💸 Criando repasses...")

  const payoutStatuses = ["PENDING", "PROCESSING", "PAID"]

  for (let i = 0; i < 15; i++) {
    const owner = randomItem(owners)
    const monthsAgo = Math.floor(i / 3)
    const periodStart = new Date(today.getFullYear(), today.getMonth() - monthsAgo - 1, 1)
    const periodEnd = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 0)

    const grossAmount = randomInt(3000, 15000)
    const expenses = randomInt(500, 2000)
    const adminFee = grossAmount * 0.2
    const netAmount = grossAmount - expenses - adminFee

    let status: string
    let paidAt: Date | null = null

    if (monthsAgo >= 2) {
      status = "PAID"
      paidAt = addDays(periodEnd, randomInt(5, 15))
    } else if (monthsAgo === 1) {
      status = Math.random() > 0.5 ? "PAID" : "PROCESSING"
      if (status === "PAID") paidAt = addDays(periodEnd, randomInt(5, 15))
    } else {
      status = "PENDING"
    }

    await prisma.ownerPayout.create({
      data: {
        ownerId: owner.id,
        periodStart,
        periodEnd,
        grossAmount,
        expenses,
        adminFee,
        netAmount,
        status: status as any,
        paidAt,
      },
    })
  }

  console.log("🗓️ Criando bloqueios de calendario...")

  for (let i = 0; i < 5; i++) {
    const property = randomItem(activeProperties)
    const startOffset = randomInt(10, 60)
    const duration = randomInt(2, 7)

    await prisma.calendarBlock.create({
      data: {
        propertyId: property.id,
        startDate: addDays(today, startOffset),
        endDate: addDays(today, startOffset + duration),
        reason: randomItem([
          "Manutencao programada",
          "Reforma no imovel",
          "Uso do proprietario",
          "Pintura",
          "Dedetizacao",
        ]),
      },
    })
  }

  console.log("📝 Criando logs de atividade...")

  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "STATUS_CHANGE"]
  const entityTypes = ["property", "reservation", "task", "transaction", "user"]

  for (let i = 0; i < 30; i++) {
    const user = randomItem(allUsers)
    const action = randomItem(actions)
    const entityType = randomItem(entityTypes)
    const daysAgo = randomInt(0, 30)

    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action,
        entityType,
        entityId: `cuid_${randomInt(100000, 999999)}`,
        metadata: { source: "seed", index: i },
        ipAddress: `192.168.1.${randomInt(1, 255)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        createdAt: addDays(today, -daysAgo),
      },
    })
  }

  // Contar totais
  const counts = {
    users: await prisma.user.count(),
    owners: await prisma.owner.count(),
    properties: await prisma.property.count(),
    reservations: await prisma.reservation.count(),
    tasks: await prisma.task.count(),
    transactions: await prisma.transaction.count(),
    payouts: await prisma.ownerPayout.count(),
    calendarBlocks: await prisma.calendarBlock.count(),
    activityLogs: await prisma.activityLog.count(),
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  console.log("")
  console.log("✅ Seed concluido com sucesso!")
  console.log("")
  console.log("📊 Dados criados:")
  console.log(`   - ${counts.users} Usuarios`)
  console.log(`   - ${counts.owners} Proprietarios`)
  console.log(`   - ${counts.properties} Imoveis`)
  console.log(`   - ${counts.reservations} Reservas`)
  console.log(`   - ${counts.tasks} Tarefas`)
  console.log(`   - ${counts.transactions} Transacoes`)
  console.log(`   - ${counts.payouts} Repasses`)
  console.log(`   - ${counts.calendarBlocks} Bloqueios de calendario`)
  console.log(`   - ${counts.activityLogs} Logs de atividade`)
  console.log("")
  console.log(`   📈 TOTAL: ${total} registros`)
  console.log("")
  console.log("🔑 Credenciais de acesso:")
  console.log("   Admin:        admin@stayflow.com        / 123456")
  console.log("   Gerente:      gerente@stayflow.com      / 123456")
  console.log("   Operador:     operador@stayflow.com     / 123456")
  console.log("   Proprietario: proprietario@stayflow.com / 123456")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
