"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, LogIn, LogOut, Edit, Trash2 } from "lucide-react"
import { updateReservationStatus, deleteReservation } from "@/actions/reservations"
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
  reservationId: string
  currentStatus: string
  guestName: string
}

export function ReservationActions({ reservationId, currentStatus, guestName }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setIsLoading(true)
    try {
      await updateReservationStatus(reservationId, newStatus)
      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deleteReservation(reservationId)
      if (result.success) {
        router.push("/reservations")
      }
    } catch (error) {
      console.error("Erro ao excluir reserva:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const canConfirm = currentStatus === "PENDING"
  const canCheckin = currentStatus === "CONFIRMED"
  const canCheckout = currentStatus === "CHECKED_IN"
  const canCancel = ["PENDING", "CONFIRMED"].includes(currentStatus)
  const canNoShow = currentStatus === "CONFIRMED"
  const canEdit = ["PENDING", "CONFIRMED"].includes(currentStatus)
  const canDelete = ["PENDING", "CANCELLED"].includes(currentStatus)

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/reservations/${reservationId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              {isLoading ? "Processando..." : "Acoes"}
              <MoreHorizontal className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canConfirm && (
              <DropdownMenuItem onClick={() => handleStatusChange("CONFIRMED")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Reserva
              </DropdownMenuItem>
            )}
            {canCheckin && (
              <DropdownMenuItem onClick={() => handleStatusChange("CHECKED_IN")}>
                <LogIn className="h-4 w-4 mr-2" />
                Registrar Check-in
              </DropdownMenuItem>
            )}
            {canCheckout && (
              <DropdownMenuItem onClick={() => handleStatusChange("CHECKED_OUT")}>
                <LogOut className="h-4 w-4 mr-2" />
                Registrar Check-out
              </DropdownMenuItem>
            )}
            {(canConfirm || canCheckin || canCheckout) && <DropdownMenuSeparator />}
            {canNoShow && (
              <DropdownMenuItem
                onClick={() => handleStatusChange("NO_SHOW")}
                className="text-orange-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Marcar No-show
              </DropdownMenuItem>
            )}
            {canCancel && (
              <DropdownMenuItem
                onClick={() => handleStatusChange("CANCELLED")}
                className="text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Reserva
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
                  Excluir Reserva
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a reserva de <strong>{guestName}</strong>? Esta acao nao pode ser desfeita.
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
