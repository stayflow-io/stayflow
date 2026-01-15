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
import { createReservation } from "@/actions/reservations"
import { getAllProperties } from "@/actions/properties"
import { getUnits } from "@/actions/units"
import { useToast } from "@/hooks/use-toast"

type Property = {
  id: string
  name: string
}

type Unit = {
  id: string
  name: string
  propertyId: string
  maxGuests: number
  cleaningFee: unknown // Decimal from Prisma
}

export default function NewReservationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  useEffect(() => {
    getAllProperties().then((data) => setProperties(data))
  }, [])

  async function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId)
    setSelectedUnit(null)
    const unitsResult = await getUnits({ propertyId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUnits(unitsResult.items as any[])
  }

  function handleUnitChange(unitId: string) {
    const unit = units.find((u) => u.id === unitId)
    setSelectedUnit(unit || null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createReservation(formData)
      if (result.success) {
        toast({
          title: "Reserva criada",
          description: "A reserva foi cadastrada com sucesso.",
        })
        router.push("/reservations")
      } else if (result.error) {
        setError(result.error)
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      setError("Erro ao criar reserva. Verifique os dados e tente novamente.")
      toast({
        title: "Erro",
        description: "Nao foi possivel criar a reserva.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reservations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Reserva</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova reserva manual
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Imovel e Hospede</CardTitle>
              <CardDescription>
                Selecione o imovel, unidade e informe os dados do hospede
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="propertyId">Imovel *</Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={handlePropertyChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o imovel" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitId">Unidade *</Label>
                <Select
                  name="unitId"
                  required
                  disabled={isLoading || !selectedPropertyId}
                  onValueChange={handleUnitChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedPropertyId ? "Selecione a unidade" : "Selecione um imovel primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} (max {unit.maxGuests} hospedes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestName">Nome do Hospede *</Label>
                <Input
                  id="guestName"
                  name="guestName"
                  placeholder="Nome completo"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input
                    id="guestEmail"
                    name="guestEmail"
                    type="email"
                    placeholder="email@exemplo.com"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Telefone</Label>
                  <Input
                    id="guestPhone"
                    name="guestPhone"
                    placeholder="(11) 99999-9999"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numGuests">Numero de Hospedes *</Label>
                <Input
                  id="numGuests"
                  name="numGuests"
                  type="number"
                  min="1"
                  max={selectedUnit?.maxGuests || 10}
                  defaultValue="1"
                  required
                  disabled={isLoading}
                />
                {selectedUnit && (
                  <p className="text-xs text-muted-foreground">
                    Maximo: {selectedUnit.maxGuests} hospedes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datas e Valores</CardTitle>
              <CardDescription>
                Periodo da estadia e valores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkinDate">Check-in *</Label>
                  <Input
                    id="checkinDate"
                    name="checkinDate"
                    type="date"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkoutDate">Check-out *</Label>
                  <Input
                    id="checkoutDate"
                    name="checkoutDate"
                    type="date"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Valor Total (R$) *</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cleaningFee">Taxa de Limpeza (R$)</Label>
                  <Input
                    id="cleaningFee"
                    name="cleaningFee"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={selectedUnit ? Number(selectedUnit.cleaningFee) : 0}
                    key={selectedUnit?.id || "no-unit"} // Force re-render when unit changes
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channelFee">Taxa do Canal (R$)</Label>
                  <Input
                    id="channelFee"
                    name="channelFee"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Informacoes adicionais sobre a reserva..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href="/reservations">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading || !selectedUnit}>
            {isLoading ? "Salvando..." : "Criar Reserva"}
          </Button>
        </div>
      </form>
    </div>
  )
}
