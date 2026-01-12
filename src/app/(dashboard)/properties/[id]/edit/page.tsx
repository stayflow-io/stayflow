"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { getPropertyById, updateProperty } from "@/actions/properties"
import { getOwners } from "@/actions/owners"

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

const AMENIDADES = [
  "wifi", "ar-condicionado", "tv", "cozinha equipada", "maquina de lavar",
  "secadora", "piscina", "churrasqueira", "estacionamento", "academia",
  "varanda", "vista mar", "pet friendly", "berco"
]

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "MAINTENANCE", label: "Em Manutencao" },
]

type Owner = { id: string; name: string }
type Property = {
  id: string
  name: string
  ownerId: string
  address: string
  city: string
  state: string
  zipcode: string | null
  bedrooms: number
  bathrooms: number
  maxGuests: number
  description: string | null
  amenities: string[]
  cleaningFee: any
  adminFeePercent: any
  status: string
}

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE")
  const [selectedOwner, setSelectedOwner] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      const [propertyData, ownersData] = await Promise.all([
        getPropertyById(params.id),
        getOwners(),
      ])

      if (propertyData) {
        setProperty(propertyData)
        setSelectedAmenities(propertyData.amenities)
        setSelectedStatus(propertyData.status)
        setSelectedOwner(propertyData.ownerId)
      }
      setOwners(ownersData)
    }
    loadData()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data = {
      name: formData.get("name") as string,
      ownerId: selectedOwner,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipcode: formData.get("zipcode") as string || undefined,
      bedrooms: Number(formData.get("bedrooms")),
      bathrooms: Number(formData.get("bathrooms")),
      maxGuests: Number(formData.get("maxGuests")),
      description: formData.get("description") as string || undefined,
      amenities: selectedAmenities,
      cleaningFee: Number(formData.get("cleaningFee") || 0),
      adminFeePercent: Number(formData.get("adminFeePercent") || 20),
      status: selectedStatus,
    }

    try {
      const result = await updateProperty(params.id, data)
      if (result.success) {
        router.push(`/properties/${params.id}`)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao atualizar imovel. Verifique os dados e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Imovel</h1>
          <p className="text-muted-foreground">
            {property.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Basicas</CardTitle>
              <CardDescription>
                Dados principais do imovel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Imovel *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={property.name}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerId">Proprietario *</Label>
                <Select
                  value={selectedOwner}
                  onValueChange={setSelectedOwner}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietario" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={property.description || ""}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereco</CardTitle>
              <CardDescription>
                Localizacao do imovel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereco *</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={property.address}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={property.city}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select name="state" defaultValue={property.state} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipcode">CEP</Label>
                <Input
                  id="zipcode"
                  name="zipcode"
                  defaultValue={property.zipcode || ""}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacidade</CardTitle>
              <CardDescription>
                Estrutura do imovel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Quartos *</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    defaultValue={property.bedrooms}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Banheiros *</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    defaultValue={property.bathrooms}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxGuests">Hospedes *</Label>
                  <Input
                    id="maxGuests"
                    name="maxGuests"
                    type="number"
                    min="1"
                    defaultValue={property.maxGuests}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comodidades</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENIDADES.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        selectedAmenities.includes(amenity)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>
                Taxas e comissoes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cleaningFee">Taxa de Limpeza (R$)</Label>
                <Input
                  id="cleaningFee"
                  name="cleaningFee"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={Number(property.cleaningFee)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminFeePercent">Taxa Administrativa (%)</Label>
                <Input
                  id="adminFeePercent"
                  name="adminFeePercent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={Number(property.adminFeePercent)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href={`/properties/${params.id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
