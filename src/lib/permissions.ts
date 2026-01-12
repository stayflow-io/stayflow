type Role = "ADMIN" | "MANAGER" | "OPERATOR" | "OWNER"

type Permission =
  | "properties:read"
  | "properties:write"
  | "properties:delete"
  | "reservations:read"
  | "reservations:write"
  | "reservations:delete"
  | "tasks:read"
  | "tasks:write"
  | "tasks:delete"
  | "financial:read"
  | "financial:write"
  | "owners:read"
  | "owners:write"
  | "owners:delete"
  | "users:read"
  | "users:write"
  | "users:delete"
  | "reports:read"
  | "settings:read"
  | "settings:write"

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "properties:read",
    "properties:write",
    "properties:delete",
    "reservations:read",
    "reservations:write",
    "reservations:delete",
    "tasks:read",
    "tasks:write",
    "tasks:delete",
    "financial:read",
    "financial:write",
    "owners:read",
    "owners:write",
    "owners:delete",
    "users:read",
    "users:write",
    "users:delete",
    "reports:read",
    "settings:read",
    "settings:write",
  ],
  MANAGER: [
    "properties:read",
    "properties:write",
    "reservations:read",
    "reservations:write",
    "tasks:read",
    "tasks:write",
    "tasks:delete",
    "financial:read",
    "financial:write",
    "owners:read",
    "owners:write",
    "reports:read",
    "settings:read",
  ],
  OPERATOR: [
    "properties:read",
    "reservations:read",
    "reservations:write",
    "tasks:read",
    "tasks:write",
    "settings:read",
  ],
  OWNER: [
    "properties:read",
    "reservations:read",
    "financial:read",
    "reports:read",
    "settings:read",
  ],
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = rolePermissions[role as Role]
  if (!perms) return false
  return perms.includes(permission)
}

export function checkPermission(role: string, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("Forbidden: You don't have permission to perform this action")
  }
}

export function getPermissionsForRole(role: string): Permission[] {
  return rolePermissions[role as Role] || []
}

export type { Permission, Role }
