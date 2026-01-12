"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, Clock, Trash2 } from "lucide-react"
import { updatePayoutStatus, deletePayout } from "@/actions/payouts"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  payoutId: string
  currentStatus: string
  ownerName: string
}

export function PayoutActions({ payoutId, currentStatus, ownerName }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setIsLoading(true)
    try {
      const result = await updatePayoutStatus(payoutId, newStatus)
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deletePayout(payoutId)
      if (result.success) {
        router.push("/financial/payouts")
      }
    } catch (error) {
      console.error("Erro ao excluir repasse:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const canMarkPaid = currentStatus !== "PAID"
  const canDelete = currentStatus !== "PAID"

  return (
    <>
      <div className="flex items-center gap-2">
        {canMarkPaid && (
          <Button onClick={() => handleStatusChange("PAID")} disabled={isLoading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? "Processando..." : "Marcar como Pago"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentStatus === "PENDING" && (
              <DropdownMenuItem onClick={() => handleStatusChange("PROCESSING")}>
                <Clock className="h-4 w-4 mr-2" />
                Marcar como Processando
              </DropdownMenuItem>
            )}
            {currentStatus === "PROCESSING" && (
              <DropdownMenuItem onClick={() => handleStatusChange("PENDING")}>
                <Clock className="h-4 w-4 mr-2" />
                Voltar para Pendente
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Repasse
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir repasse?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o repasse de <strong>{ownerName}</strong>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
