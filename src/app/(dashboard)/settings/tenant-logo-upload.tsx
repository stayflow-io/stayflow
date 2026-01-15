"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/ui/image-upload"
import { updateTenantLogo } from "@/actions/tenant"
import { useToast } from "@/hooks/use-toast"

interface Props {
  currentLogo: string | null
}

export function TenantLogoUpload({ currentLogo }: Props) {
  const { update: updateSession } = useSession()
  const router = useRouter()
  const [logo, setLogo] = useState<string | null>(currentLogo)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  async function handleChange(url: string | null) {
    setLogo(url)
    setIsSaving(true)

    const result = await updateTenantLogo(url)

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
      setLogo(currentLogo) // Reverter
    } else {
      toast({
        title: "Sucesso",
        description: url ? "Logo atualizada com sucesso" : "Logo removida com sucesso",
      })
      // Atualizar a sessao para refletir a nova logo no sidebar
      await updateSession({ tenantLogo: url })
      router.refresh()
    }

    setIsSaving(false)
  }

  return (
    <div className="w-32">
      <ImageUpload
        value={logo}
        onChange={handleChange}
        folder="logos"
        aspectRatio="square"
        placeholder="Adicionar logo"
      />
      {isSaving && (
        <p className="text-xs text-muted-foreground mt-1 text-center">Salvando...</p>
      )}
    </div>
  )
}
