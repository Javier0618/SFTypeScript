import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components/Navbar"
import { MobileNavbar } from "@/components/MobileNavbar"
import { MediaCarousel } from "@/components/MediaCarousel"
import { getAllMovies } from "@/lib/sectionQueries"
import { useImageCacheContext } from "@/contexts/ImageCacheContext"
import { getImageUrl } from "@/lib/tmdb"

const Movies = () => {
  const { data: allMovies } = useQuery({
    queryKey: ["all-movies"],
    queryFn: getAllMovies,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const { prefetchImages, isMobile } = useImageCacheContext()

  useEffect(() => {
    if (isMobile && allMovies && allMovies.length > 0) {
      const posterUrls = allMovies
        .filter(movie => movie.poster_path)
        .map(movie => getImageUrl(movie.poster_path, "w500"))
      prefetchImages(posterUrls)
    }
  }, [allMovies, prefetchImages, isMobile])

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileNavbar />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">Películas</h1>
        <MediaCarousel title="Todas las Películas" items={allMovies || []} type="movie" />
      </div>
    </div>
  )
}

export default Movies
