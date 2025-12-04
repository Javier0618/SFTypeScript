import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components/Navbar"
import { MobileNavbar } from "@/components/MobileNavbar"
import { MediaCarousel } from "@/components/MediaCarousel"
import { getAllTVShows } from "@/lib/sectionQueries"

const TVShows = () => {
  const { data: allSeries } = useQuery({
    queryKey: ["all-series"],
    queryFn: getAllTVShows,
    staleTime: Infinity,
    gcTime: Infinity,
  })

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
