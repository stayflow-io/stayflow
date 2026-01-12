"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getCalendarEvents } from "@/actions/calendar"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

type Property = {
  id: string
  name: string
  ownerId: string
}

type Owner = {
  id: string
  name: string
}

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  type: "reservation" | "block"
  status?: string
  propertyId: string
  propertyName: string
  guestName?: string
  channel?: string
}

// Cores para diferenciar imóveis
const propertyColors = [
  { bg: "bg-blue-100", text: "text-blue-800", hover: "hover:bg-blue-200", border: "border-blue-300" },
  { bg: "bg-green-100", text: "text-green-800", hover: "hover:bg-green-200", border: "border-green-300" },
  { bg: "bg-purple-100", text: "text-purple-800", hover: "hover:bg-purple-200", border: "border-purple-300" },
  { bg: "bg-orange-100", text: "text-orange-800", hover: "hover:bg-orange-200", border: "border-orange-300" },
  { bg: "bg-pink-100", text: "text-pink-800", hover: "hover:bg-pink-200", border: "border-pink-300" },
  { bg: "bg-cyan-100", text: "text-cyan-800", hover: "hover:bg-cyan-200", border: "border-cyan-300" },
  { bg: "bg-yellow-100", text: "text-yellow-800", hover: "hover:bg-yellow-200", border: "border-yellow-300" },
  { bg: "bg-indigo-100", text: "text-indigo-800", hover: "hover:bg-indigo-200", border: "border-indigo-300" },
  { bg: "bg-rose-100", text: "text-rose-800", hover: "hover:bg-rose-200", border: "border-rose-300" },
  { bg: "bg-teal-100", text: "text-teal-800", hover: "hover:bg-teal-200", border: "border-teal-300" },
]

interface CalendarViewProps {
  properties: Property[]
  owners: Owner[]
}

