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

// ============================================================
// DADOS REAIS DE PORTO DE GALINHAS - CLIENTE AFT
// ============================================================

// Localizacoes reais
const locations = [
  { area: "Porto de Galinhas", neighborhood: "Centro", zipPrefix: "55590" },
  { area: "Porto de Galinhas", neighborhood: "Praia de Muro Alto", zipPrefix: "55590" },
  { area: "Porto de Galinhas", neighborhood: "Praia do Cupe", zipPrefix: "55590" },
  { area: "Porto de Galinhas", neighborhood: "Ponta de Serrambi", zipPrefix: "55590" },
  { area: "Maracaipe", neighborhood: "Praia de Maracaipe", zipPrefix: "55590" },
  { area: "Maracaipe", neighborhood: "Pontal de Maracaipe", zipPrefix: "55590" },
  { area: "Carneiros", neighborhood: "Praia dos Carneiros", zipPrefix: "55588" },
  { area: "Carneiros", neighborhood: "Ponta de Guadalupe", zipPrefix: "55588" },
  { area: "Muro Alto", neighborhood: "Praia de Muro Alto", zipPrefix: "55590" },
  { area: "Cupe", neighborhood: "Praia do Cupe", zipPrefix: "55590" },
]

// Condominios/Resorts REAIS de Porto de Galinhas e regiao
// 100+ predios com nomes reais da regiao
const realProperties = [
  // MURO ALTO - Resorts e Condominios de Luxo
  { name: "Beach Class Resort Muro Alto", area: "Muro Alto", type: "resort", units: 28 },
  { name: "Nannai Resort & Spa", area: "Muro Alto", type: "resort", units: 32 },
  { name: "Summerville Beach Resort", area: "Muro Alto", type: "resort", units: 45 },
  { name: "Enotel Resort & Spa", area: "Muro Alto", type: "resort", units: 38 },
  { name: "Samoa Beach Resort", area: "Muro Alto", type: "resort", units: 25 },
  { name: "Marulhos Resort", area: "Muro Alto", type: "condominio", units: 22 },
  { name: "Muro Alto Condominium", area: "Muro Alto", type: "condominio", units: 30 },
  { name: "Palm Beach Muro Alto", area: "Muro Alto", type: "condominio", units: 26 },
  { name: "Acqua Beach Park Residence", area: "Muro Alto", type: "condominio", units: 24 },
  { name: "Gavoa Resort", area: "Muro Alto", type: "resort", units: 35 },

  // PORTO DE GALINHAS - Centro e Praia
  { name: "Flat Beira Mar Porto", area: "Porto de Galinhas", type: "flat", units: 24 },
  { name: "Armacao Porto de Galinhas", area: "Porto de Galinhas", type: "resort", units: 40 },
  { name: "Hotel Village Porto de Galinhas", area: "Porto de Galinhas", type: "hotel", units: 35 },
  { name: "Pousada Tabapitanga", area: "Porto de Galinhas", type: "pousada", units: 22 },
  { name: "Porto das Dunas Residence", area: "Porto de Galinhas", type: "condominio", units: 28 },
  { name: "Recanto das Piscinas Naturais", area: "Porto de Galinhas", type: "condominio", units: 20 },
  { name: "Solar Porto de Galinhas", area: "Porto de Galinhas", type: "flat", units: 32 },
  { name: "Beira Mar Flats", area: "Porto de Galinhas", type: "flat", units: 26 },
  { name: "Canto da Praia Residence", area: "Porto de Galinhas", type: "condominio", units: 24 },
  { name: "Marinas Porto de Galinhas", area: "Porto de Galinhas", type: "condominio", units: 30 },
  { name: "Residencial Oceano Azul", area: "Porto de Galinhas", type: "condominio", units: 22 },
  { name: "Condominio Praia dos Corais", area: "Porto de Galinhas", type: "condominio", units: 25 },
  { name: "Edificio Pescador", area: "Porto de Galinhas", type: "edificio", units: 28 },
  { name: "Residencial Sol Nascente", area: "Porto de Galinhas", type: "condominio", units: 24 },
  { name: "Flat Mar Azul", area: "Porto de Galinhas", type: "flat", units: 20 },
  { name: "Pousada Xale das Aguas", area: "Porto de Galinhas", type: "pousada", units: 22 },
  { name: "Porto Plaza Residence", area: "Porto de Galinhas", type: "condominio", units: 30 },
  { name: "Residencial Hippocampus", area: "Porto de Galinhas", type: "condominio", units: 26 },
  { name: "Edificio Galinhas Douradas", area: "Porto de Galinhas", type: "edificio", units: 32 },
  { name: "Flat Brisa do Mar", area: "Porto de Galinhas", type: "flat", units: 24 },

  // CUPE - Praia do Cupe
  { name: "Serrambi Resort", area: "Cupe", type: "resort", units: 42 },
  { name: "Ocean Palace Beach Resort", area: "Cupe", type: "resort", units: 38 },
  { name: "Cupe Beach Living", area: "Cupe", type: "condominio", units: 28 },
  { name: "Residencial Cupe Beach", area: "Cupe", type: "condominio", units: 24 },
  { name: "Flat Praia do Cupe", area: "Cupe", type: "flat", units: 22 },
  { name: "Condominio Vista do Cupe", area: "Cupe", type: "condominio", units: 26 },
  { name: "Cupe Waves Residence", area: "Cupe", type: "condominio", units: 30 },
  { name: "Beach Village Cupe", area: "Cupe", type: "condominio", units: 25 },
  { name: "Residencial Sereia do Cupe", area: "Cupe", type: "condominio", units: 22 },
  { name: "Edificio Mar do Cupe", area: "Cupe", type: "edificio", units: 28 },

  // MARACAIPE - Praia dos Surfistas
  { name: "Pontal de Maracaipe Resort", area: "Maracaipe", type: "resort", units: 35 },
  { name: "Pousada dos Coelhos", area: "Maracaipe", type: "pousada", units: 20 },
  { name: "Maracaipe Beach Resort", area: "Maracaipe", type: "resort", units: 32 },
  { name: "Residencial Pontal", area: "Maracaipe", type: "condominio", units: 24 },
  { name: "Flat Maracaipe", area: "Maracaipe", type: "flat", units: 22 },
  { name: "Village de Maracaipe", area: "Maracaipe", type: "condominio", units: 28 },
  { name: "Condominio Barra de Maracaipe", area: "Maracaipe", type: "condominio", units: 26 },
  { name: "Surf Beach Maracaipe", area: "Maracaipe", type: "condominio", units: 24 },
  { name: "Maracaipe Eco Resort", area: "Maracaipe", type: "resort", units: 30 },
  { name: "Pousada Maresia", area: "Maracaipe", type: "pousada", units: 20 },
  { name: "Residencial Ondas de Maracaipe", area: "Maracaipe", type: "condominio", units: 25 },
  { name: "Flat Wave Rider", area: "Maracaipe", type: "flat", units: 22 },

  // CARNEIROS - Praia Paradisiaca
  { name: "Carneiros Beach Resort", area: "Carneiros", type: "resort", units: 38 },
  { name: "Resort Praia dos Carneiros", area: "Carneiros", type: "resort", units: 40 },
  { name: "Pousada Paraiso dos Carneiros", area: "Carneiros", type: "pousada", units: 24 },
  { name: "Village Carneiros", area: "Carneiros", type: "condominio", units: 28 },
  { name: "Residencial Igrejinha", area: "Carneiros", type: "condominio", units: 22 },
  { name: "Flat Carneiros Beach", area: "Carneiros", type: "flat", units: 20 },
  { name: "Ponta dos Carneiros Resort", area: "Carneiros", type: "resort", units: 32 },
  { name: "Condominio Enseada dos Carneiros", area: "Carneiros", type: "condominio", units: 26 },
  { name: "Carneiros Tropical Resort", area: "Carneiros", type: "resort", units: 35 },
  { name: "Residencial Mar de Carneiros", area: "Carneiros", type: "condominio", units: 24 },
  { name: "Pousada Beira Rio", area: "Carneiros", type: "pousada", units: 20 },
  { name: "Flat Guadalupe", area: "Carneiros", type: "flat", units: 22 },

  // Mais propriedades para completar 100+
  { name: "Beach Park Galinhas", area: "Porto de Galinhas", type: "resort", units: 36 },
  { name: "Residence Muro Alto Prime", area: "Muro Alto", type: "condominio", units: 28 },
  { name: "Porto Bay Resort", area: "Porto de Galinhas", type: "resort", units: 42 },
  { name: "Condominio Sol e Mar", area: "Porto de Galinhas", type: "condominio", units: 24 },
  { name: "Flat Jangadeiro", area: "Porto de Galinhas", type: "flat", units: 22 },
  { name: "Residencial Arrecifes", area: "Porto de Galinhas", type: "condominio", units: 26 },
  { name: "Edificio Cavalo Marinho", area: "Porto de Galinhas", type: "edificio", units: 30 },
  { name: "Pousada Recanto do Mar", area: "Maracaipe", type: "pousada", units: 20 },
  { name: "Resort Bahia Mar", area: "Cupe", type: "resort", units: 34 },
  { name: "Condominio Praia Bella", area: "Muro Alto", type: "condominio", units: 28 },
  { name: "Flat Paraiso", area: "Porto de Galinhas", type: "flat", units: 24 },
  { name: "Village Tropical", area: "Porto de Galinhas", type: "condominio", units: 32 },
  { name: "Residencial Costa Verde", area: "Cupe", type: "condominio", units: 26 },
  { name: "Edificio Nautilus", area: "Porto de Galinhas", type: "edificio", units: 28 },
  { name: "Resort Piscinas Naturais", area: "Porto de Galinhas", type: "resort", units: 38 },
  { name: "Condominio Vento Sul", area: "Maracaipe", type: "condominio", units: 24 },
  { name: "Flat Maresia", area: "Carneiros", type: "flat", units: 22 },
  { name: "Residencial Praia Bonita", area: "Muro Alto", type: "condominio", units: 30 },
  { name: "Village Beira Rio", area: "Carneiros", type: "condominio", units: 26 },
  { name: "Edificio Corais", area: "Porto de Galinhas", type: "edificio", units: 32 },
  { name: "Resort Sol & Praia", area: "Cupe", type: "resort", units: 40 },
  { name: "Condominio Atlantico", area: "Muro Alto", type: "condominio", units: 28 },
  { name: "Flat Ocean View", area: "Porto de Galinhas", type: "flat", units: 24 },
  { name: "Residencial Mangue Verde", area: "Maracaipe", type: "condominio", units: 22 },
  { name: "Edificio Pontal", area: "Maracaipe", type: "edificio", units: 26 },
  { name: "Resort Aguas Cristalinas", area: "Porto de Galinhas", type: "resort", units: 44 },
  { name: "Condominio Mar Aberto", area: "Cupe", type: "condominio", units: 28 },
  { name: "Village das Jangadas", area: "Porto de Galinhas", type: "condominio", units: 24 },
  { name: "Flat Praia Dourada", area: "Muro Alto", type: "flat", units: 22 },
  { name: "Residencial Coqueirais", area: "Carneiros", type: "condominio", units: 26 },
  { name: "Resort Ventos do Mar", area: "Maracaipe", type: "resort", units: 36 },
  { name: "Condominio Recife de Fora", area: "Porto de Galinhas", type: "condominio", units: 30 },
  { name: "Edificio Estrela do Mar", area: "Muro Alto", type: "edificio", units: 32 },
  { name: "Village Tropical Beach", area: "Cupe", type: "condominio", units: 28 },
  { name: "Flat Costa do Sol", area: "Carneiros", type: "flat", units: 24 },
  { name: "Residencial Porto Seguro", area: "Porto de Galinhas", type: "condominio", units: 26 },
  { name: "Resort Blue Lagoon", area: "Muro Alto", type: "resort", units: 42 },
  { name: "Condominio Lagoa Azul", area: "Porto de Galinhas", type: "condominio", units: 24 },
  { name: "Edificio Caravelas", area: "Cupe", type: "edificio", units: 28 },
  { name: "Village Jangadeiros", area: "Maracaipe", type: "condominio", units: 22 },
]

