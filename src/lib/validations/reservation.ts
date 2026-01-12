import { z } from "zod"

export const reservationSchema = z.object({
  propertyId: z.string().min(1, "Imovel e obrigatorio"),
  guestName: z.string().min(1, "Nome do hospede e obrigatorio"),
  guestEmail: z.string().email("Email invalido").optional().or(z.literal("")),
  guestPhone: z.string().optional(),
  checkinDate: z.coerce.date(),
  checkoutDate: z.coerce.date(),
  numGuests: z.number().min(1, "Minimo 1 hospede"),
  totalAmount: z.number().min(0, "Valor deve ser positivo"),
  cleaningFee: z.number().min(0).optional().default(0),
  channelFee: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
}).refine((data) => data.checkoutDate > data.checkinDate, {
  message: "Data de checkout deve ser posterior ao checkin",
  path: ["checkoutDate"],
})

export const reservationUpdateSchema = z.object({
  guestName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestPhone: z.string().optional(),
  checkinDate: z.coerce.date().optional(),
  checkoutDate: z.coerce.date().optional(),
  numGuests: z.number().min(1).optional(),
  totalAmount: z.number().min(0).optional(),
  cleaningFee: z.number().min(0).optional(),
  channelFee: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"]).optional(),
})

export type ReservationInput = z.infer<typeof reservationSchema>
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>