export function CalendarView({ properties, owners }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [selectedOwner, setSelectedOwner] = useState<string>("all")
  const [events, setEvents] = useState<{ reservations: CalendarEvent[]; blocks: CalendarEvent[] }>({
    reservations: [],
    blocks: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  // Criar mapa de cores por propertyId
  const propertyColorMap = useMemo(() => {
    const map: Record<string, typeof propertyColors[0]> = {}
    properties.forEach((p, index) => {
      map[p.id] = propertyColors[index % propertyColors.length]
    })
    return map
  }, [properties])

  // Filtrar imóveis por proprietário
  const filteredProperties = useMemo(() => {
    if (selectedOwner === "all") return properties
    return properties.filter(p => p.ownerId === selectedOwner)
  }, [properties, selectedOwner])

  // Resetar seleção de imóvel quando mudar proprietário
  useEffect(() => {
    if (selectedOwner !== "all" && selectedProperty !== "all") {
      const property = properties.find(p => p.id === selectedProperty)
      if (property && property.ownerId !== selectedOwner) {
        setSelectedProperty("all")
      }
    }
  }, [selectedOwner, selectedProperty, properties])

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true)
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const propertyId = selectedProperty === "all" ? undefined : selectedProperty

      try {
        const data = await getCalendarEvents(start, end, propertyId)
        let reservations = data.reservations.map((r) => ({
          ...r,
          start: new Date(r.start),
          end: new Date(r.end),
        }))
        let blocks = data.blocks.map((b) => ({
          ...b,
          start: new Date(b.start),
          end: new Date(b.end),
        }))

        // Filtrar por proprietário se selecionado
        if (selectedOwner !== "all" && selectedProperty === "all") {
          const ownerPropertyIds = properties
            .filter(p => p.ownerId === selectedOwner)
            .map(p => p.id)
          reservations = reservations.filter(r => ownerPropertyIds.includes(r.propertyId))
          blocks = blocks.filter(b => ownerPropertyIds.includes(b.propertyId))
        }

        setEvents({ reservations, blocks })
      } catch (error) {
        console.error("Erro ao carregar eventos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [currentDate, selectedProperty, selectedOwner, properties])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Adicionar dias do mês anterior para completar a primeira semana
  const startDay = monthStart.getDay()
  const prefixDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (startDay - i))
    return date
  })

  // Adicionar dias do próximo mês para completar a última semana
  const endDay = monthEnd.getDay()
  const suffixDays = Array.from({ length: 6 - endDay }, (_, i) => {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i + 1)
    return date
  })

  const allDays = [...prefixDays, ...days, ...suffixDays]

  function getEventsForDay(date: Date) {
    const dayReservations = events.reservations.filter((r) => {
      const start = new Date(r.start)
      const end = new Date(r.end)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      const dayDate = new Date(date)
      dayDate.setHours(0, 0, 0, 0)
      return dayDate >= start && dayDate <= end
    })

    const dayBlocks = events.blocks.filter((b) => {
      const start = new Date(b.start)
      const end = new Date(b.end)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      const dayDate = new Date(date)
      dayDate.setHours(0, 0, 0, 0)
      return dayDate >= start && dayDate <= end
    })

    return { reservations: dayReservations, blocks: dayBlocks }
  }

  function getPropertyColor(propertyId: string) {
    return propertyColorMap[propertyId] || propertyColors[0]
  }

  // Propriedades usadas no calendário para legenda
  const usedPropertyIds = useMemo(() => {
    const ids = new Set<string>()
    events.reservations.forEach(r => ids.add(r.propertyId))
    events.blocks.forEach(b => ids.add(b.propertyId))
    return Array.from(ids)
  }, [events])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="min-w-[200px] text-center capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os proprietarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os proprietarios</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Todos os imoveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os imoveis</SelectItem>
                {filteredProperties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="min-h-[500px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Header com dias da semana */}
            <div className="grid grid-cols-7 bg-muted">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium border-b"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7">
              {allDays.map((date, index) => {
                const { reservations, blocks } = getEventsForDay(date)
                const isCurrentMonth = isSameMonth(date, currentDate)
                const isCurrentDay = isToday(date)

                return (
                  <div
                    key={index}
                    className={`min-h-[110px] p-1 border-b border-r ${
                      !isCurrentMonth ? "bg-muted/50" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                        isCurrentDay
                          ? "bg-primary text-primary-foreground"
                          : !isCurrentMonth
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      {format(date, "d")}
                    </div>
                    <div className="space-y-1">
                      {reservations.slice(0, 3).map((r) => {
                        const colors = getPropertyColor(r.propertyId)
                        return (
                          <Link
                            key={r.id}
                            href={`/reservations/${r.id}`}
                            className={`block text-xs p-1 rounded truncate ${colors.bg} ${colors.text} ${colors.hover}`}
                            title={`${r.guestName} - ${r.propertyName}`}
                          >
                            <span className="font-medium">{r.propertyName.split(" ")[0]}</span>
                            <span className="opacity-75"> {r.guestName?.split(" ")[0]}</span>
                          </Link>
                        )
                      })}
                      {blocks.slice(0, 1).map((b) => (
                        <div
                          key={b.id}
                          className="text-xs p-1 rounded bg-gray-200 text-gray-700 truncate"
                          title={`${b.propertyName} - ${b.title}`}
                        >
                          <span className="font-medium">{b.propertyName.split(" ")[0]}</span>
                          <span className="opacity-75"> Bloqueado</span>
                        </div>
                      ))}
                      {reservations.length + blocks.length > 4 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{reservations.length + blocks.length - 4} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legenda dinâmica baseada nos imóveis visíveis */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Legenda:</p>
          <div className="flex items-center gap-4 flex-wrap text-sm">
            {usedPropertyIds.map((propertyId) => {
              const property = properties.find(p => p.id === propertyId)
              const colors = getPropertyColor(propertyId)
              if (!property) return null
              return (
                <div key={propertyId} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
                  <span className="truncate max-w-[150px]">{property.name}</span>
                </div>
              )
            })}
            {events.blocks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
                <span>Bloqueado</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