// Nomes de hospedes
const firstNames = [
  "Pedro", "Ana", "Carlos", "Maria", "Joao", "Fernanda", "Ricardo", "Julia",
  "Marcos", "Camila", "Lucas", "Beatriz", "Rafael", "Larissa", "Bruno", "Amanda",
  "Felipe", "Patricia", "Rodrigo", "Isabela", "Gustavo", "Mariana", "Diego", "Leticia",
  "Leonardo", "Gabriela", "Thiago", "Natalia", "Andre", "Carolina", "Eduardo", "Vanessa",
  "Henrique", "Priscila", "Vinicius", "Renata", "Matheus", "Daniela", "Alexandre", "Juliana"
]

const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Rodrigues", "Almeida",
  "Lima", "Ferreira", "Gomes", "Martins", "Araujo", "Ribeiro", "Carvalho", "Lopes",
  "Nascimento", "Moreira", "Barbosa", "Cardoso", "Mendes", "Rocha", "Dias", "Andrade",
  "Vieira", "Nunes", "Cavalcanti", "Monteiro", "Freitas", "Campos"
]

const amenitiesList = [
  "wifi", "ar-condicionado", "tv", "tv a cabo", "netflix", "cozinha equipada",
  "microondas", "geladeira", "fogao", "cafeteira", "torradeira", "liquidificador",
  "maquina de lavar", "secadora", "ferro de passar", "varanda", "varanda com rede",
  "churrasqueira", "piscina", "piscina privativa", "jacuzzi", "academia",
  "estacionamento", "estacionamento coberto", "elevador", "portaria 24h",
  "seguranca 24h", "pet friendly", "vista mar", "vista piscina", "vista jardim",
  "acesso direto praia", "serviço de praia", "banheira", "chuveiro quente",
  "roupa de cama", "toalhas", "secador de cabelo", "ventilador de teto",
  "berco disponivel", "cadeira de bebe", "area de lazer", "playground",
  "quadra de tenis", "campo de futebol", "sala de jogos", "spa", "sauna"
]

