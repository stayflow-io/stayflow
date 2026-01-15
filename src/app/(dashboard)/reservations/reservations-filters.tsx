"use client"

import { useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Property {
  id: string
  name: string
  ownerId: string | null
}

interface Owner {
  id: string
  name: string
}

interface Props {
  properties: Property[]
  owners: Owner[]
}

export function ReservationsFilters({ properties, owners }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get("status") || ""
  const propertyId = searchParams.get("property") || ""
  const ownerId = searchParams.get("owner") || ""

  // Filtra propriedades com base no proprietário selecionado
  const filteredProperties = useMemo(() => {
    if (!ownerId) return properties
    return properties.filter((p) => p.ownerId === ownerId)
  }, [properties, ownerId])

  // Limpa a propriedade selecionada se não pertencer ao proprietário
  useEffect(() => {
    if (ownerId && propertyId) {
      const property = properties.find((p) => p.id === propertyId)
      if (property && property.ownerId !== ownerId) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("property")
        router.push(`/reservations?${params.toString()}`)
      }
    }
  }, [ownerId, propertyId, properties, searchParams, router])

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset page when filter changes
    router.push(`/reservations?${params.toString()}`)
  }

  function clearFilters() {
    router.push("/reservations")
  }

  const hasFilters = status || propertyId || ownerId

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Select value={status} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Pendente</SelectItem>
          <SelectItem value="CONFIRMED">Confirmada</SelectItem>
          <SelectItem value="CHECKED_IN">Check-in</SelectItem>
          <SelectItem value="CHECKED_OUT">Check-out</SelectItem>
          <SelectItem value="CANCELLED">Cancelada</SelectItem>
          <SelectItem value="NO_SHOW">No-show</SelectItem>
        </SelectContent>
      </Select>

      <Select value={ownerId} onValueChange={(v) => updateFilter("owner", v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os proprietarios" />
        </SelectTrigger>
        <SelectContent>
          {owners.map((owner) => (
            <SelectItem key={owner.id} value={owner.id}>
              {owner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={propertyId} onValueChange={(v) => updateFilter("property", v)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Todos os imoveis" />
        </SelectTrigger>
        <SelectContent>
          {filteredProperties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
