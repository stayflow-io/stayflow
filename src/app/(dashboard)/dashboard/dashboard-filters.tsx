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

export function DashboardFilters({ properties, owners }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const propertyId = searchParams.get("property") || ""
  const ownerId = searchParams.get("owner") || ""

  // Filtra propriedades com base no proprietario selecionado
  const filteredProperties = useMemo(() => {
    if (!ownerId) return properties
    return properties.filter((p) => p.ownerId === ownerId)
  }, [properties, ownerId])

  // Limpa a propriedade selecionada se nao pertencer ao proprietario
  useEffect(() => {
    if (ownerId && propertyId) {
      const property = properties.find((p) => p.id === propertyId)
      if (property && property.ownerId !== ownerId) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("property")
        router.push(`/dashboard?${params.toString()}`)
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
    router.push(`/dashboard?${params.toString()}`)
  }

  function clearFilters() {
    router.push("/dashboard")
  }

  const hasFilters = propertyId || ownerId

  // Obter nome do owner/property selecionado para exibir resumo
  const selectedOwner = ownerId ? owners.find(o => o.id === ownerId) : null
  const selectedProperty = propertyId ? properties.find(p => p.id === propertyId) : null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-wrap">
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

      {hasFilters && (
        <div className="text-sm text-muted-foreground">
          Mostrando dados de:{" "}
          <span className="font-medium text-foreground">
            {selectedOwner?.name || "Todos proprietarios"}
            {selectedProperty && ` / ${selectedProperty.name}`}
          </span>
        </div>
      )}
    </div>
  )
}
