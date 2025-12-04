import { createContext, useContext, useCallback, useEffect, useRef, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const CACHE_NAME = "streamfusion-images-v1";

interface ImageCacheContextType {
  prefetchImages: (urls: string[]) => void;
  isMobile: boolean;
}

const ImageCacheContext = createContext<ImageCacheContextType | null>(null);

const isCacheSupported = (): boolean => {
  return "caches" in window;
};

interface ImageCacheProviderProps {
  children: ReactNode;
}

export function ImageCacheProvider({ children }: ImageCacheProviderProps) {
  const isMobile = useIsMobile();
  const prefetchedUrls = useRef<Set<string>>(new Set());
  const prefetchQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || prefetchQueue.current.length === 0) return;
    if (!isMobile || !isCacheSupported()) return;

    isProcessing.current = true;

    try {
      const cache = await caches.open(CACHE_NAME);
      const batchSize = 3;

      while (prefetchQueue.current.length > 0) {
        const batch = prefetchQueue.current.splice(0, batchSize);
        
        await Promise.allSettled(
          batch.map(async (url) => {
            try {
              const existingResponse = await cache.match(url);
              if (existingResponse) return;

              const response = await fetch(url, { mode: "cors" });
              if (response.ok) {
                await cache.put(url, response.clone());
              }
            } catch (error) {
            }
          })
        );

        if (prefetchQueue.current.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.warn("Error processing prefetch queue:", error);
    } finally {
      isProcessing.current = false;
    }
  }, [isMobile]);

  const prefetchImages = useCallback((urls: string[]) => {
    if (!isMobile || !isCacheSupported()) return;

    const newUrls = urls.filter(url => {
      if (!url || prefetchedUrls.current.has(url)) return false;
      prefetchedUrls.current.add(url);
      return true;
    });

    if (newUrls.length === 0) return;

    prefetchQueue.current.push(...newUrls);
    
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => processQueue(), { timeout: 2000 });
    } else {
      setTimeout(() => processQueue(), 100);
    }
  }, [isMobile, processQueue]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && prefetchQueue.current.length > 0) {
        processQueue();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [processQueue]);

  return (
    <ImageCacheContext.Provider value={{ prefetchImages, isMobile }}>
      {children}
    </ImageCacheContext.Provider>
  );
}

export function useImageCacheContext() {
  const context = useContext(ImageCacheContext);
  if (!context) {
    return { prefetchImages: () => {}, isMobile: false };
  }
  return context;
}
