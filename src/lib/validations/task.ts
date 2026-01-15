import { z } from "zod"

export const taskSchema = z.object({
  unitId: z.string().min(1, "Unidade e obrigatoria"),
  reservationId: z.string().optional(),
  type: z.enum(["CLEANING", "MAINTENANCE", "INSPECTION", "OTHER"]),
  title: z.string().min(1, "Titulo e obrigatorio"),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledDate: z.coerce.date(),
  notes: z.string().optional(),
})

export const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  scheduledDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
})

export const taskChecklistSchema = z.object({
  item: z.string().min(1, "Item e obrigatorio"),
  checked: z.boolean().optional().default(false),
  photoUrl: z.string().url().optional(),
})

export type TaskInput = z.infer<typeof taskSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type TaskChecklistInput = z.infer<typeof taskChecklistSchema>
