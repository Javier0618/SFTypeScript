import { useEffect, useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  getAllMovies,
  getAllTVShows,
  getTabSections,
  getInternalSections,
  getSectionContent,
} from "@/lib/sectionQueries"

interface InitState {
  isInitialized: boolean
  isLoading: boolean
  progress: number
  currentTask: string
}

const getSessionKey = () => {
  if (typeof window !== "undefined") {
    let sessionKey = sessionStorage.getItem("app-session-key")
    if (!sessionKey) {
      sessionKey = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem("app-session-key", sessionKey)
    }
    return sessionKey
  }
  return "default"
}

// ============================================
// CONFIGURACIÓN DE DURACIÓN DE PANTALLA DE CARGA
// ============================================
// Cambia este valor para ajustar cuánto tiempo se muestra
// la pantalla de carga (en milisegundos)
// 1000 = 1 segundo, 2000 = 2 segundos, 3000 = 3 segundos
const MINIMUM_LOADING_DURATION_MS = 2500
// ============================================

export const useAppInitializer = (): InitState => {
  const queryClient = useQueryClient()
  const [state, setState] = useState<InitState>({
    isInitialized: false,
    isLoading: true,
    progress: 0,
    currentTask: "Iniciando...",
  })
  
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    
    const cachedInit = sessionStorage.getItem("app-initialized")
    if (cachedInit === getSessionKey()) {
      setState({
        isInitialized: true,
        isLoading: false,
        progress: 100,
        currentTask: "Listo",
      })
      return
    }

    initRef.current = true

    const initializeApp = async () => {
      const startTime = Date.now()
      
      try {
        setState(prev => ({ ...prev, currentTask: "Cargando películas...", progress: 10 }))
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const movies = await queryClient.fetchQuery({
          queryKey: ["all-movies"],
          queryFn: getAllMovies,
          staleTime: Infinity,
          gcTime: Infinity,
        })

        setState(prev => ({ ...prev, currentTask: "Cargando series...", progress: 25 }))
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const tvShows = await queryClient.fetchQuery({
          queryKey: ["all-series"],
          queryFn: getAllTVShows,
          staleTime: Infinity,
          gcTime: Infinity,
        })

        setState(prev => ({ ...prev, currentTask: "Cargando secciones...", progress: 40 }))
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const tabSections = await queryClient.fetchQuery({
          queryKey: ["tab-sections"],
          queryFn: getTabSections,
          staleTime: Infinity,
          gcTime: Infinity,
        })

        setState(prev => ({ ...prev, currentTask: "Cargando contenido...", progress: 55 }))
        await new Promise(resolve => setTimeout(resolve, 200))

        await queryClient.fetchQuery({
          queryKey: ["internal-sections", "inicio"],
          queryFn: () => getInternalSections("inicio"),
          staleTime: Infinity,
          gcTime: Infinity,
        })

        setState(prev => ({ ...prev, progress: 65 }))

        await queryClient.fetchQuery({
          queryKey: ["internal-sections", "peliculas"],
          queryFn: () => getInternalSections("peliculas"),
          staleTime: Infinity,
          gcTime: Infinity,
        })

        setState(prev => ({ ...prev, progress: 75 }))

        await queryClient.fetchQuery({
          queryKey: ["internal-sections", "series"],
          queryFn: () => getInternalSections("series"),
          staleTime: Infinity,
          gcTime: Infinity,
        })

        setState(prev => ({ ...prev, currentTask: "Preparando pestañas...", progress: 85 }))
        await new Promise(resolve => setTimeout(resolve, 150))

        if (tabSections && tabSections.length > 0) {
          for (const section of tabSections) {
            await queryClient.fetchQuery({
              queryKey: ["custom-section-hero", section.id],
              queryFn: () => getSectionContent(section),
              staleTime: Infinity,
              gcTime: Infinity,
            })

            await queryClient.fetchQuery({
              queryKey: ["section-content", section.id],
              queryFn: () => getSectionContent(section),
              staleTime: Infinity,
              gcTime: Infinity,
            })

            await queryClient.fetchQuery({
              queryKey: ["internal-sections", section.id],
              queryFn: () => getInternalSections(section.id),
              staleTime: Infinity,
              gcTime: Infinity,
            })
          }
        }

        setState(prev => ({ ...prev, currentTask: "Finalizando...", progress: 95 }))

        // Calcular cuánto tiempo falta para cumplir la duración mínima
        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, MINIMUM_LOADING_DURATION_MS - elapsedTime)
        
        // Esperar el tiempo restante si es necesario
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime))
        }

        sessionStorage.setItem("app-initialized", getSessionKey())

        setState({
          isInitialized: true,
          isLoading: false,
          progress: 100,
          currentTask: "Listo",
        })

      } catch (error) {
        console.error("Error initializing app:", error)
        
        // Incluso en error, esperar el tiempo mínimo
        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, MINIMUM_LOADING_DURATION_MS - elapsedTime)
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime))
        }
        
        sessionStorage.setItem("app-initialized", getSessionKey())
        setState({
          isInitialized: true,
          isLoading: false,
          progress: 100,
          currentTask: "Listo",
        })
      }
    }

    initializeApp()
  }, [queryClient])

  return state
}
