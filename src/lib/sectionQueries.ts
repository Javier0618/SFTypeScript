import { supabase } from "@/integrations/supabase/client"
import type { Media } from "./tmdb"

export interface Section {
  id: string
  name: string
  type: "category" | "custom"
  category: string | null
  position: number
  visible: boolean
  placement: "tab" | "internal" | null
  internal_tab: string | null
  content_type: "all" | "movie" | "tv"
  created_at: string
  updated_at: string
}

export interface SectionItem {
  id: string
  section_id: string
  item_id: number
  item_type: "movie" | "tv"
  position: number
}

// Get all visible sections ordered by position
export const getVisibleSections = async (): Promise<Section[]> => {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("visible", true)
    .order("position", { ascending: true })

  if (error) throw error
  return (data || []) as Section[]
}

// Get all sections (admin only)
export const getAllSections = async (): Promise<Section[]> => {
  const { data, error } = await supabase.from("sections").select("*").order("position", { ascending: true })

  if (error) throw error
  return (data || []) as Section[]
}

// Get section content
export const getSectionContent = async (section: Section): Promise<Media[]> => {
  if (section.type === "category") {
    return getCategoryContent(section.category || "", section.content_type || "all")
  } else {
    return getCustomSectionContent(section.id)
  }
}

// Get content by category
const getCategoryContent = async (category: string, contentType: "all" | "movie" | "tv" = "all"): Promise<Media[]> => {
  const results: Media[] = []

  // Fetch movies only if contentType is 'all' or 'movie'
  if (contentType === "all" || contentType === "movie") {
    const { data: movies, error: moviesError } = await supabase
      .from("movies_imported")
      .select("*")
      .ilike("category", `%${category}%`)
      .limit(20)

    if (moviesError) throw moviesError

    const movieResults: Media[] =
      movies?.map((movie) => ({
        id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: Number(movie.vote_average) || 0,
        vote_count: 0,
        genre_ids: [],
      })) || []

    results.push(...movieResults)
  }

  // Fetch TV shows only if contentType is 'all' or 'tv'
  if (contentType === "all" || contentType === "tv") {
    const { data: tvShows, error: tvError } = await supabase
      .from("tv_shows_imported")
      .select("*")
      .ilike("category", `%${category}%`)
      .limit(20)

    if (tvError) throw tvError

    const tvResults: Media[] =
      tvShows?.map((show) => ({
        id: show.tmdb_id,
        name: show.name,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        overview: show.overview,
        first_air_date: show.first_air_date,
        vote_average: Number(show.vote_average) || 0,
        vote_count: 0,
        genre_ids: [],
      })) || []

    results.push(...tvResults)
  }

  return results
}

// Get all movies (for popular movies section)
export const getAllMovies = async (): Promise<Media[]> => {
  const { data: movies, error } = await supabase
    .from("movies_imported")
    .select("*")
    .order("vote_average", { ascending: false })

  if (error) throw error

  return (
    movies?.map((movie) => ({
      id: movie.tmdb_id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      release_date: movie.release_date,
      vote_average: Number(movie.vote_average) || 0,
      vote_count: 0,
      genre_ids: [],
    })) || []
  )
}

// Get all TV shows (for popular series section)
export const getAllTVShows = async (): Promise<Media[]> => {
  const { data: tvShows, error } = await supabase
    .from("tv_shows_imported")
    .select("*")
    .order("vote_average", { ascending: false })

  if (error) throw error

  return (
    tvShows?.map((show) => ({
      id: show.tmdb_id,
      name: show.name,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      overview: show.overview,
      first_air_date: show.first_air_date,
      vote_average: Number(show.vote_average) || 0,
      vote_count: 0,
      genre_ids: [],
    })) || []
  )
}

// Get all content by category (for "view all" pages)
export const getAllCategoryContent = async (
  category: string,
  contentType: "all" | "movie" | "tv" = "all",
): Promise<Media[]> => {
  const results: Media[] = []

  // Fetch movies only if contentType is 'all' or 'movie'
  if (contentType === "all" || contentType === "movie") {
    const { data: movies, error: moviesError } = await supabase
      .from("movies_imported")
      .select("*")
      .ilike("category", `%${category}%`)

    if (moviesError) throw moviesError

    const movieResults: Media[] =
      movies?.map((movie) => ({
        id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: Number(movie.vote_average) || 0,
        vote_count: 0,
        genre_ids: [],
      })) || []

    results.push(...movieResults)
  }

  // Fetch TV shows only if contentType is 'all' or 'tv'
  if (contentType === "all" || contentType === "tv") {
    const { data: tvShows, error: tvError } = await supabase
      .from("tv_shows_imported")
      .select("*")
      .ilike("category", `%${category}%`)

    if (tvError) throw tvError

    const tvResults: Media[] =
      tvShows?.map((show) => ({
        id: show.tmdb_id,
        name: show.name,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        overview: show.overview,
        first_air_date: show.first_air_date,
        vote_average: Number(show.vote_average) || 0,
        vote_count: 0,
        genre_ids: [],
      })) || []

    results.push(...tvResults)
  }

  return results
}

