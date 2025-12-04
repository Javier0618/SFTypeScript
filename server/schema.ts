import { pgTable, uuid, text, timestamp, boolean, integer, decimal, pgEnum, unique, index } from 'drizzle-orm/pg-core';

export const appRole = pgEnum('app_role', ['admin', 'user']);

export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  role: appRole('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdRoleUnique: unique().on(table.userId, table.role),
}));

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const moviesImported = pgTable('movies_imported', {
  id: integer('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  title: text('title').notNull(),
  videoUrl: text('video_url').notNull(),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  overview: text('overview'),
  releaseDate: text('release_date'),
  voteAverage: decimal('vote_average', { precision: 3, scale: 1 }),
  importedBy: uuid('imported_by').notNull(),
  category: text('category'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_movies_category').on(table.category),
}));

export const tvShowsImported = pgTable('tv_shows_imported', {
  id: integer('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  name: text('name').notNull(),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  overview: text('overview'),
  firstAirDate: text('first_air_date'),
  voteAverage: decimal('vote_average', { precision: 3, scale: 1 }),
  numberOfSeasons: integer('number_of_seasons'),
  importedBy: uuid('imported_by').notNull(),
  category: text('category'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_tv_shows_category').on(table.category),
}));

export const seasons = pgTable('seasons', {
  id: uuid('id').defaultRandom().primaryKey(),
  tvShowId: integer('tv_show_id').notNull().references(() => tvShowsImported.id, { onDelete: 'cascade' }),
  seasonNumber: integer('season_number').notNull(),
  name: text('name'),
  episodeCount: integer('episode_count'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tvShowSeasonUnique: unique().on(table.tvShowId, table.seasonNumber),
}));

export const episodes = pgTable('episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  episodeNumber: integer('episode_number').notNull(),
  name: text('name'),
  videoUrl: text('video_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  seasonEpisodeUnique: unique().on(table.seasonId, table.episodeNumber),
}));

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  category: text('category'),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  positionIdx: index('idx_sections_position').on(table.position),
}));

export const sectionItems = pgTable('section_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  itemId: integer('item_id').notNull(),
  itemType: text('item_type').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sectionIdIdx: index('idx_section_items_section_id').on(table.sectionId),
  positionIdx: index('idx_section_items_position').on(table.sectionId, table.position),
}));

export const streamingPlatforms = pgTable('streaming_platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const moviePlatforms = pgTable('movie_platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  movieId: integer('movie_id').notNull().references(() => moviesImported.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id').notNull().references(() => streamingPlatforms.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  moviePlatformUnique: unique().on(table.movieId, table.platformId),
}));

export const tvShowPlatforms = pgTable('tv_show_platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  tvShowId: integer('tv_show_id').notNull().references(() => tvShowsImported.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id').notNull().references(() => streamingPlatforms.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tvShowPlatformUnique: unique().on(table.tvShowId, table.platformId),
}));

export const watchHistory = pgTable('watch_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  itemId: integer('item_id').notNull(),
  itemType: text('item_type').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  voteAverage: decimal('vote_average', { precision: 3, scale: 1 }),
  watchedAt: timestamp('watched_at', { withTimezone: true }).defaultNow(),
  timeSpent: integer('time_spent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userItemTypeUnique: unique().on(table.userId, table.itemId, table.itemType),
}));

export const savedItems = pgTable('saved_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  itemId: integer('item_id').notNull(),
  itemType: text('item_type').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  voteAverage: decimal('vote_average', { precision: 3, scale: 1 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userItemTypeUnique: unique().on(table.userId, table.itemId, table.itemType),
}));

export const searchHistory = pgTable('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  query: text('query').notNull(),
  searchedAt: timestamp('searched_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const popularContentClicks = pgTable('popular_content_clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: integer('content_id').notNull(),
  contentType: text('content_type').notNull(),
  title: text('title').notNull(),
  clickCount: integer('click_count').notNull().default(0),
  lastClickedAt: timestamp('last_clicked_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  contentTypeUnique: unique().on(table.contentId, table.contentType),
}));
