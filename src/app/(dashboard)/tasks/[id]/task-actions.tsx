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
import { MoreHorizontal, CheckCircle, PlayCircle, XCircle, Edit, Trash2 } from "lucide-react"
import { completeTask, deleteTask } from "@/actions/tasks"
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
  taskId: string
  currentStatus: string
  taskTitle: string
}

export function TaskActions({ taskId, currentStatus, taskTitle }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function handleComplete() {
    setIsLoading(true)
    try {
      await completeTask(taskId)
      router.refresh()
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const result = await deleteTask(taskId)
      if (result.success) {
        router.push("/tasks")
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const canComplete = ["PENDING", "IN_PROGRESS"].includes(currentStatus)
  const canEdit = ["PENDING", "IN_PROGRESS"].includes(currentStatus)
  const canDelete = currentStatus !== "COMPLETED"

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/tasks/${taskId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        )}
        {canComplete && (
          <Button onClick={handleComplete} disabled={isLoading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? "Concluindo..." : "Concluir"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canDelete && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Tarefa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa <strong>{taskTitle}</strong>? Esta acao nao pode ser desfeita.
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
