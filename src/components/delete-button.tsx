"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Trash2 } from "lucide-react"

interface DeleteButtonProps {
  id: string
  itemName: string
  itemType: "property" | "owner" | "reservation" | "task"
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>
  redirectTo: string
}

export function DeleteButton({
  id,
  itemName,
  itemType,
  onDelete,
  redirectTo,
}: DeleteButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const typeLabels = {
    property: "imovel",
    owner: "proprietario",
    reservation: "reserva",
    task: "tarefa",
  }

  async function handleDelete() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await onDelete(id)
      if (result.success) {
        setOpen(false)
        router.push(redirectTo)
        router.refresh()
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Erro ao excluir. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {typeLabels[itemType]}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{itemName}</strong>? Esta acao nao pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
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
  )
}
