"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { Navbar } from "@/components/Navbar"
import { MobileNavbar } from "@/components/MobileNavbar"
import { MovieCard } from "@/components/MovieCard"
import { getAllMovies, getAllTVShows, getAllCategoryContent } from "@/lib/sectionQueries"

const categoryTranslations: Record<string, string> = {
  action: "Acción",
  adventure: "Aventura",
  animation: "Animación",
  comedy: "Comedia",
  crime: "Crimen",
  documentary: "Documental",
  drama: "Drama",
  family: "Familia",
  fantasy: "Fantasía",
  history: "Historia",
  horror: "Terror",
  music: "Música",
  mystery: "Misterio",
  romance: "Romance",
  "science fiction": "Ciencia Ficción",
  "sci-fi": "Ciencia Ficción",
  thriller: "Suspenso",
  war: "Guerra",
  western: "Western",
  trending: "Tendencias",
  popular: "Populares",
  "top rated": "Mejor valoradas",
  upcoming: "Próximamente",
  "now playing": "En cartelera",
}

const ViewAll = () => {
  const { type, category } = useParams<{ type: string; category?: string }>()

  const { data: content, isLoading } = useQuery({
    queryKey: ["view-all", type, category],
    queryFn: async () => {
      if (type === "movies") {
        return getAllMovies()
      } else if (type === "series") {
        return getAllTVShows()
      } else if (type === "category" && category) {
        return getAllCategoryContent(category)
      }
      return []
    },
  })

  const getTitle = () => {
    if (type === "movies") return "Películas"
    if (type === "series") return "Series"
    if (type === "category" && category) {
      const lowerCategory = category.toLowerCase()
      return categoryTranslations[lowerCategory] || category
    }
    return "Todos"
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileNavbar showBackButton={true} title={getTitle()} />

      <div className="container mx-auto px-2 pt-4 pb-2 md:pt-8">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {content?.map((item) => {
              const itemType = "title" in item ? "movie" : "tv"
              return <MovieCard key={item.id} item={item} type={itemType} titleLines="full" />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewAll
