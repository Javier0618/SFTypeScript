"use client"

import { ArrowLeft, PlayCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  videoUrl?: string | null
  loadingText?: string
  emptyText?: string
  className?: string
  showBackButton?: boolean
  backButtonClassName?: string
  // 1. AÑADIDO: Propiedad opcional para manejar el click en la flecha
  onBack?: () => void 
}

export function VideoPlayer({
  videoUrl,
  loadingText = "Cargando...",
  emptyText = "Video no disponible",
  className,
  showBackButton = true,
  backButtonClassName,
  // 2. AÑADIDO: Recibimos la función
  onBack, 
}: VideoPlayerProps) {
  const navigate = useNavigate()

  // 3. LÓGICA: Si nos pasan 'onBack', lo usamos. Si no, vamos al inicio.
  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else {
      navigate("/")
    }
  }

  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {showBackButton && (
        <button
          onClick={handleBackClick} // <--- 4. Conectamos el evento
          className={cn(
            "absolute top-4 left-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors",
            backButtonClassName,
          )}
          aria-label="Volver"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      {videoUrl ? (
        <iframe src={videoUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
          <PlayCircle className="w-12 h-12 opacity-50" />
          <span className="text-sm">{videoUrl === null ? emptyText : loadingText}</span>
        </div>
      )}
    </div>
  )
}