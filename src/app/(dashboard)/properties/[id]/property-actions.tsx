"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { DeleteButton } from "@/components/delete-button"
import { deleteProperty } from "@/actions/properties"

interface Props {
  propertyId: string
  propertyName: string
}

export function PropertyActions({ propertyId, propertyName }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href={`/properties/${propertyId}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Link>
      </Button>
      <DeleteButton
        id={propertyId}
        itemName={propertyName}
        itemType="property"
        onDelete={deleteProperty}
        redirectTo="/properties"
      />
    </div>
  )
}
