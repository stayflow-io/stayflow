"use client"

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

interface Owner {
  id: string
  name: string
}

interface Props {
  owners: Owner[]
}

export function PropertiesFilters({ owners }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get("status") || ""
  const ownerId = searchParams.get("owner") || ""

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset page when filter changes
    router.push(`/properties?${params.toString()}`)
  }

  function clearFilters() {
    router.push("/properties")
  }

  const hasFilters = status || ownerId

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Select value={status} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Ativo</SelectItem>
          <SelectItem value="INACTIVE">Inativo</SelectItem>
          <SelectItem value="MAINTENANCE">Manutencao</SelectItem>
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

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
