"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { DeleteButton } from "@/components/delete-button"
import { deleteOwner } from "@/actions/owners"

interface Props {
  ownerId: string
  ownerName: string
}

export function OwnerActions({ ownerId, ownerName }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href={`/owners/${ownerId}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Link>
      </Button>
      <DeleteButton
        id={ownerId}
        itemName={ownerName}
        itemType="owner"
        onDelete={deleteOwner}
        redirectTo="/owners"
      />
    </div>
  )
}