// Get custom section content
const getCustomSectionContent = async (sectionId: string): Promise<Media[]> => {
  const { data: items, error } = await supabase
    .from("section_items")
    .select("*")
    .eq("section_id", sectionId)
    .order("position", { ascending: true })

  if (error) throw error
  if (!items || items.length === 0) return []

  // Separate movie and TV show IDs
  const movieIds = items.filter((item) => item.item_type === "movie").map((item) => item.item_id)
  const tvIds = items.filter((item) => item.item_type === "tv").map((item) => item.item_id)

  const results: Media[] = []

  // Fetch movies
  if (movieIds.length > 0) {
    const { data: movies } = await supabase.from("movies_imported").select("*").in("tmdb_id", movieIds)

    if (movies) {
      results.push(
        ...movies.map(
          (movie): Media => ({
            id: movie.tmdb_id,
            title: movie.title,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            overview: movie.overview,
            release_date: movie.release_date,
            vote_average: Number(movie.vote_average) || 0,
            vote_count: 0,
            genre_ids: [],
          }),
        ),
      )
    }
  }

  // Fetch TV shows
  if (tvIds.length > 0) {
    const { data: tvShows } = await supabase.from("tv_shows_imported").select("*").in("tmdb_id", tvIds)

    if (tvShows) {
      results.push(
        ...tvShows.map(
          (show): Media => ({
            id: show.tmdb_id,
            name: show.name,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
            overview: show.overview,
            first_air_date: show.first_air_date,
            vote_average: Number(show.vote_average) || 0,
            vote_count: 0,
            genre_ids: [],
          }),
        ),
      )
    }
  }

  // Sort by position in section_items
  const sortedResults = results.sort((a, b) => {
    const aItem = items.find((item) => item.item_id === a.id)
    const bItem = items.find((item) => item.item_id === b.id)
    return (aItem?.position || 0) - (bItem?.position || 0)
  })

  return sortedResults
}

// Create section
export const createSection = async (section: Omit<Section, "id" | "created_at" | "updated_at">): Promise<Section> => {
  const { data, error } = await supabase.from("sections").insert(section).select().single()

  if (error) throw error
  return data as Section
}

// Update section
export const updateSection = async (id: string, updates: Partial<Section>): Promise<Section> => {
  const { data, error } = await supabase.from("sections").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data as Section
}

// Delete section
export const deleteSection = async (id: string): Promise<void> => {
  const { error } = await supabase.from("sections").delete().eq("id", id)

  if (error) throw error
}

// Add item to custom section
export const addItemToSection = async (
  sectionId: string,
  itemId: number,
  itemType: "movie" | "tv",
  position: number,
): Promise<SectionItem> => {
  const { data, error } = await supabase
    .from("section_items")
    .insert({
      section_id: sectionId,
      item_id: itemId,
      item_type: itemType,
      position,
    })
    .select()
    .single()

  if (error) throw error
  return data as SectionItem
}

// Remove item from section
export const removeItemFromSection = async (id: string): Promise<void> => {
  const { error } = await supabase.from("section_items").delete().eq("id", id)

  if (error) throw error
}

// Get section items
export const getSectionItems = async (sectionId: string): Promise<SectionItem[]> => {
  const { data, error } = await supabase
    .from("section_items")
    .select("*")
    .eq("section_id", sectionId)
    .order("position", { ascending: true })

  if (error) throw error
  return (data || []) as SectionItem[]
}

export const getTabSections = async (): Promise<Section[]> => {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("visible", true)
    .eq("placement", "tab")
    .order("position", { ascending: true })

  if (error) throw error
  return (data || []) as Section[]
}

export const getInternalSections = async (tabNameOrId: string): Promise<Section[]> => {
  let query = supabase.from("sections").select("*").eq("visible", true).eq("placement", "internal")

  if (isNaN(Number(tabNameOrId))) {
    query = query.eq("internal_tab", tabNameOrId)
  } else {
    query = query.eq("id", tabNameOrId)
  }

  const { data, error } = await query.order("position", { ascending: true })

  if (error) throw error
  return (data || []) as Section[]
}
