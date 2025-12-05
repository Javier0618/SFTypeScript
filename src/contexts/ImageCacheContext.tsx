import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const CACHE_NAME = "streamfusion-images-v2";
const SW_PATH = "/sw-image-cache.js";

interface ImageCacheContextType {
  prefetchImages: (urls: string[]) => void;
  prefetchBackdrops: (urls: string[]) => void;
  prefetchPriority: (urls: string[]) => void;
  clearCache: () => Promise<void>;
  isMobile: boolean;
  isServiceWorkerReady: boolean;
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
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const prefetchedUrls = useRef<Set<string>>(new Set());
  const prefetchQueue = useRef<string[]>([]);
  const priorityQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);
  const swRef = useRef<ServiceWorker | null>(null);
  const pendingProcessQueue = useRef(false);

  const sendToServiceWorker = useCallback((urls: string[]) => {
    const validUrls = urls.filter(url => url && url.includes("image.tmdb.org"));
    if (validUrls.length === 0) return false;

    const sw = navigator.serviceWorker?.controller || swRef.current;
    if (sw) {
      sw.postMessage({
        type: "PREFETCH_IMAGES",
        urls: validUrls,
      });
      return true;
    }
    return false;
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current) {
      pendingProcessQueue.current = true;
      return;
    }
    if (!isMobile || !isCacheSupported()) return;
    if (priorityQueue.current.length === 0 && prefetchQueue.current.length === 0) return;

    isProcessing.current = true;
    pendingProcessQueue.current = false;

    try {
      if (priorityQueue.current.length > 0) {
        const priorityUrls = [...priorityQueue.current];
        priorityQueue.current = [];

        if (sendToServiceWorker(priorityUrls)) {
        } else {
          const cache = await caches.open(CACHE_NAME);
          await Promise.allSettled(
            priorityUrls.map(async (url) => {
              try {
                const existingResponse = await cache.match(url);
                if (existingResponse) return;

                const response = await fetch(url, { mode: "cors" });
                if (response.ok) {
                  await cache.put(url, response.clone());
                }
              } catch (error) {}
            })
          );
        }
      }

      if (prefetchQueue.current.length > 0) {
        const batchSize = 10;
        
        while (prefetchQueue.current.length > 0) {
          const batch = prefetchQueue.current.splice(0, batchSize);
          
          if (sendToServiceWorker(batch)) {
            await new Promise(resolve => setTimeout(resolve, 50));
          } else {
            const cache = await caches.open(CACHE_NAME);
            
            await Promise.allSettled(
              batch.map(async (url) => {
                try {
                  const existingResponse = await cache.match(url);
                  if (existingResponse) return;

                  const response = await fetch(url, { mode: "cors" });
                  if (response.ok) {
                    await cache.put(url, response.clone());
                  }
                } catch (error) {}
              })
            );
          }

          if (prefetchQueue.current.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
    } catch (error) {
      console.warn("Error processing prefetch queue:", error);
    } finally {
      isProcessing.current = false;
      
      if (pendingProcessQueue.current) {
        pendingProcessQueue.current = false;
        processQueue();
      }
    }
  }, [isMobile, sendToServiceWorker]);

  useEffect(() => {
    if (!isMobile || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        if (registration.active) {
          swRef.current = registration.active;
          setIsServiceWorkerReady(true);
          
          if (priorityQueue.current.length > 0 || prefetchQueue.current.length > 0) {
            processQueue();
          }
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                swRef.current = newWorker;
                setIsServiceWorkerReady(true);
                
                if (priorityQueue.current.length > 0 || prefetchQueue.current.length > 0) {
                  processQueue();
                }
              }
            });
          }
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          swRef.current = navigator.serviceWorker.controller;
          setIsServiceWorkerReady(true);
          
          if (priorityQueue.current.length > 0 || prefetchQueue.current.length > 0) {
            processQueue();
          }
        });
      } catch (error) {
        console.warn("Service Worker registration failed:", error);
      }
    };

    registerSW();
  }, [isMobile, processQueue]);

  const prefetchImages = useCallback((urls: string[]) => {
    if (!isMobile) return;

    const newUrls = urls.filter(url => {
      if (!url || prefetchedUrls.current.has(url)) return false;
      prefetchedUrls.current.add(url);
      return true;
    });

    if (newUrls.length === 0) return;

    prefetchQueue.current.push(...newUrls);
    
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => processQueue(), { timeout: 1000 });
    } else {
      setTimeout(() => processQueue(), 50);
    }
  }, [isMobile, processQueue]);

  const prefetchBackdrops = useCallback((urls: string[]) => {
    if (!isMobile) return;

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

  const prefetchPriority = useCallback((urls: string[]) => {
    if (!isMobile) return;

    const newUrls = urls.filter(url => {
      if (!url || prefetchedUrls.current.has(url)) return false;
      prefetchedUrls.current.add(url);
      return true;
    });

    if (newUrls.length === 0) return;

    priorityQueue.current.push(...newUrls);
    processQueue();
  }, [isMobile, processQueue]);

  const clearCache = useCallback(async () => {
    if (!isCacheSupported()) return;

    try {
      const sw = navigator.serviceWorker?.controller || swRef.current;
      if (sw) {
        await new Promise<void>((resolve) => {
          const handler = (event: MessageEvent) => {
            if (event.data && event.data.type === "CACHE_CLEARED") {
              navigator.serviceWorker.removeEventListener("message", handler);
              resolve();
            }
          };
          navigator.serviceWorker.addEventListener("message", handler);
          sw.postMessage({ type: "CLEAR_CACHE" });
          
          setTimeout(() => {
            navigator.serviceWorker.removeEventListener("message", handler);
            resolve();
          }, 2000);
        });
      }
      
      await caches.delete(CACHE_NAME);
      prefetchedUrls.current.clear();
      prefetchQueue.current = [];
      priorityQueue.current = [];
    } catch (error) {
      console.warn("Failed to clear image cache:", error);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (priorityQueue.current.length > 0 || prefetchQueue.current.length > 0) {
          processQueue();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [processQueue]);

  return (
    <ImageCacheContext.Provider value={{ 
      prefetchImages, 
      prefetchBackdrops,
      prefetchPriority,
      clearCache,
      isMobile,
      isServiceWorkerReady
    }}>
      {children}
    </ImageCacheContext.Provider>
  );
}

export function useImageCacheContext() {
  const context = useContext(ImageCacheContext);
  if (!context) {
    return { 
      prefetchImages: () => {}, 
      prefetchBackdrops: () => {},
      prefetchPriority: () => {},
      clearCache: async () => {},
      isMobile: false,
      isServiceWorkerReady: false
    };
  }
  return context;
}
