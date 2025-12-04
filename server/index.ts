import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { db, pool } from "./db";
import * as schema from "./schema";
import { eq, desc, ilike, or, and, sql, asc } from "drizzle-orm";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/movies", async (req: Request, res: Response) => {
  try {
    const movies = await db.select().from(schema.moviesImported).orderBy(desc(schema.moviesImported.createdAt));
    const result = movies.map((movie) => ({
      id: movie.tmdbId,
      title: movie.title,
      poster_path: movie.posterPath,
      backdrop_path: movie.backdropPath,
      overview: movie.overview,
      release_date: movie.releaseDate,
      vote_average: Number(movie.voteAverage) || 0,
      vote_count: 0,
      genre_ids: [],
      video_url: movie.videoUrl,
      category: movie.category,
    }));
    res.json(result);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.get("/api/movies/:tmdbId", async (req: Request, res: Response) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    const movie = await db.select().from(schema.moviesImported).where(eq(schema.moviesImported.tmdbId, tmdbId)).limit(1);
    if (movie.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    const m = movie[0];
    res.json({
      id: m.tmdbId,
      title: m.title,
      poster_path: m.posterPath,
      backdrop_path: m.backdropPath,
      overview: m.overview,
      release_date: m.releaseDate,
      vote_average: Number(m.voteAverage) || 0,
      vote_count: 0,
      genre_ids: [],
      video_url: m.videoUrl,
      category: m.category,
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

app.post("/api/movies", async (req: Request, res: Response) => {
  try {
    const { id, tmdb_id, title, video_url, poster_path, backdrop_path, overview, release_date, vote_average, imported_by, category } = req.body;
    await db.insert(schema.moviesImported).values({
      id,
      tmdbId: tmdb_id,
      title,
      videoUrl: video_url,
      posterPath: poster_path,
      backdropPath: backdrop_path,
      overview,
      releaseDate: release_date,
      voteAverage: vote_average?.toString(),
      importedBy: imported_by,
      category,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating movie:", error);
    res.status(500).json({ error: "Failed to create movie" });
  }
});

app.delete("/api/movies/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(schema.moviesImported).where(eq(schema.moviesImported.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

app.get("/api/tv-shows", async (req: Request, res: Response) => {
  try {
    const tvShows = await db.select().from(schema.tvShowsImported).orderBy(desc(schema.tvShowsImported.createdAt));
    const result = tvShows.map((show) => ({
      id: show.tmdbId,
      name: show.name,
      poster_path: show.posterPath,
      backdrop_path: show.backdropPath,
      overview: show.overview,
      first_air_date: show.firstAirDate,
      vote_average: Number(show.voteAverage) || 0,
      vote_count: 0,
      genre_ids: [],
      number_of_seasons: show.numberOfSeasons,
      category: show.category,
    }));
    res.json(result);
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    res.status(500).json({ error: "Failed to fetch TV shows" });
  }
});

app.get("/api/tv-shows/:tmdbId", async (req: Request, res: Response) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    const show = await db.select().from(schema.tvShowsImported).where(eq(schema.tvShowsImported.tmdbId, tmdbId)).limit(1);
    if (show.length === 0) {
      return res.status(404).json({ error: "TV show not found" });
    }
    const s = show[0];
    res.json({
      id: s.tmdbId,
      name: s.name,
      poster_path: s.posterPath,
      backdrop_path: s.backdropPath,
      overview: s.overview,
      first_air_date: s.firstAirDate,
      vote_average: Number(s.voteAverage) || 0,
      vote_count: 0,
      genre_ids: [],
      number_of_seasons: s.numberOfSeasons,
      category: s.category,
    });
  } catch (error) {
    console.error("Error fetching TV show:", error);
    res.status(500).json({ error: "Failed to fetch TV show" });
  }
});

app.post("/api/tv-shows", async (req: Request, res: Response) => {
  try {
    const { id, tmdb_id, name, poster_path, backdrop_path, overview, first_air_date, vote_average, number_of_seasons, imported_by, category } = req.body;
    await db.insert(schema.tvShowsImported).values({
      id,
      tmdbId: tmdb_id,
      name,
      posterPath: poster_path,
      backdropPath: backdrop_path,
      overview,
      firstAirDate: first_air_date,
      voteAverage: vote_average?.toString(),
      numberOfSeasons: number_of_seasons,
      importedBy: imported_by,
      category,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating TV show:", error);
    res.status(500).json({ error: "Failed to create TV show" });
  }
});

app.delete("/api/tv-shows/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(schema.tvShowsImported).where(eq(schema.tvShowsImported.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting TV show:", error);
    res.status(500).json({ error: "Failed to delete TV show" });
  }
});

app.get("/api/tv-shows/:tmdbId/seasons", async (req: Request, res: Response) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    const show = await db.select().from(schema.tvShowsImported).where(eq(schema.tvShowsImported.tmdbId, tmdbId)).limit(1);
    if (show.length === 0) {
      return res.status(404).json({ error: "TV show not found" });
    }
    const seasons = await db.select().from(schema.seasons).where(eq(schema.seasons.tvShowId, show[0].id)).orderBy(asc(schema.seasons.seasonNumber));
    res.json(seasons);
  } catch (error) {
    console.error("Error fetching seasons:", error);
    res.status(500).json({ error: "Failed to fetch seasons" });
  }
});

app.get("/api/seasons/:seasonId/episodes", async (req: Request, res: Response) => {
  try {
    const seasonId = req.params.seasonId;
    const episodes = await db.select().from(schema.episodes).where(eq(schema.episodes.seasonId, seasonId)).orderBy(asc(schema.episodes.episodeNumber));
    res.json(episodes);
  } catch (error) {
    console.error("Error fetching episodes:", error);
    res.status(500).json({ error: "Failed to fetch episodes" });
  }
});

app.get("/api/sections", async (req: Request, res: Response) => {
  try {
    const visible = req.query.visible === "true";
    let query = db.select().from(schema.sections).orderBy(asc(schema.sections.position));
    if (visible) {
      query = db.select().from(schema.sections).where(eq(schema.sections.visible, true)).orderBy(asc(schema.sections.position));
    }
    const sections = await query;
    res.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

app.post("/api/sections", async (req: Request, res: Response) => {
  try {
    const section = await db.insert(schema.sections).values(req.body).returning();
    res.json(section[0]);
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({ error: "Failed to create section" });
  }
});

app.put("/api/sections/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const section = await db.update(schema.sections).set({ ...req.body, updatedAt: new Date() }).where(eq(schema.sections.id, id)).returning();
    res.json(section[0]);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ error: "Failed to update section" });
  }
});

app.delete("/api/sections/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await db.delete(schema.sections).where(eq(schema.sections.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ error: "Failed to delete section" });
  }
});

