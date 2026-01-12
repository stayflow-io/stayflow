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
import { getReservation, updateReservation } from "@/actions/reservations"
import { getAllProperties } from "@/actions/properties"

type Property = {
  id: string
  name: string
  maxGuests: number
  cleaningFee: any
}

type Reservation = {
  id: string
  propertyId: string
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  checkinDate: Date
  checkoutDate: Date
  numGuests: number
  totalAmount: any
  cleaningFee: any
  channelFee: any
  notes: string | null
  status: string
}

export default function EditReservationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  useEffect(() => {
    async function loadData() {
      const [reservationData, propertiesData] = await Promise.all([
        getReservation(params.id),
        getAllProperties(),
      ])

      if (reservationData) {
        setReservation(reservationData)
        const property = propertiesData.find((p) => p.id === reservationData.propertyId)
        setSelectedProperty(property || null)
      }
      setProperties(propertiesData)
    }
    loadData()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await updateReservation(params.id, formData)
      if (result.success) {
        router.push(`/reservations/${params.id}`)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao atualizar reserva. Verifique os dados e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  function handlePropertyChange(propertyId: string) {
    const property = properties.find((p) => p.id === propertyId)
    setSelectedProperty(property || null)
  }

  function formatDateForInput(date: Date) {
    return new Date(date).toISOString().split("T")[0]
  }

  if (!reservation) {
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
          <Link href={`/reservations/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Reserva</h1>
          <p className="text-muted-foreground">
            {reservation.guestName}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Imovel e Hospede</CardTitle>
              <CardDescription>
                Dados do imovel e do hospede
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
                  name="propertyId"
                  required
                  disabled={isLoading}
                  defaultValue={reservation.propertyId}
                  onValueChange={handlePropertyChange}
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
                <Label htmlFor="guestName">Nome do Hospede *</Label>
                <Input
                  id="guestName"
                  name="guestName"
                  defaultValue={reservation.guestName}
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
                    defaultValue={reservation.guestEmail || ""}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Telefone</Label>
                  <Input
                    id="guestPhone"
                    name="guestPhone"
                    defaultValue={reservation.guestPhone || ""}
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
                  max={selectedProperty?.maxGuests || 10}
                  defaultValue={reservation.numGuests}
                  required
                  disabled={isLoading}
                />
                {selectedProperty && (
                  <p className="text-xs text-muted-foreground">
                    Maximo: {selectedProperty.maxGuests} hospedes
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
                    defaultValue={formatDateForInput(reservation.checkinDate)}
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
                    defaultValue={formatDateForInput(reservation.checkoutDate)}
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
                  defaultValue={Number(reservation.totalAmount)}
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
                    defaultValue={Number(reservation.cleaningFee)}
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
                    defaultValue={Number(reservation.channelFee)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={reservation.notes || ""}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href={`/reservations/${params.id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
