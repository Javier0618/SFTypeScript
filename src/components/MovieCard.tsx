"use client"

import { type Movie, type TVShow, getImageUrl } from "@/lib/tmdb"
import { Card } from "@/components/ui/card"
import { Link } from "react-router-dom"
import RatingCircle from "@/components/ui/RatingCircle"
import { OptimizedImage } from "@/components/OptimizedImage"

interface MovieCardProps {
  item: Movie | TVShow
  type: "movie" | "tv"
  titleLines?: 1 | 2 | "full"
  onClick?: () => void
  priority?: boolean // Add priority prop for above-the-fold images
}

export const MovieCard = ({ item, type, titleLines = 1, onClick, priority = false }: MovieCardProps) => {
  const title = "title" in item ? item.title : item.name
  const date = "release_date" in item ? item.release_date : item.first_air_date

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <Link to={`/${type}/${item.id}`} className="block" onClick={handleClick}>
      <Card className="relative overflow-hidden rounded-lg border-0 bg-card shadow-card transition-all duration-300 cursor-pointer">
        <div className="aspect-[2/3] relative">
          {item.poster_path ? (
            <OptimizedImage
              src={getImageUrl(item.poster_path, "w500")}
              alt={title}
              className="w-full h-full object-cover"
              aspectRatio="poster"
              priority={priority}
              fallback={
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">Sin imagen</span>
                </div>
              }
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground">Sin imagen</span>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute top-2 left-2 z-10">
            <RatingCircle rating={item.vote_average} />
          </div>
          <div className="absolute bottom-2 left-1 bg-black/70 px-1 py-0.2 md:px-2 md:py-1 rounded-sm z-10">
            <span className="text-white text-[10px] md:text-xs font-semibold">
              {type === "movie" ? "Película" : "Serie"}
            </span>
          </div>
          {date && (
            <div className="absolute bottom-2 right-1 bg-black/70 px-1 py-0.2 md:px-2 md:py-1 rounded-sm z-10">
              <span className="text-white text-[10px] md:text-xs font-semibold">{new Date(date).getFullYear()}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-2 px-1">
        <h3
          className={`font-semibold text-sm text-foreground leading-tight ${
            titleLines === 1 ? "line-clamp-1" : titleLines === 2 ? "line-clamp-2" : ""
          }`}
        >
          {title}
        </h3>
      </div>
    </Link>
  )
}
