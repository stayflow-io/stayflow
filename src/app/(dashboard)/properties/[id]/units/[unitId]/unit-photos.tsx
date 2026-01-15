"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Plus, Trash2, Loader2 } from "lucide-react"
import { addUnitPhoto, removeUnitPhoto } from "@/actions/units"
import { useToast } from "@/hooks/use-toast"

interface Photo {
  id: string
  url: string
  order: number
}

interface Props {
  unitId: string
  photos: Photo[]
}

export function UnitPhotos({ unitId, photos: initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Apenas imagens sao permitidas", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "Imagem deve ter no maximo 5MB", variant: "destructive" })
      return
    }

    setIsUploading(true)

    try {
      // Upload to Vercel Blob
      const uploadResponse = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=units/${unitId}`,
        { method: "POST", body: file }
      )

      if (!uploadResponse.ok) throw new Error("Erro no upload")

      const blob = await uploadResponse.json()

      // Save to database
      const result = await addUnitPhoto(unitId, blob.url)

      if (result.error) {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      } else if (result.photo) {
        setPhotos([...photos, result.photo])
        toast({ title: "Sucesso", description: "Foto adicionada" })
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao fazer upload", variant: "destructive" })
    } finally {
      setIsUploading(false)
      // Reset input
      event.target.value = ""
    }
  }

  async function handleDelete(photoId: string) {
    setDeletingId(photoId)

    const result = await removeUnitPhoto(photoId)

    if (result.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
    } else {
      setPhotos(photos.filter((p) => p.id !== photoId))
      toast({ title: "Sucesso", description: "Foto removida" })
    }

    setDeletingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Fotos ({photos.length})
          </CardTitle>
          <div>
            <input
              type="file"
              id="photo-upload"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              size="sm"
              onClick={() => document.getElementById("photo-upload")?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar Foto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma foto cadastrada</p>
            <p className="text-sm">Adicione fotos para mostrar a unidade</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted group"
              >
                <Image
                  src={photo.url}
                  alt="Foto da unidade"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletingId === photo.id}
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
