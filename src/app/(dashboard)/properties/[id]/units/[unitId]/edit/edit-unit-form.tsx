"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { updateUnit } from "@/actions/units"

interface Owner {
  id: string
  name: string
}

interface Unit {
  id: string
  propertyId: string
  ownerId: string | null
  name: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  description: string | null
  amenities: string[]
  cleaningFee: number | string
  adminFeePercent: number | string
  status: string
  property: {
    id: string
    name: string
  }
}

interface Props {
  unit: Unit
  owners: Owner[]
}

export function EditUnitForm({ unit, owners }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await updateUnit(unit.id, formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push(`/properties/${unit.propertyId}/units/${unit.id}`)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nome da Unidade *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={unit.name}
            placeholder="Ex: Apto 101, Suite Master, Quarto 1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerId">Proprietario</Label>
          <Select name="ownerId" defaultValue={unit.ownerId || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Herdar do imovel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Herdar do imovel</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Deixe vazio para usar o proprietario do imovel
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={unit.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
              <SelectItem value="MAINTENANCE">Manutencao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Quartos *</Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min="0"
            defaultValue={unit.bedrooms}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Banheiros *</Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min="0"
            defaultValue={unit.bathrooms}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxGuests">Max. Hospedes *</Label>
          <Input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min="1"
            defaultValue={unit.maxGuests}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={unit.description || ""}
          placeholder="Descricao da unidade..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amenities">Comodidades</Label>
        <Input
          id="amenities"
          name="amenities"
          defaultValue={unit.amenities?.join(", ") || ""}
          placeholder="Wi-Fi, Ar condicionado, TV (separados por virgula)"
        />
        <p className="text-xs text-muted-foreground">
          Separe as comodidades por virgula
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cleaningFee">Taxa de Limpeza (R$)</Label>
          <Input
            id="cleaningFee"
            name="cleaningFee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={Number(unit.cleaningFee)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminFeePercent">Taxa Admin. (%)</Label>
          <Input
            id="adminFeePercent"
            name="adminFeePercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={Number(unit.adminFeePercent)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Alteracoes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
