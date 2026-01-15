/**
 * Returns the effective owner ID for a unit
 * If unit has its own owner, use that. Otherwise, inherit from property.
 */
export function getEffectiveOwnerId(unit: { ownerId: string | null; property: { ownerId: string | null } }): string | null {
  return unit.ownerId || unit.property.ownerId
}
