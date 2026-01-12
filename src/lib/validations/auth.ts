import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Senha e obrigatoria"),
})

export const registerSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa e obrigatorio"),
  name: z.string().min(1, "Nome e obrigatorio"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
