import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { getPropertyById } from "@/actions/properties"
import { getOwners } from "@/actions/owners"
import { UnitForm } from "./unit-form"

interface Props {
  params: { id: string }
}

export default async function NewUnitPage({ params }: Props) {
  const [property, owners] = await Promise.all([
    getPropertyById(params.id),
    getOwners(),
  ])

  if (!property) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${property.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Unidade</h1>
          <p className="text-muted-foreground">
            Adicionar unidade em {property.name}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Unidade</CardTitle>
          <CardDescription>
            Preencha os dados da nova unidade. Campos com * sao obrigatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnitForm propertyId={property.id} owners={owners} defaultOwnerId={property.ownerId} />
        </CardContent>
      </Card>
    </div>
  )
}
