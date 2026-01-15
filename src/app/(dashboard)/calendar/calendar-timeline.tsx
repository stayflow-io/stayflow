"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { getCalendarTimelineData, type TimelineData, type TimelineEvent } from "@/actions/calendar"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, differenceInDays, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

type Property = {
  id: string
  name: string
  ownerId: string | null
}

type Owner = {
  id: string
  name: string
}

interface CalendarTimelineProps {
  properties: Property[]
  owners: Owner[]
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-yellow-200", text: "text-yellow-900", border: "border-yellow-400" },
  CONFIRMED: { bg: "bg-blue-200", text: "text-blue-900", border: "border-blue-400" },
  CHECKED_IN: { bg: "bg-green-200", text: "text-green-900", border: "border-green-400" },
  CHECKED_OUT: { bg: "bg-gray-200", text: "text-gray-700", border: "border-gray-400" },
  block: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
}

export function CalendarTimeline({ properties, owners }: CalendarTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [selectedOwner, setSelectedOwner] = useState<string>("all")
  const [data, setData] = useState<TimelineData>({ units: [], events: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [collapsedProperties, setCollapsedProperties] = useState<Set<string>>(new Set())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Filtrar propriedades por owner
  const filteredProperties = useMemo(() => {
    if (selectedOwner === "all") return properties
    return properties.filter(p => p.ownerId === selectedOwner)
  }, [properties, selectedOwner])

  // Resetar propriedade se nao pertencer ao owner
  useEffect(() => {
    if (selectedOwner !== "all" && selectedProperty !== "all") {
      const property = properties.find(p => p.id === selectedProperty)
      if (property && property.ownerId !== selectedOwner) {
        setSelectedProperty("all")
      }
    }
  }, [selectedOwner, selectedProperty, properties])

  // Carregar dados
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const filters: { propertyId?: string; ownerId?: string } = {}
        if (selectedProperty !== "all") filters.propertyId = selectedProperty
        if (selectedOwner !== "all") filters.ownerId = selectedOwner

        const result = await getCalendarTimelineData(monthStart, monthEnd, filters)
        setData({
          units: result.units,
          events: result.events.map(e => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          })),
        })
      } catch (error) {
        console.error("Erro ao carregar timeline:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [currentDate, selectedProperty, selectedOwner])

  // Agrupar unidades por property
  const groupedUnits = useMemo(() => {
    const groups: Record<string, { propertyName: string; units: typeof data.units }> = {}
    data.units.forEach(unit => {
      if (!groups[unit.propertyId]) {
        groups[unit.propertyId] = { propertyName: unit.propertyName, units: [] }
      }
      groups[unit.propertyId].units.push(unit)
    })
    return groups
  }, [data.units])

  // Toggle collapse
  function toggleProperty(propertyId: string) {
    const newCollapsed = new Set(collapsedProperties)
    if (newCollapsed.has(propertyId)) {
      newCollapsed.delete(propertyId)
    } else {
      newCollapsed.add(propertyId)
    }
    setCollapsedProperties(newCollapsed)
  }

  // Obter eventos de uma unidade
  function getEventsForUnit(unitId: string): TimelineEvent[] {
    return data.events.filter(e => e.unitId === unitId)
  }

  // Calcular posicao e largura da barra
  function getEventStyle(event: TimelineEvent) {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)

    // Ajustar para limites do mes
    const visibleStart = isBefore(eventStart, monthStart) ? monthStart : eventStart
    const visibleEnd = isAfter(eventEnd, monthEnd) ? monthEnd : eventEnd

    const startOffset = differenceInDays(visibleStart, monthStart)
    const duration = differenceInDays(visibleEnd, visibleStart) + 1

    const colors = event.type === "block"
      ? statusColors.block
      : statusColors[event.status || "CONFIRMED"]

    return {
      left: `${(startOffset / days.length) * 100}%`,
      width: `${(duration / days.length) * 100}%`,
      ...colors,
    }
  }

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
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : data.units.length === 0 ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Nenhuma unidade encontrada</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Header com dias */}
            <div className="flex border-b bg-muted">
              <div className="w-48 min-w-[192px] p-2 font-medium border-r sticky left-0 bg-muted z-10">
                Unidade
              </div>
              <div className="flex-1 flex overflow-x-auto">
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-10 min-w-[40px] p-1 text-center text-xs border-r ${
                      isToday(day) ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    <div className="font-medium">{format(day, "d")}</div>
                    <div className="text-[10px] opacity-70">{format(day, "EEE", { locale: ptBR })}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linhas por property/unit */}
            <div className="overflow-x-auto">
              {Object.entries(groupedUnits).map(([propertyId, group]) => (
                <div key={propertyId}>
                  {/* Property header */}
                  <div
                    className="flex border-b bg-muted/50 cursor-pointer hover:bg-muted/70"
                    onClick={() => toggleProperty(propertyId)}
                  >
                    <div className="w-48 min-w-[192px] p-2 font-medium border-r sticky left-0 bg-muted/50 z-10 flex items-center gap-2">
                      {collapsedProperties.has(propertyId) ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="truncate">{group.propertyName}</span>
                      <span className="text-xs text-muted-foreground">({group.units.length})</span>
                    </div>
                    <div className="flex-1" />
                  </div>

                  {/* Units */}
                  {!collapsedProperties.has(propertyId) &&
                    group.units.map((unit) => {
                      const events = getEventsForUnit(unit.id)
                      return (
                        <div key={unit.id} className="flex border-b hover:bg-muted/30">
                          <div className="w-48 min-w-[192px] p-2 text-sm border-r sticky left-0 bg-background z-10 truncate pl-8">
                            {unit.name}
                          </div>
                          <div className="flex-1 relative h-10" style={{ minWidth: `${days.length * 40}px` }}>
                            {events.map((event) => {
                              const style = getEventStyle(event)
                              const isReservation = event.type === "reservation"
                              return (
                                <Link
                                  key={event.id}
                                  href={isReservation ? `/reservations/${event.id}` : "#"}
                                  className={`absolute top-1 bottom-1 rounded px-1 text-xs flex items-center overflow-hidden border ${style.bg} ${style.text} ${style.border} ${isReservation ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                                  style={{ left: style.left, width: style.width }}
                                  title={isReservation ? `${event.guestName} - ${event.status}` : event.reason || "Bloqueado"}
                                >
                                  <span className="truncate">
                                    {isReservation ? event.guestName : "Bloqueado"}
                                  </span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legenda */}
        <div className="mt-4 flex items-center gap-4 flex-wrap text-sm">
          <span className="font-medium">Legenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-400" />
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-400" />
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400" />
            <span>Check-out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span>Bloqueado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
