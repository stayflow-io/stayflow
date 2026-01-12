"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Copy, Check, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Props {
  propertyId: string
  propertyName: string
}

export function ICalLink({ propertyId, propertyName }: Props) {
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const icalUrl = `${baseUrl}/api/ical/${propertyId}`

  async function handleCopy() {
    await navigator.clipboard.writeText(icalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Calendar className="h-4 w-4 mr-2" />
          Exportar Calendario (iCal)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calendario iCal - {propertyName}</DialogTitle>
          <DialogDescription>
            Use este link para sincronizar as reservas com seu calendario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={icalUrl} readOnly className="text-sm" />
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Como usar:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Google Calendar:</strong> Configuracoes {">"} Adicionar calendario {">"} De URL
              </li>
              <li>
                <strong>Apple Calendar:</strong> Arquivo {">"} Nova Assinatura de Calendario
              </li>
              <li>
                <strong>Outlook:</strong> Adicionar calendario {">"} Assinar da web
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href={icalUrl} download>
                <Calendar className="h-4 w-4 mr-2" />
                Baixar .ics
              </a>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icalUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Google
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
