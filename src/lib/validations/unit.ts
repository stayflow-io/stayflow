import { z } from "zod"

export const unitSchema = z.object({
  propertyId: z.string().min(1, "Propriedade e obrigatoria"),
  ownerId: z.string().optional().nullable(),
  name: z.string().min(1, "Nome e obrigatorio"),
  bedrooms: z.number().min(0, "Quartos deve ser 0 ou mais"),
  bathrooms: z.number().min(0, "Banheiros deve ser 0 ou mais"),
  maxGuests: z.number().min(1, "Capacidade minima e 1 hospede"),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  cleaningFee: z.number().min(0).optional().default(0),
  adminFeePercent: z.number().min(0).max(100).optional().default(20),
})

export const unitUpdateSchema = z.object({
  ownerId: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  maxGuests: z.number().min(1).optional(),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional(),
  cleaningFee: z.number().min(0).optional(),
  adminFeePercent: z.number().min(0).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
})

export type UnitInput = z.infer<typeof unitSchema>
export type UnitUpdateInput = z.infer<typeof unitUpdateSchema>
