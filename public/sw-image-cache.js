const CACHE_NAME = "streamfusion-images-v2";
const CACHE_VERSION = 2;
const TMDB_IMAGE_DOMAIN = "image.tmdb.org";
const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("streamfusion-images-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  if (url.hostname === TMDB_IMAGE_DOMAIN) {
    event.respondWith(handleImageRequest(event.request));
  }
});

async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request, {
      mode: "cors",
      credentials: "omit",
    });
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      
      cache.put(request, responseToCache).catch(() => {});
      
      trimCache(cache).catch(() => {});
    }
    
    return networkResponse;
  } catch (error) {
    return new Response("Image not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function trimCache(cache) {
  try {
    const keys = await cache.keys();
    
    if (keys.length > MAX_CACHE_SIZE) {
      const deleteCount = keys.length - MAX_CACHE_SIZE + 50;
      const keysToDelete = keys.slice(0, deleteCount);
      
      await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    }
  } catch (error) {
  }
}

self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "PREFETCH_IMAGES") {
    const urls = event.data.urls || [];
    const cache = await caches.open(CACHE_NAME);
    
    const batchSize = 6;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            const existingResponse = await cache.match(url);
            if (existingResponse) return;
            
            const response = await fetch(url, {
              mode: "cors",
              credentials: "omit",
            });
            
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (error) {
          }
        })
      );
    }
    
    if (event.source) {
      event.source.postMessage({
        type: "PREFETCH_COMPLETE",
        count: urls.length,
      });
    }
  }
  
  if (event.data && event.data.type === "CLEAR_CACHE") {
    await caches.delete(CACHE_NAME);
    if (event.source) {
      event.source.postMessage({ type: "CACHE_CLEARED" });
    }
  }
  
  if (event.data && event.data.type === "GET_CACHE_STATUS") {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      if (event.source) {
        event.source.postMessage({
          type: "CACHE_STATUS",
          count: keys.length,
          maxSize: MAX_CACHE_SIZE,
        });
      }
    } catch (error) {
      if (event.source) {
        event.source.postMessage({
          type: "CACHE_STATUS",
          count: 0,
          maxSize: MAX_CACHE_SIZE,
        });
      }
    }
  }
});
