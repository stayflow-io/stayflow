import { z } from "zod"

export const ownerSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  email: z.string().email("Email invalido"),
  phone: z.string().optional(),
  document: z.string().optional(), // CPF/CNPJ
  pixKey: z.string().optional(),
  bankAccount: z.object({
    bank: z.string(),
    agency: z.string(),
    account: z.string(),
  }).optional(),
  commissionPercent: z.number().min(0).max(100).optional().default(20),
})

export const ownerUpdateSchema = ownerSchema.partial()

export type OwnerInput = z.infer<typeof ownerSchema>
export type OwnerUpdateInput = z.infer<typeof ownerUpdateSchema>
