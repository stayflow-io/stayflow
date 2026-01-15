"use client"

import { getAmenityIcon } from "@/lib/utils/amenity-icons"

interface AmenityBadgeProps {
  amenity: string
  className?: string
}

export function AmenityBadge({ amenity, className = "" }: AmenityBadgeProps) {
  const Icon = getAmenityIcon(amenity)

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm ${className}`}
    >
      <Icon className="h-3 w-3" />
      {amenity}
    </div>
  )
}
