import { z } from "zod"

export const propertySchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  ownerId: z.string().optional().nullable(), // Opcional - owner padrão das units
  address: z.string().min(1, "Endereco e obrigatorio"),
  city: z.string().min(1, "Cidade e obrigatoria"),
  state: z.string().min(2, "Estado e obrigatorio"),
  zipcode: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional().default([]), // Amenidades do prédio/complexo
})

export const propertyUpdateSchema = propertySchema.partial()

export type PropertyInput = z.infer<typeof propertySchema>
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>
