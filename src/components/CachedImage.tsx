import type React from "react"
import { memo } from "react"
import { OptimizedImage } from "@/components/OptimizedImage"

const CACHE_NAME = "streamfusion-images-v2"

const memoryCache = new Map<string, { url: string; refCount: number }>()
const pendingRequests = new Map<string, Promise<string | null>>()
const MAX_MEMORY_CACHE = 80

interface CachedImageProps {
  src: string
  alt: string
  className?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  loading?: "lazy" | "eager"
  priority?: boolean
}

const isCacheSupported = (): boolean => {
  return "caches" in window
}

const acquireMemoryCacheUrl = (key: string, url: string): string => {
  const existing = memoryCache.get(key)
  if (existing) {
    existing.refCount++
    return existing.url
  }

  if (memoryCache.size >= MAX_MEMORY_CACHE) {
    const entries = Array.from(memoryCache.entries())
    const toRemove = entries.filter(([_, v]) => v.refCount === 0).slice(0, 20)

    toRemove.forEach(([k, v]) => {
      if (v.url.startsWith("blob:")) {
        URL.revokeObjectURL(v.url)
      }
      memoryCache.delete(k)
    })
  }

  memoryCache.set(key, { url, refCount: 1 })
  return url
}

const releaseMemoryCacheUrl = (key: string): void => {
  const entry = memoryCache.get(key)
  if (entry) {
    entry.refCount = Math.max(0, entry.refCount - 1)
  }
}

async function getCachedImageUrl(src: string): Promise<string | null> {
  const existing = memoryCache.get(src)
  if (existing) {
    existing.refCount++
    return existing.url
  }

  if (pendingRequests.has(src)) {
    return pendingRequests.get(src)!
  }

  const fetchPromise = (async () => {
    try {
      const cache = await caches.open(CACHE_NAME)
      const response = await cache.match(src)

      if (response) {
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        acquireMemoryCacheUrl(src, objectUrl)
        return objectUrl
      }
    } catch (error) {
    } finally {
      pendingRequests.delete(src)
    }
    return null
  })()

  pendingRequests.set(src, fetchPromise)
  return fetchPromise
}

async function cacheImage(src: string): Promise<void> {
  if (!isCacheSupported() || !src.includes("image.tmdb.org")) return

  try {
    const cache = await caches.open(CACHE_NAME)
    const existingResponse = await cache.match(src)

    if (!existingResponse) {
      const response = await fetch(src, { mode: "cors" })
      if (response.ok) {
        await cache.put(src, response.clone())
      }
    }
  } catch (error) {}
}

export const CachedImage = memo(function CachedImage({
  src,
  alt,
  className,
  fallback,
  onLoad,
  onError,
  loading = "lazy",
  priority = false,
}: CachedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      fallback={fallback}
      onLoad={onLoad}
      onError={onError}
      priority={priority || loading === "eager"}
    />
  )
})

export function clearMemoryCache(): void {
  // No-op for backwards compatibility - OptimizedImage handles its own cache
}

export default CachedImage
