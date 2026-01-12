import { z } from "zod"

export const propertySchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  ownerId: z.string().min(1, "Proprietario e obrigatorio"),
  address: z.string().min(1, "Endereco e obrigatorio"),
  city: z.string().min(1, "Cidade e obrigatoria"),
  state: z.string().min(2, "Estado e obrigatorio"),
  zipcode: z.string().optional(),
  bedrooms: z.number().min(0, "Quartos deve ser 0 ou mais"),
  bathrooms: z.number().min(0, "Banheiros deve ser 0 ou mais"),
  maxGuests: z.number().min(1, "Capacidade minima e 1 hospede"),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional().default([]),
  cleaningFee: z.number().min(0).optional().default(0),
  adminFeePercent: z.number().min(0).max(100).optional().default(20),
})

export const propertyUpdateSchema = propertySchema.partial()

export type PropertyInput = z.infer<typeof propertySchema>
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>