app.get("/api/sections/:id/items", async (req: Request, res: Response) => {
  try {
    const sectionId = req.params.id;
    const items = await db.select().from(schema.sectionItems).where(eq(schema.sectionItems.sectionId, sectionId)).orderBy(asc(schema.sectionItems.position));
    res.json(items);
  } catch (error) {
    console.error("Error fetching section items:", error);
    res.status(500).json({ error: "Failed to fetch section items" });
  }
});

app.post("/api/sections/:id/items", async (req: Request, res: Response) => {
  try {
    const sectionId = req.params.id;
    const item = await db.insert(schema.sectionItems).values({ ...req.body, sectionId }).returning();
    res.json(item[0]);
  } catch (error) {
    console.error("Error adding section item:", error);
    res.status(500).json({ error: "Failed to add section item" });
  }
});

app.delete("/api/section-items/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await db.delete(schema.sectionItems).where(eq(schema.sectionItems.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting section item:", error);
    res.status(500).json({ error: "Failed to delete section item" });
  }
});

app.get("/api/platforms", async (req: Request, res: Response) => {
  try {
    const active = req.query.active === "true";
    let platforms;
    if (active) {
      platforms = await db.select().from(schema.streamingPlatforms).where(eq(schema.streamingPlatforms.active, true)).orderBy(asc(schema.streamingPlatforms.position));
    } else {
      platforms = await db.select().from(schema.streamingPlatforms).orderBy(asc(schema.streamingPlatforms.position));
    }
    res.json(platforms);
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ error: "Failed to fetch platforms" });
  }
});

