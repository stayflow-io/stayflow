import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, FileText, Calendar } from "lucide-react"
import { ReportExportForm } from "./report-export-form"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatorios</h1>
        <p className="text-muted-foreground">
          Exporte dados para analise e controle
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Relatorio de Reservas
            </CardTitle>
            <CardDescription>
              Exporte todas as reservas com detalhes de hospedes, valores e status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportExportForm
              reportType="reservations"
              description="Inclui: hospede, imovel, datas, valores, status"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Relatorio Financeiro
            </CardTitle>
            <CardDescription>
              Exporte todas as transacoes financeiras do periodo selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportExportForm
              reportType="financial"
              description="Inclui: data, tipo, categoria, imovel, valor"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Excel (.xlsx):</strong> Formato ideal para analise em planilhas com formatacao e filtros.
          </p>
          <p>
            <strong>CSV:</strong> Formato universal, compativel com qualquer software de planilhas.
          </p>
          <p>
            <strong>Periodo:</strong> Se nenhum periodo for selecionado, todos os registros serao exportados.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
