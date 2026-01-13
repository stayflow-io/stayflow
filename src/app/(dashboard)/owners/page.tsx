import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Mail, Phone, Building2 } from "lucide-react"
import { getOwners } from "@/actions/owners"

export default async function OwnersPage() {
  const owners = await getOwners()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Proprietarios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os proprietarios dos imoveis
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/owners/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Proprietario
          </Link>
        </Button>
      </div>

      {owners.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Proprietarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum proprietario cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {owners.map((owner) => (
            <Link key={owner.id} href={`/owners/${owner.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{owner.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {owner.email}
                  </div>
                  {owner.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {owner.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground pt-2 border-t mt-2">
                    <Building2 className="h-4 w-4 mr-2" />
                    {owner._count.properties} {owner._count.properties === 1 ? "imovel" : "imoveis"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
