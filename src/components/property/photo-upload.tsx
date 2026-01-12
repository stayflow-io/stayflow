"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, GripVertical, Loader2 } from "lucide-react"
import { uploadPropertyPhoto, deletePropertyPhoto, reorderPropertyPhotos } from "@/actions/photos"

interface Photo {
  id: string
  url: string
  order: number
}

interface Props {
  propertyId: string
  photos: Photo[]
}

export function PhotoUpload({ propertyId, photos: initialPhotos }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState(initialPhotos)
  const [isUploading, setIsUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const result = await uploadPropertyPhoto(propertyId, formData)
        if (result.error) {
          setError(result.error)
        } else if (result.photo) {
          setPhotos((prev) => [...prev, result.photo])
        }
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      router.refresh()
    }
  }

  async function handleDelete(photoId: string) {
    const result = await deletePropertyPhoto(photoId)
    if (result.error) {
      setError(result.error)
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      router.refresh()
    }
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPhotos = [...photos]
    const [removed] = newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(index, 0, removed)
    setPhotos(newPhotos)
    setDraggedIndex(index)
  }

  async function handleDragEnd() {
    if (draggedIndex !== null) {
      const photoIds = photos.map((p) => p.id)
      await reorderPropertyPhotos(propertyId, photoIds)
      router.refresh()
    }
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Fotos do Imovel</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Fotos
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Upload className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma foto cadastrada</p>
              <p className="text-sm">Clique em "Adicionar Fotos" para enviar</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                draggedIndex === index ? "border-primary" : "border-transparent"
              } cursor-move`}
            >
              <div className="aspect-video relative">
                <Image
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <div className="absolute top-2 left-2">
                  <GripVertical className="h-5 w-5 text-white" />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(photo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Arraste as fotos para reordenar. A primeira foto sera usada como imagem principal.
        Formatos aceitos: JPEG, PNG, WebP. Tamanho maximo: 5MB por foto.
      </p>
    </div>
  )
}
