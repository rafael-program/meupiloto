// components/ImageUpload.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Camera, X, Upload, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImage?: string | null
  folder?: string
}

export function ImageUpload({ onUpload, currentImage, folder = 'riders' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = async (file: File) => {
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida (JPEG, PNG, GIF)')
      return
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB')
      return
    }

    setUploading(true)
    setError(null)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Fazer upload
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('rider-photos')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      setError('Erro ao fazer upload da imagem')
      setUploading(false)
      return
    }

    // Pegar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('rider-photos')
      .getPublicUrl(filePath)

    onUpload(publicUrl)
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onUpload('')
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-amber-300"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-amber-500 transition">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Foto</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        Clique para adicionar foto (max 2MB)
      </p>
    </div>
  )
}