const taskTitles = {
  CLEANING: ["Limpeza completa", "Troca de roupas de cama", "Limpeza profunda", "Higienizacao pos check-out", "Limpeza geral", "Limpeza de piscina"],
  MAINTENANCE: ["Verificar ar-condicionado", "Trocar lampadas", "Reparar fechadura", "Desentupir ralo", "Verificar aquecedor", "Consertar torneira", "Verificar chuveiro", "Manutencao preventiva"],
  INSPECTION: ["Vistoria pre check-in", "Inspecao de rotina", "Verificar inventario", "Conferir estado geral", "Vistoria pos checkout"],
  OTHER: ["Entrega de chaves", "Receber hospede", "Reposicao de amenities", "Instalacao de equipamento", "Transfer aeroporto"]
}

const expenseCategories = [
  "Limpeza", "Manutencao", "Condominio", "IPTU", "Internet",
  "Energia", "Agua", "Gas", "Material de limpeza", "Amenities",
  "Lavanderia", "Jardinagem", "Seguro", "Taxa de administracao", "Piscina"
]

async function main() {
  console.log("🗑️  Limpando dados existentes...")

  await prisma.activityLog.deleteMany()
  await prisma.messageLog.deleteMany()
  await prisma.messageTemplate.deleteMany()
  await prisma.reservationEvent.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.unitPhoto.deleteMany()
  await prisma.propertyChannel.deleteMany()
  await prisma.calendarBlock.deleteMany()
  await prisma.taskChecklist.deleteMany()
  await prisma.task.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.ownerPayout.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.property.deleteMany()
  await prisma.owner.deleteMany()
  await prisma.user.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.tenant.deleteMany()

  console.log("🏢 Criando tenant AFT...")

  const tenant = await prisma.tenant.create({
    data: {
      name: "AFT Administradora",
      slug: "aft",
      plan: "enterprise",
    },
  })

  console.log("👥 Criando usuarios...")

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@aft.com.br",
      name: "Administrador AFT",
      passwordHash: await hash("aft2024", 10),
      role: "ADMIN",
      phone: "(81) 99999-0000",
    },
  })

  const gerente1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "gerente@aft.com.br",
      name: "Roberto Gerente",
      passwordHash: await hash("aft2024", 10),
      role: "MANAGER",
      phone: "(81) 99999-1111",
    },
  })

  const gerente2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "sandra@aft.com.br",
      name: "Sandra Coordenadora",
      passwordHash: await hash("aft2024", 10),
      role: "MANAGER",
      phone: "(81) 99999-2222",
    },
  })

  const operadores = []
  const operadorNames = [
    { name: "Carlos Operador", email: "carlos@aft.com.br" },
    { name: "Maria Auxiliar", email: "maria@aft.com.br" },
    { name: "Jose Atendente", email: "jose@aft.com.br" },
    { name: "Ana Paula", email: "anapaula@aft.com.br" },
    { name: "Fernando Silva", email: "fernando@aft.com.br" },
    { name: "Lucia Santos", email: "lucia@aft.com.br" },
    { name: "Paulo Henrique", email: "paulo@aft.com.br" },
    { name: "Carla Souza", email: "carla@aft.com.br" },
  ]

  for (const op of operadorNames) {
    const operador = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: op.email,
        name: op.name,
        passwordHash: await hash("aft2024", 10),
        role: "OPERATOR",
        phone: `(81) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      },
    })
    operadores.push(operador)
  }

  const allUsers = [admin, gerente1, gerente2, ...operadores]

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
  const decolar = await prisma.channel.create({
    data: { name: "Decolar", apiBaseUrl: "https://api.decolar.com", active: true },
  })
  const hoteis = await prisma.channel.create({
    data: { name: "Hoteis.com", apiBaseUrl: "https://api.hoteis.com", active: true },
  })

  const channels = [airbnb, booking, expedia, vrbo, decolar, hoteis]

  console.log("🏠 Criando proprietarios...")

  // Criar usuario proprietario principal
  const ownerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "proprietario@aft.com.br",
      name: "Antonio Fernando Torres",
      passwordHash: await hash("aft2024", 10),
      role: "OWNER",
      phone: "(81) 99999-9999",
    },
  })

  const owners: Array<{ id: string; name: string }> = []

  // Proprietario principal (AFT)
  const mainOwner = await prisma.owner.create({
    data: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      name: "Antonio Fernando Torres (AFT)",
      email: "proprietario@aft.com.br",
      phone: "(81) 99999-9999",
      document: "123.456.789-00",
      pixKey: "aft@pix.com.br",
      commissionPercent: 80,
    },
  })
  owners.push(mainOwner)

  // Criar mais proprietarios (parceiros da AFT)
  const ownerData = [
    { name: "Grupo Muro Alto Empreendimentos", email: "contato@muroalto.com.br" },
    { name: "Porto Galinhas Investimentos", email: "contato@portogalinhas.com.br" },
    { name: "Carneiros Beach Properties", email: "contato@carneirosbeach.com.br" },
    { name: "Maracaipe Surf Resort Ltda", email: "contato@maracaipe.com.br" },
    { name: "Cupe Beach Administradora", email: "contato@cupebeach.com.br" },
    { name: "Nordeste Flats Administracao", email: "contato@nordesteflats.com.br" },
    { name: "Praia do Sol Empreendimentos", email: "contato@praiadosol.com.br" },
    { name: "Litoral Sul Properties", email: "contato@litoralsul.com.br" },
    { name: "Pernambuco Beach Resort Ltda", email: "contato@pebeachresort.com.br" },
    { name: "Costa Dourada Administradora", email: "contato@costadourada.com.br" },
    { name: "Tropical Nordeste Imoveis", email: "contato@tropicalnordeste.com.br" },
    { name: "Sol & Mar Empreendimentos", email: "contato@solemar.com.br" },
    { name: "Atlantico Sul Properties", email: "contato@atlanticosul.com.br" },
    { name: "Paraiso Tropical Ltda", email: "contato@paraisotropical.com.br" },
    { name: "Ventos do Litoral Investimentos", email: "contato@ventosdolitoral.com.br" },
  ]

  for (const data of ownerData) {
    const owner = await prisma.owner.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: `(81) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        document: `${randomInt(10, 99)}.${randomInt(100, 999)}.${randomInt(100, 999)}/0001-${randomInt(10, 99)}`,
        pixKey: data.email,
        commissionPercent: randomItem([75, 80, 85]),
      },
    })
    owners.push(owner)
  }

  console.log("🏡 Criando propriedades e unidades (100+ predios com 20+ unidades cada)...")

  const units: Array<{ id: string; name: string; status: string; cleaningFee: any; maxGuests: number; propertyId: string }> = []
  let totalUnitsCreated = 0

  for (const prop of realProperties) {
    const location = locations.find(l => l.area === prop.area) || randomItem(locations)
    const owner = randomItem(owners)

    // Cada predio tem no minimo 20 unidades (requisito do cliente)
    const numUnits = Math.max(20, prop.units)

    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        ownerId: owner.id,
        name: prop.name,
        address: `Av. Beira Mar, ${randomInt(1, 5000)} - ${location.neighborhood}`,
        city: "Ipojuca",
        state: "PE",
        zipcode: `${location.zipPrefix}-${randomInt(100, 999)}`,
        description: `${prop.name} localizado em ${prop.area}. ${prop.type === 'resort' ? 'Resort completo com infraestrutura de lazer.' : prop.type === 'flat' ? 'Flat com servicos inclusos.' : 'Condominio com excelente localizacao.'} Acesso facil as praias da regiao.`,
        amenities: prop.type === 'resort'
          ? ["piscina", "restaurante", "academia", "spa", "praia privativa", "estacionamento", "wifi", "ar-condicionado"]
          : ["piscina", "estacionamento", "portaria 24h", "wifi", "playground"],
        status: "ACTIVE",
      },
    })

    // Criar unidades para este predio
    for (let j = 0; j < numUnits; j++) {
      // Calcular andar e numero do apartamento
      const floor = Math.floor(j / 4) + 1
      const unitNum = (j % 4) + 1
      const unitNumber = floor * 100 + unitNum

      // Variar configuracoes
      const configs = [
        { bedrooms: 1, bathrooms: 1, maxGuests: 3, prefix: "Studio" },
        { bedrooms: 2, bathrooms: 1, maxGuests: 5, prefix: "Apartamento" },
        { bedrooms: 2, bathrooms: 2, maxGuests: 6, prefix: "Apartamento" },
        { bedrooms: 3, bathrooms: 2, maxGuests: 8, prefix: "Apartamento" },
        { bedrooms: 3, bathrooms: 3, maxGuests: 10, prefix: "Cobertura" },
      ]
      const config = configs[j % configs.length]

      // Algumas unidades tem dono diferente do predio
      const unitOwner = Math.random() > 0.8 ? randomItem(owners) : null

      const numAmenities = randomInt(8, 15)
      const unitAmenities = [...amenitiesList].sort(() => Math.random() - 0.5).slice(0, numAmenities)

      // Precos variam por tipo de propriedade
      const cleaningFees: Record<string, number[]> = {
        resort: [150, 180, 200, 250],
        flat: [100, 120, 150],
        condominio: [120, 150, 180, 200],
        pousada: [100, 120, 150],
        hotel: [100, 130, 150],
        edificio: [120, 150, 180],
      }

      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          ownerId: unitOwner?.id || null,
          name: `${config.prefix} ${unitNumber}`,
          bedrooms: config.bedrooms,
          bathrooms: config.bathrooms,
          maxGuests: config.maxGuests,
          description: `${config.prefix} com ${config.bedrooms} quarto${config.bedrooms > 1 ? "s" : ""} no ${prop.name}. ${unitAmenities.slice(0, 4).join(", ")}.`,
          amenities: unitAmenities,
          cleaningFee: randomItem(cleaningFees[prop.type] || [150, 180, 200]),
          adminFeePercent: randomItem([15, 18, 20, 22]),
          status: Math.random() > 0.05 ? "ACTIVE" : randomItem(["INACTIVE", "MAINTENANCE"]),
        },
      })
      units.push(unit)
      totalUnitsCreated++
    }

    // Log de progresso
    if (totalUnitsCreated % 500 === 0) {
      console.log(`   ... ${totalUnitsCreated} unidades criadas`)
    }
  }

  console.log(`   ✅ Total: ${units.length} unidades em ${realProperties.length} propriedades`)

  const activeUnits = units.filter((u) => u.status === "ACTIVE")

  console.log("📅 Criando reservas...")

  const today = new Date()
  today.setHours(14, 0, 0, 0)

  const reservations: Array<{ id: string; unitId: string; guestName: string; checkinDate: Date; totalAmount: any; status: string }> = []

  // Criar mais reservas para um volume realista (200+ reservas)
  const numReservations = 250
  for (let i = 0; i < numReservations; i++) {
    const unit = randomItem(activeUnits)
    const channel = Math.random() > 0.15 ? randomItem(channels) : null
    const firstName = randomItem(firstNames)
    const lastName = randomItem(lastNames)

    let checkinOffset: number
    let status: string

    if (i < 40) {
      // Reservas passadas (checked out)
      checkinOffset = randomInt(-90, -10)
      status = "CHECKED_OUT"
    } else if (i < 60) {
      // Hospedes atuais (checked in)
      checkinOffset = randomInt(-7, -1)
      status = "CHECKED_IN"
    } else if (i < 80) {
      // Chegando hoje/amanha
      checkinOffset = randomInt(0, 2)
      status = "CONFIRMED"
    } else if (i < 180) {
      // Reservas futuras confirmadas
      checkinOffset = randomInt(3, 90)
      status = "CONFIRMED"
    } else if (i < 220) {
      // Reservas pendentes
      checkinOffset = randomInt(7, 60)
      status = "PENDING"
    } else {
      // Canceladas
      checkinOffset = randomInt(-30, 30)
      status = "CANCELLED"
    }

    const checkinDate = addDays(today, checkinOffset)
    const nights = randomInt(2, 14)
    const checkoutDate = addDays(checkinDate, nights)
    const numGuests = randomInt(1, unit.maxGuests)

    // Precos variam por temporada e tipo
    const isHighSeason = checkinDate.getMonth() === 11 || checkinDate.getMonth() === 0 || checkinDate.getMonth() === 6
    const baseRate = randomInt(250, 800)
    const nightlyRate = isHighSeason ? baseRate * 1.5 : baseRate
    const totalAmount = nightlyRate * nights
    const channelFee = channel ? totalAmount * 0.03 : 0
    const cleaningFee = Number(unit.cleaningFee)
    const netAmount = totalAmount - channelFee

    const reservation = await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        unitId: unit.id,
        channelId: channel?.id,
        externalReservationId: channel ? `${channel.name.substring(0, 3).toUpperCase()}-${randomInt(100000, 999999)}` : null,
        guestName: `${firstName} ${lastName}`,
        guestEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomItem(["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "uol.com.br"])}`,
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
          "Primeira vez em Porto de Galinhas",
          "Hospede recorrente",
          "Reserva corporativa",
          "Grupo de amigos",
          "Casal com criancas",
        ]) : null,
      },
    })
    reservations.push(reservation)

    if (i % 50 === 0 && i > 0) {
      console.log(`   ... ${i} reservas criadas`)
    }
  }

  console.log(`   ✅ Total: ${reservations.length} reservas`)

  console.log("✅ Criando tarefas...")

  const taskTypes = ["CLEANING", "MAINTENANCE", "INSPECTION", "OTHER"] as const

  for (let i = 0; i < 150; i++) {
    const unit = randomItem(activeUnits)
    const type = randomItem([...taskTypes])
    const titles = taskTitles[type]
    const title = randomItem(titles)

    let scheduledOffset: number
    let status: string
    let completedAt: Date | null = null

    if (i < 50) {
      scheduledOffset = randomInt(-60, -1)
      status = "COMPLETED"
      completedAt = addDays(today, scheduledOffset)
    } else if (i < 70) {
      scheduledOffset = randomInt(-2, 0)
      status = "IN_PROGRESS"
    } else if (i < 130) {
      scheduledOffset = randomInt(0, 30)
      status = "PENDING"
    } else {
      scheduledOffset = randomInt(-30, 30)
      status = "CANCELLED"
    }

    const relatedReservation = Math.random() > 0.4
      ? reservations.find((r) => r.unitId === unit.id)
      : null

    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        unitId: unit.id,
        reservationId: relatedReservation?.id,
        type: type as any,
        title,
        description: `${title} para ${unit.name}`,
        assignedToId: Math.random() > 0.2 ? randomItem(operadores).id : null,
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
        unitId: reservation.unitId,
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
  for (let i = 0; i < 300; i++) {
    const unit = randomItem(activeUnits)
    const category = randomItem(expenseCategories)
    const daysAgo = randomInt(0, 120)

    let amount: number
    switch (category) {
      case "Condominio": amount = randomInt(500, 2000); break
      case "IPTU": amount = randomInt(300, 1200); break
      case "Energia": amount = randomInt(150, 600); break
      case "Agua": amount = randomInt(80, 300); break
      case "Internet": amount = randomInt(100, 200); break
      case "Limpeza": amount = randomInt(150, 350); break
      case "Manutencao": amount = randomInt(100, 800); break
      case "Piscina": amount = randomInt(200, 500); break
      default: amount = randomInt(50, 400)
    }

    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        unitId: unit.id,
        type: "EXPENSE",
        category,
        amount,
        date: addDays(today, -daysAgo),
        description: `${category} - ${unit.name}`,
        createdById: randomItem([admin, gerente1, gerente2]).id,
        reconciled: daysAgo > 30,
      },
    })
  }

  console.log("💸 Criando repasses...")

  for (const owner of owners) {
    for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
      const periodStart = new Date(today.getFullYear(), today.getMonth() - monthsAgo - 1, 1)
      const periodEnd = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 0)

      const grossAmount = randomInt(10000, 80000)
      const expenses = randomInt(2000, 8000)
      const adminFee = grossAmount * 0.2
      const netAmount = grossAmount - expenses - adminFee

      let status: string
      let paidAt: Date | null = null

      if (monthsAgo >= 3) {
        status = "PAID"
        paidAt = addDays(periodEnd, randomInt(5, 15))
      } else if (monthsAgo >= 1) {
        status = Math.random() > 0.3 ? "PAID" : "PROCESSING"
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
  }

  console.log("🗓️ Criando bloqueios de calendario...")

  for (let i = 0; i < 30; i++) {
    const unit = randomItem(activeUnits)
    const startOffset = randomInt(5, 90)
    const duration = randomInt(2, 10)

    await prisma.calendarBlock.create({
      data: {
        unitId: unit.id,
        startDate: addDays(today, startOffset),
        endDate: addDays(today, startOffset + duration),
        reason: randomItem([
          "Manutencao programada",
          "Reforma no imovel",
          "Uso do proprietario",
          "Pintura",
          "Dedetizacao",
          "Troca de mobiliario",
          "Manutencao de ar-condicionado",
          "Limpeza profunda",
        ]),
      },
    })
  }

  console.log("📝 Criando logs de atividade...")

  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "STATUS_CHANGE"]
  const entityTypes = ["property", "unit", "reservation", "task", "transaction", "user"]

  for (let i = 0; i < 100; i++) {
    const user = randomItem(allUsers)
    const action = randomItem(actions)
    const entityType = randomItem(entityTypes)
    const daysAgo = randomInt(0, 60)

    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action,
        entityType,
        entityId: `cuid_${randomInt(100000, 999999)}`,
        metadata: { source: "seed-aft", index: i },
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
    units: await prisma.unit.count(),
    reservations: await prisma.reservation.count(),
    tasks: await prisma.task.count(),
    transactions: await prisma.transaction.count(),
    payouts: await prisma.ownerPayout.count(),
    calendarBlocks: await prisma.calendarBlock.count(),
    activityLogs: await prisma.activityLog.count(),
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  console.log("")
  console.log("=" .repeat(60))
  console.log("✅ SEED AFT CONCLUIDO COM SUCESSO!")
  console.log("=" .repeat(60))
  console.log("")
  console.log("📊 Dados criados:")
  console.log(`   - ${counts.users} Usuarios`)
  console.log(`   - ${counts.owners} Proprietarios`)
  console.log(`   - ${counts.properties} Propriedades (predios/resorts)`)
  console.log(`   - ${counts.units} Unidades (apartamentos)`)
  console.log(`   - ${counts.reservations} Reservas`)
  console.log(`   - ${counts.tasks} Tarefas`)
  console.log(`   - ${counts.transactions} Transacoes`)
  console.log(`   - ${counts.payouts} Repasses`)
  console.log(`   - ${counts.calendarBlocks} Bloqueios de calendario`)
  console.log(`   - ${counts.activityLogs} Logs de atividade`)
  console.log("")
  console.log(`   📈 TOTAL: ${total} registros`)
  console.log("")
  console.log("📍 Localizacoes:")
  console.log("   - Porto de Galinhas (Centro e Praias)")
  console.log("   - Muro Alto")
  console.log("   - Cupe")
  console.log("   - Maracaipe")
  console.log("   - Carneiros")
  console.log("")
  console.log("🔑 Credenciais de acesso:")
  console.log("   Admin:        admin@aft.com.br        / aft2024")
  console.log("   Gerente:      gerente@aft.com.br      / aft2024")
  console.log("   Operador:     carlos@aft.com.br       / aft2024")
  console.log("   Proprietario: proprietario@aft.com.br / aft2024")
  console.log("")
  console.log("=" .repeat(60))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
