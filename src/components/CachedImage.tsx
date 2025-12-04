import { useState, useEffect, useCallback, memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const CACHE_NAME = "streamfusion-images-v1";

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  loading?: "lazy" | "eager";
}

const isCacheSupported = (): boolean => {
  return "caches" in window;
};

export const CachedImage = memo(function CachedImage({
  src,
  alt,
  className,
  fallback,
  onLoad,
  onError,
  loading = "lazy",
}: CachedImageProps) {
  const isMobile = useIsMobile();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCachedImage, setIsCachedImage] = useState(false);

  const loadImage = useCallback(async () => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (!isMobile || !isCacheSupported()) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(src);

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setIsCachedImage(true);
        setIsLoading(false);
        return;
      }

      setImageSrc(src);
      setIsLoading(false);

      try {
        const response = await fetch(src, { mode: "cors" });
        if (response.ok) {
          await cache.put(src, response.clone());
        }
      } catch (cacheError) {
      }
    } catch (error) {
      setImageSrc(src);
      setIsLoading(false);
    }
  }, [src, isMobile]);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsCachedImage(false);
    loadImage();

    return () => {
      if (isCachedImage && imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [loadImage]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  if (hasError || !src) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={cn("bg-secondary flex items-center justify-center", className)}>
        <span className="text-muted-foreground text-xs">Sin imagen</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={cn("bg-secondary/50 animate-pulse", className)} />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            className,
            isLoading && "opacity-0 absolute",
            !isLoading && isCachedImage && "animate-none",
            !isLoading && !isCachedImage && "animate-fade-in"
          )}
          loading={isCachedImage ? "eager" : loading}
          onLoad={handleLoad}
          onError={handleError}
          decoding={isCachedImage ? "sync" : "async"}
        />
      )}
    </>
  );
});

export default CachedImage;
