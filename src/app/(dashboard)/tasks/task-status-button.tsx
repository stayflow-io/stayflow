"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Circle, CheckCircle2, Loader2 } from "lucide-react"
import { completeTask } from "@/actions/tasks"

interface Props {
  taskId: string
  currentStatus: string
}

export function TaskStatusButton({ taskId, currentStatus }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleComplete() {
    if (currentStatus === "COMPLETED") return

    setIsLoading(true)
    try {
      await completeTask(taskId)
      router.refresh()
    } catch (error) {
      console.error("Erro ao completar tarefa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  }

  return (
    <button
      onClick={handleComplete}
      className="hover:scale-110 transition-transform"
      title="Marcar como concluida"
    >
      {currentStatus === "COMPLETED" ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500" />
      )}
    </button>
  )
}