app.post("/api/platforms", async (req: Request, res: Response) => {
  try {
    const platform = await db.insert(schema.streamingPlatforms).values(req.body).returning();
    res.json(platform[0]);
  } catch (error) {
    console.error("Error creating platform:", error);
    res.status(500).json({ error: "Failed to create platform" });
  }
});

app.put("/api/platforms/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const platform = await db.update(schema.streamingPlatforms).set({ ...req.body, updatedAt: new Date() }).where(eq(schema.streamingPlatforms.id, id)).returning();
    res.json(platform[0]);
  } catch (error) {
    console.error("Error updating platform:", error);
    res.status(500).json({ error: "Failed to update platform" });
  }
});

app.delete("/api/platforms/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await db.delete(schema.streamingPlatforms).where(eq(schema.streamingPlatforms.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting platform:", error);
    res.status(500).json({ error: "Failed to delete platform" });
  }
});

app.get("/api/movies/:movieId/platforms", async (req: Request, res: Response) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const platforms = await db.select({ platformId: schema.moviePlatforms.platformId }).from(schema.moviePlatforms).where(eq(schema.moviePlatforms.movieId, movieId));
    res.json(platforms.map((p) => p.platformId));
  } catch (error) {
    console.error("Error fetching movie platforms:", error);
    res.status(500).json({ error: "Failed to fetch movie platforms" });
  }
});

app.post("/api/movies/:movieId/platforms", async (req: Request, res: Response) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const { platformIds } = req.body;
    await db.delete(schema.moviePlatforms).where(eq(schema.moviePlatforms.movieId, movieId));
    if (platformIds && platformIds.length > 0) {
      await db.insert(schema.moviePlatforms).values(platformIds.map((platformId: string) => ({ movieId, platformId })));
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating movie platforms:", error);
    res.status(500).json({ error: "Failed to update movie platforms" });
  }
});

app.get("/api/tv-shows/:tvShowId/platforms", async (req: Request, res: Response) => {
  try {
    const tvShowId = parseInt(req.params.tvShowId);
    const platforms = await db.select({ platformId: schema.tvShowPlatforms.platformId }).from(schema.tvShowPlatforms).where(eq(schema.tvShowPlatforms.tvShowId, tvShowId));
    res.json(platforms.map((p) => p.platformId));
  } catch (error) {
    console.error("Error fetching TV show platforms:", error);
    res.status(500).json({ error: "Failed to fetch TV show platforms" });
  }
});

