import type { User, Tenant, Property, Reservation, Task, Owner } from "@prisma/client"

// Extended types for includes
export type PropertyWithOwner = Property & {
  owner: Owner
}

export type PropertyWithDetails = Property & {
  owner: Owner
  photos: { url: string; order: number }[]
  _count: { reservations: number }
}

export type ReservationWithDetails = Reservation & {
  property: Property
  channel?: { name: string } | null
}

export type TaskWithDetails = Task & {
  property: Property
  reservation?: Reservation | null
  assignedTo?: { name: string } | null
}

// Auth types
declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: string
    tenantId: string
    tenantName: string
  }

  interface Session {
    user: User
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: string
    tenantId: string
    tenantName: string
  }
}
