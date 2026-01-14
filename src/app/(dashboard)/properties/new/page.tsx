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
import { createProperty } from "@/actions/properties"
import { getOwners } from "@/actions/owners"
import { useToast } from "@/hooks/use-toast"

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

type Owner = {
  id: string
  name: string
}

export default function NewPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  useEffect(() => {
    getOwners().then((data) => setOwners(data))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data = {
      name: formData.get("name") as string,
      ownerId: formData.get("ownerId") as string,
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
    }

    try {
      const result = await createProperty(data)
      if (result.success) {
        toast({
          title: "Imovel criado",
          description: "O imovel foi cadastrado com sucesso.",
        })
        router.push("/properties")
      }
    } catch (err) {
      setError("Erro ao criar imovel. Verifique os dados e tente novamente.")
      toast({
        title: "Erro",
        description: "Nao foi possivel criar o imovel.",
        variant: "destructive",
      })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Imovel</h1>
          <p className="text-muted-foreground">
            Cadastre um novo imovel no sistema
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
                  placeholder="Ex: Apartamento 101 - Copacabana"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerId">Proprietario *</Label>
                <Select name="ownerId" required disabled={isLoading}>
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
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva o imovel..."
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
                  placeholder="Rua, numero, complemento"
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
                    placeholder="Cidade"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select name="state" required disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
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
                  placeholder="00000-000"
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
                    defaultValue="1"
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
                    defaultValue="1"
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
                    defaultValue="2"
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
                  defaultValue="0"
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
                  defaultValue="20"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href="/properties">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Criar Imovel"}
          </Button>
        </div>
      </form>
    </div>
  )
}
