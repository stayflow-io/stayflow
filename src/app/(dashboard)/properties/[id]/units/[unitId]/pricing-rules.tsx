"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Loader2, DollarSign, Calendar, Sun } from "lucide-react"
import { createPricingRule, updatePricingRule, deletePricingRule, togglePricingRule, type PricingRuleData } from "@/actions/pricing"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PricingRulesProps {
  unitId: string
  rules: PricingRuleData[]
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terca", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sabado", short: "Sab" },
]

const RULE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  BASE: { label: "Base", icon: <DollarSign className="h-4 w-4" /> },
  SEASONAL: { label: "Temporada", icon: <Sun className="h-4 w-4" /> },
  DAY_OF_WEEK: { label: "Dia da Semana", icon: <Calendar className="h-4 w-4" /> },
  SPECIAL: { label: "Especial", icon: <Calendar className="h-4 w-4" /> },
}

export function PricingRules({ unitId, rules }: PricingRulesProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRuleData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState<string>("BASE")
  const [basePrice, setBasePrice] = useState("")
  const [priority, setPriority] = useState("0")
  const [minNights, setMinNights] = useState("1")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  function resetForm() {
    setName("")
    setType("BASE")
    setBasePrice("")
    setPriority("0")
    setMinNights("1")
    setStartDate("")
    setEndDate("")
    setSelectedDays([])
    setEditingRule(null)
  }

  function openEditDialog(rule: PricingRuleData) {
    setEditingRule(rule)
    setName(rule.name)
    setType(rule.type)
    setBasePrice(rule.basePrice.toString())
    setPriority(rule.priority.toString())
    setMinNights(rule.minNights.toString())
    setStartDate(rule.startDate ? format(new Date(rule.startDate), "yyyy-MM-dd") : "")
    setEndDate(rule.endDate ? format(new Date(rule.endDate), "yyyy-MM-dd") : "")
    setSelectedDays(rule.daysOfWeek)
    setIsDialogOpen(true)
  }

  function toggleDay(day: number) {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.set("unitId", unitId)
      formData.set("name", name)
      formData.set("type", type)
      formData.set("basePrice", basePrice)
      formData.set("priority", priority)
      formData.set("minNights", minNights)
      if (startDate) formData.set("startDate", startDate)
      if (endDate) formData.set("endDate", endDate)
      if (selectedDays.length > 0) formData.set("daysOfWeek", selectedDays.join(","))
      if (editingRule) formData.set("active", editingRule.active.toString())

      const result = editingRule
        ? await updatePricingRule(editingRule.id, formData)
        : await createPricingRule(formData)

      if (result.error) {
        alert(result.error)
      } else {
        setIsDialogOpen(false)
        resetForm()
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const result = await deletePricingRule(id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id)
    try {
      const result = await togglePricingRule(id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Regras de Preco
            </CardTitle>
            <CardDescription>
              Configure precos por temporada, dia da semana ou datas especiais
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Preco"}</DialogTitle>
                <DialogDescription>
                  {editingRule ? "Atualize os dados da regra de precificacao" : "Configure uma nova regra de precificacao para esta unidade"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Alta Temporada, Fim de Semana"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType} disabled={!!editingRule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASE">Preco Base</SelectItem>
                        <SelectItem value="SEASONAL">Temporada</SelectItem>
                        <SelectItem value="DAY_OF_WEEK">Dia da Semana</SelectItem>
                        <SelectItem value="SPECIAL">Data Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      placeholder="0"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Maior = mais prioritario</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Preco por Diaria (R$)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minNights">Min. Diarias</Label>
                    <Input
                      id="minNights"
                      type="number"
                      min="1"
                      value={minNights}
                      onChange={(e) => setMinNights(e.target.value)}
                    />
                  </div>
                </div>

                {(type === "SEASONAL" || type === "SPECIAL") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data Inicial</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data Final</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {type === "DAY_OF_WEEK" && (
                  <div className="space-y-2">
                    <Label>Dias da Semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div
                          key={day.value}
                          className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                            selectedDays.includes(day.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleDay(day.value)}
                        >
                          <span className="text-sm">{day.short}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingRule ? "Salvar" : "Criar Regra"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma regra de preco cadastrada. Adicione uma regra BASE para definir o preco padrao.
          </p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  !rule.active ? "opacity-50 bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {RULE_TYPE_LABELS[rule.type]?.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rule.name}</p>
                      <Badge variant={rule.active ? "default" : "secondary"}>
                        {RULE_TYPE_LABELS[rule.type]?.label}
                      </Badge>
                      {!rule.active && <Badge variant="outline">Inativo</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(rule.basePrice)}
                        /noite
                      </span>
                      {rule.minNights > 1 && (
                        <span>Min. {rule.minNights} noites</span>
                      )}
                      {(rule.type === "SEASONAL" || rule.type === "SPECIAL") && rule.startDate && rule.endDate && (
                        <span>
                          {format(new Date(rule.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(new Date(rule.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      {rule.type === "DAY_OF_WEEK" && rule.daysOfWeek.length > 0 && (
                        <span>
                          {rule.daysOfWeek.map(d => DAYS_OF_WEEK[d].short).join(", ")}
                        </span>
                      )}
                      <span>Prioridade: {rule.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(rule.id)}
                    disabled={togglingId === rule.id}
                  >
                    {togglingId === rule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      rule.active ? "Desativar" : "Ativar"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(rule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Regra</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a regra &quot;{rule.name}&quot;? Esta acao nao pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                        >
                          {deletingId === rule.id ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
