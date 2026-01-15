import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { getUnit } from "@/actions/units"
import { getOwners } from "@/actions/owners"
import { EditUnitForm } from "./edit-unit-form"

interface Props {
  params: { id: string; unitId: string }
}

export default async function EditUnitPage({ params }: Props) {
  const [unit, owners] = await Promise.all([
    getUnit(params.unitId),
    getOwners(),
  ])

  if (!unit || unit.property.id !== params.id) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${params.id}/units/${unit.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Unidade</h1>
          <p className="text-muted-foreground">
            {unit.name} - {unit.property.name}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Unidade</CardTitle>
          <CardDescription>
            Atualize os dados da unidade. Campos com * sao obrigatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditUnitForm unit={unit} owners={owners} />
        </CardContent>
      </Card>
    </div>
  )
}