app.post("/api/tv-shows/:tvShowId/platforms", async (req: Request, res: Response) => {
  try {
    const tvShowId = parseInt(req.params.tvShowId);
    const { platformIds } = req.body;
    await db.delete(schema.tvShowPlatforms).where(eq(schema.tvShowPlatforms.tvShowId, tvShowId));
    if (platformIds && platformIds.length > 0) {
      await db.insert(schema.tvShowPlatforms).values(platformIds.map((platformId: string) => ({ tvShowId, platformId })));
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating TV show platforms:", error);
    res.status(500).json({ error: "Failed to update TV show platforms" });
  }
});

app.get("/api/platforms/:platformId/content", async (req: Request, res: Response) => {
  try {
    const platformId = req.params.platformId;
    const moviePlatforms = await db.select({ movieId: schema.moviePlatforms.movieId }).from(schema.moviePlatforms).where(eq(schema.moviePlatforms.platformId, platformId));
    const tvShowPlatforms = await db.select({ tvShowId: schema.tvShowPlatforms.tvShowId }).from(schema.tvShowPlatforms).where(eq(schema.tvShowPlatforms.platformId, platformId));
    
    const movies = moviePlatforms.length > 0 
      ? await db.select().from(schema.moviesImported).where(sql`${schema.moviesImported.id} = ANY(${moviePlatforms.map(p => p.movieId)})`)
      : [];
    const tvShows = tvShowPlatforms.length > 0
      ? await db.select().from(schema.tvShowsImported).where(sql`${schema.tvShowsImported.id} = ANY(${tvShowPlatforms.map(p => p.tvShowId)})`)
      : [];
    
    res.json({
      movies: movies.map((m) => ({
        id: m.tmdbId,
        title: m.title,
        poster_path: m.posterPath,
        backdrop_path: m.backdropPath,
        overview: m.overview,
        release_date: m.releaseDate,
        vote_average: Number(m.voteAverage) || 0,
        vote_count: 0,
        genre_ids: [],
      })),
      tvShows: tvShows.map((s) => ({
        id: s.tmdbId,
        name: s.name,
        poster_path: s.posterPath,
        backdrop_path: s.backdropPath,
        overview: s.overview,
        first_air_date: s.firstAirDate,
        vote_average: Number(s.voteAverage) || 0,
        vote_count: 0,
        genre_ids: [],
      })),
    });
  } catch (error) {
    console.error("Error fetching platform content:", error);
    res.status(500).json({ error: "Failed to fetch platform content" });
  }
});

app.get("/api/search", async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    if (!query) {
      return res.json({ movies: [], tvShows: [] });
    }
    const movies = await db.select().from(schema.moviesImported).where(ilike(schema.moviesImported.title, `%${query}%`)).limit(20);
    const tvShows = await db.select().from(schema.tvShowsImported).where(ilike(schema.tvShowsImported.name, `%${query}%`)).limit(20);
    res.json({
      movies: movies.map((m) => ({
        id: m.tmdbId,
        title: m.title,
        poster_path: m.posterPath,
        backdrop_path: m.backdropPath,
        overview: m.overview,
        release_date: m.releaseDate,
        vote_average: Number(m.voteAverage) || 0,
        vote_count: 0,
        genre_ids: [],
      })),
      tvShows: tvShows.map((s) => ({
        id: s.tmdbId,
        name: s.name,
        poster_path: s.posterPath,
        backdrop_path: s.backdropPath,
        overview: s.overview,
        first_air_date: s.firstAirDate,
        vote_average: Number(s.voteAverage) || 0,
        vote_count: 0,
        genre_ids: [],
      })),
    });
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

app.get("/api/category/:category", async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const contentType = (req.query.type as string) || "all";
    
    let movies: any[] = [];
    let tvShows: any[] = [];
    
    if (contentType === "all" || contentType === "movie") {
      movies = await db.select().from(schema.moviesImported).where(ilike(schema.moviesImported.category, `%${category}%`)).limit(20);
    }
    if (contentType === "all" || contentType === "tv") {
      tvShows = await db.select().from(schema.tvShowsImported).where(ilike(schema.tvShowsImported.category, `%${category}%`)).limit(20);
    }
    
    res.json({
      movies: movies.map((m) => ({
        id: m.tmdbId,
        title: m.title,
        poster_path: m.posterPath,
        backdrop_path: m.backdropPath,
        overview: m.overview,
        release_date: m.releaseDate,
        vote_average: Number(m.voteAverage) || 0,
        vote_count: 0,
        genre_ids: [],
      })),
      tvShows: tvShows.map((s) => ({
        id: s.tmdbId,
        name: s.name,
        poster_path: s.posterPath,
        backdrop_path: s.backdropPath,
        overview: s.overview,
        first_air_date: s.firstAirDate,
        vote_average: Number(s.voteAverage) || 0,
        vote_count: 0,
        genre_ids: [],
      })),
    });
  } catch (error) {
    console.error("Error fetching category content:", error);
    res.status(500).json({ error: "Failed to fetch category content" });
  }
});

const PORT = parseInt(process.env.PORT || "3001");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on port ${PORT}`);
});
