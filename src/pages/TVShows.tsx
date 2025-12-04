import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components/Navbar"
import { MobileNavbar } from "@/components/MobileNavbar"
import { MediaCarousel } from "@/components/MediaCarousel"
import { getAllTVShows } from "@/lib/sectionQueries"
import { useImageCacheContext } from "@/contexts/ImageCacheContext"
import { getImageUrl } from "@/lib/tmdb"

const TVShows = () => {
  const { data: allSeries } = useQuery({
    queryKey: ["all-series"],
    queryFn: getAllTVShows,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const { prefetchImages, isMobile } = useImageCacheContext()

  useEffect(() => {
    if (isMobile && allSeries && allSeries.length > 0) {
      const posterUrls = allSeries
        .filter(show => show.poster_path)
        .map(show => getImageUrl(show.poster_path, "w500"))
      prefetchImages(posterUrls)
    }
  }, [allSeries, prefetchImages, isMobile])

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileNavbar />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">Series</h1>
        <MediaCarousel title="Todas las Series" items={allSeries || []} type="tv" />
      </div>
    </div>
  )
}

export default TVShows
