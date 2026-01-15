"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Lock, Loader2 } from "lucide-react"
import { createBulkCalendarBlocks, getUnitsForBulkBlock } from "@/actions/calendar"
import { format } from "date-fns"

type PropertyWithUnits = {
  id: string
  name: string
  units: { id: string; name: string }[]
}

export function BulkBlockDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [properties, setProperties] = useState<PropertyWithUnits[]>([])
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  // Carregar propriedades quando abrir o dialog
  useEffect(() => {
    if (open) {
      setIsFetching(true)
      getUnitsForBulkBlock()
        .then(setProperties)
        .catch(console.error)
        .finally(() => setIsFetching(false))
    }
  }, [open])

  // Resetar estado quando fechar
  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setSelectedUnits(new Set())
      setStartDate("")
      setEndDate("")
      setReason("")
      setError("")
    }
  }

  // Toggle seleção de unidade
  function toggleUnit(unitId: string) {
    const newSelected = new Set(selectedUnits)
    if (newSelected.has(unitId)) {
      newSelected.delete(unitId)
    } else {
      newSelected.add(unitId)
    }
    setSelectedUnits(newSelected)
  }

  // Toggle todas as unidades de uma propriedade
  function toggleProperty(property: PropertyWithUnits) {
    const unitIds = property.units.map((u) => u.id)
    const allSelected = unitIds.every((id) => selectedUnits.has(id))

    const newSelected = new Set(selectedUnits)
    if (allSelected) {
      unitIds.forEach((id) => newSelected.delete(id))
    } else {
      unitIds.forEach((id) => newSelected.add(id))
    }
    setSelectedUnits(newSelected)
  }

  // Selecionar/desselecionar todas
  function toggleAll() {
    const allUnitIds = properties.flatMap((p) => p.units.map((u) => u.id))
    const allSelected = allUnitIds.every((id) => selectedUnits.has(id))

    if (allSelected) {
      setSelectedUnits(new Set())
    } else {
      setSelectedUnits(new Set(allUnitIds))
    }
  }

  // Verificar se propriedade está totalmente selecionada
  function isPropertySelected(property: PropertyWithUnits) {
    return property.units.every((u) => selectedUnits.has(u.id))
  }

  // Verificar se propriedade está parcialmente selecionada
  function isPropertyIndeterminate(property: PropertyWithUnits) {
    const selectedCount = property.units.filter((u) => selectedUnits.has(u.id)).length
    return selectedCount > 0 && selectedCount < property.units.length
  }

  async function handleSubmit() {
    setError("")

    if (selectedUnits.size === 0) {
      setError("Selecione pelo menos uma unidade")
      return
    }

    if (!startDate || !endDate) {
      setError("Preencha as datas de inicio e fim")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      setError("Data inicial deve ser anterior a data final")
      return
    }

    setIsLoading(true)
    try {
      const result = await createBulkCalendarBlocks({
        unitIds: Array.from(selectedUnits),
        startDate: start,
        endDate: end,
        reason: reason || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch (err) {
      setError("Erro ao criar bloqueios")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const allUnitIds = properties.flatMap((p) => p.units.map((u) => u.id))
  const allSelected = allUnitIds.length > 0 && allUnitIds.every((id) => selectedUnits.has(id))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="h-4 w-4 mr-2" />
          Bloqueio em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bloquear Multiplas Unidades</DialogTitle>
          <DialogDescription>
            Selecione as unidades e o periodo para criar bloqueios em lote.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ex: Manutencao, Ferias, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Seleção de unidades */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Unidades</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                >
                  {allSelected ? "Desmarcar todas" : "Selecionar todas"}
                </Button>
              </div>

              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {properties.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    Nenhuma unidade disponivel
                  </p>
                ) : (
                  properties.map((property) => (
                    <div key={property.id} className="border-b last:border-b-0">
                      {/* Header da propriedade */}
                      <div
                        className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => toggleProperty(property)}
                      >
                        <Checkbox
                          checked={isPropertyIndeterminate(property) ? "indeterminate" : isPropertySelected(property)}
                        />
                        <span className="font-medium text-sm">{property.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({property.units.filter((u) => selectedUnits.has(u.id)).length}/{property.units.length})
                        </span>
                      </div>

                      {/* Unidades */}
                      <div className="pl-8 pr-3 py-2 space-y-2">
                        {property.units.map((unit) => (
                          <div
                            key={unit.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 p-1 rounded"
                            onClick={() => toggleUnit(unit.id)}
                          >
                            <Checkbox
                              checked={selectedUnits.has(unit.id)}
                            />
                            <span className="text-sm">{unit.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedUnits.size > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedUnits.size} unidade{selectedUnits.size !== 1 ? "s" : ""} selecionada{selectedUnits.size !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isFetching}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Criar Bloqueios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
