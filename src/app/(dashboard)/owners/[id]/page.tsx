import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, CreditCard, Building2, Percent, MapPin, Bed, Bath, Users } from "lucide-react"
import { getOwner } from "@/actions/owners"
import { OwnerActions } from "./owner-actions"

interface Props {
  params: { id: string }
}

export default async function OwnerDetailPage({ params }: Props) {
  const owner = await getOwner(params.id)

  if (!owner) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/owners">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{owner.name}</h1>
            <div className="flex items-center text-muted-foreground mt-1">
              <Building2 className="h-4 w-4 mr-1" />
              {owner.properties.length} {owner.properties.length === 1 ? "imovel" : "imoveis"}
            </div>
          </div>
        </div>
        <OwnerActions ownerId={owner.id} ownerName={owner.name} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imoveis do Proprietario</CardTitle>
              <CardDescription>
                Lista de imoveis administrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {owner.properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum imovel cadastrado para este proprietario.
                </p>
              ) : (
                <div className="space-y-4">
                  {owner.properties.map((property) => (
                    <Link key={property.id} href={`/properties/${property.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{property.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.city}, {property.state}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center">
                                <Bed className="h-3 w-3 mr-1" />
                                {property.bedrooms}
                              </span>
                              <span className="flex items-center">
                                <Bath className="h-3 w-3 mr-1" />
                                {property.bathrooms}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {property.maxGuests}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={property.status === "ACTIVE" ? "default" : "secondary"}>
                          {property.status === "ACTIVE" ? "Ativo" : property.status === "INACTIVE" ? "Inativo" : "Manutencao"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {owner.payouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historico de Repasses</CardTitle>
                <CardDescription>
                  Ultimos pagamentos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {owner.payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(payout.periodStart).toLocaleDateString("pt-BR")} - {new Date(payout.periodEnd).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bruto: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(payout.grossAmount))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(payout.netAmount))}
                        </p>
                        <Badge variant={payout.status === "PAID" ? "default" : "outline"}>
                          {payout.status === "PAID" ? "Pago" : payout.status === "PENDING" ? "Pendente" : "Processando"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${owner.email}`} className="hover:underline">
                  {owner.email}
                </a>
              </div>
              {owner.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${owner.phone}`} className="hover:underline">
                    {owner.phone}
                  </a>
                </div>
              )}
              {owner.document && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{owner.document}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Comissao</span>
                </div>
                <span className="font-semibold">{Number(owner.commissionPercent)}%</span>
              </div>

              <Separator />

              {owner.pixKey && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Chave PIX</p>
                  <p className="font-medium">{owner.pixKey}</p>
                </div>
              )}

              {owner.bankAccount && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Conta Bancaria</p>
                  <p className="font-medium">
                    {(owner.bankAccount as any).bank} - Ag: {(owner.bankAccount as any).agency} / CC: {(owner.bankAccount as any).account}
                  </p>
                </div>
              )}

              {!owner.pixKey && !owner.bankAccount && (
                <p className="text-sm text-muted-foreground">
                  Nenhum dado bancario cadastrado
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/properties?owner=${owner.id}`}>
                  Ver todos os imoveis
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/financial?owner=${owner.id}`}>
                  Ver financeiro
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
