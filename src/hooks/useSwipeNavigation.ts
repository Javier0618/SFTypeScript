"use client"

import { useEffect, useRef, useCallback } from "react"

interface SwipeNavigationOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  containerRef: React.RefObject<HTMLDivElement>
  totalTabs: number
  currentTabIndex: number
  threshold?: number
}

export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  containerRef,
  totalTabs,
  currentTabIndex,
  threshold = 50,
}: SwipeNavigationOptions) => {
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const currentTranslate = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Actualiza la posición inicial cuando cambia el tab
  useEffect(() => {
    currentTranslate.current = -currentTabIndex * 100
  }, [currentTabIndex])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.innerWidth > 768) return

    const target = e.target as HTMLElement
    const isInteractive = target.closest(
      'button, a, input, select, textarea, .embla, .embla__container, [role="button"], [onclick]'
    )
    if (isInteractive) return
    const isInNavbar = target.closest("nav")
    const isInMobileTabs = target.closest("[data-mobile-tabs]")
    if (isInNavbar || isInMobileTabs) return

    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true

    if (containerRef.current) {
      containerRef.current.style.transition = "none"
    }
  }, [containerRef])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - touchStartX.current
    const diffY = currentY - touchStartY.current

    // Cancelar swipe horizontal si es scroll vertical
    if (Math.abs(diffY) > Math.abs(diffX) * 0.8 && Math.abs(diffY) > 10) {
      isDragging.current = false
      containerRef.current.style.transition = "transform 0.3s ease-out"
      containerRef.current.style.transform = `translateX(${currentTranslate.current}%)`
      return
    }

    const screenWidth = window.innerWidth
    const percentMove = (diffX / screenWidth) * 100
    
    // Calculamos la nueva posición teórica
    let newTranslate = currentTranslate.current + percentMove

    // --- AQUÍ ESTÁ EL CAMBIO ---
    // Bloqueo total en los bordes (Efecto pared)
    
    // Si estamos en el primer tab (0) y deslizamos a la derecha (positivo) -> Bloquear
    if (currentTabIndex === 0 && percentMove > 0) {
       newTranslate = currentTranslate.current;
    } 
    // Si estamos en el último tab y deslizamos a la izquierda (negativo) -> Bloquear
    else if (currentTabIndex === totalTabs - 1 && percentMove < 0) {
       newTranslate = currentTranslate.current;
    }

    // Aplicar la transformación
    containerRef.current.style.transform = `translateX(${newTranslate}%)`
  }, [containerRef, currentTabIndex, totalTabs])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return
    isDragging.current = false

    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchEndX - touchStartX.current

    containerRef.current.style.transition = "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"

    // Decidir si cambiamos de tab
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentTabIndex > 0) {
        onSwipeRight()
      } else if (diffX < 0 && currentTabIndex < totalTabs - 1) {
        onSwipeLeft()
      } else {
        // Si intentó salir de los bordes o no llegó al umbral, restaurar posición exacta
        containerRef.current.style.transform = `translateX(${-currentTabIndex * 100}%)`
      }
    } else {
      containerRef.current.style.transform = `translateX(${-currentTabIndex * 100}%)`
    }
  }, [currentTabIndex, totalTabs, onSwipeRight, onSwipeLeft, threshold, containerRef])

  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof window === "undefined" || window.innerWidth > 768) return

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd])
}