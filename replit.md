# StreamFusion - Movie & TV Series Streaming Platform

## Overview

StreamFusion is a full-stack streaming platform application that allows users to browse, search, and watch movies and TV shows. The platform features a modern, Netflix-style interface with support for both web and mobile (via Capacitor for Android). It integrates with The Movie Database (TMDB) API for content metadata and uses a PostgreSQL database to manage imported content, user data, and administrative features.

The application is built with React, TypeScript, and Vite on the frontend, with an Express.js backend for API routes. It uses Supabase for authentication and database management, and includes an admin panel for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type safety and component development
- Vite as the build tool for fast development and optimized production builds
- React Router for client-side routing and navigation

**UI Component System**
- Shadcn/ui components built on Radix UI primitives for accessible, customizable UI elements
- Tailwind CSS for utility-first styling with a custom dark theme
- Custom design system with HSL color variables defined in `src/index.css`

**State Management**
- TanStack Query (React Query) for server state management with infinite cache times for media content
- React hooks for local component state
- Custom hooks for shared logic (authentication, admin checks, search history, watch history)

**Mobile Support**
- Capacitor for native Android app functionality
- Plugins for screen orientation, splash screen, status bar, and push notifications
- Responsive design with mobile-first approach
- Custom swipe navigation for tab switching on mobile devices

### Backend Architecture

**Server Framework**
- Express.js server running on port 3001
- CORS enabled for cross-origin requests
- RESTful API endpoints under `/api` prefix

**Database ORM**
- Drizzle ORM for type-safe database queries
- PostgreSQL dialect configured for database operations
- Schema definitions in `server/schema.ts`

**API Proxy**
- Vite dev server proxies `/api` requests to Express backend (port 3001)
- Production setup expects backend to handle API routes directly

### Data Storage Solutions

**Primary Database: PostgreSQL (Neon)**
- Managed through Replit's built-in Neon PostgreSQL database
- Connection via `DATABASE_URL` environment variable
- Schema managed with Drizzle ORM (`server/schema.ts`)

**Database Schema:**

**User Management**
- `profiles` - User profile information linked to Supabase auth
- `user_roles` - Role-based access control (admin/user roles)

**Content Management**
- `movies_imported` - Imported movie data with TMDB IDs, video URLs, metadata, and categories
- `tv_shows_imported` - Imported TV show data with season information
- `seasons` - TV show season details
- `episodes` - Individual episode data with video URLs
- `sections` - Dynamic content sections for homepage organization
- `section_items` - Items within custom sections
- `streaming_platforms` - Streaming platform information and logos
- `movie_platforms` & `tv_show_platforms` - Many-to-many relationships for platform assignments

**User Activity**
- `saved_items` - User's saved/bookmarked content
- `watch_history` - Viewing history with timestamps and watch duration
- `search_history` - User search queries
- `content_clicks` - Tracking popular content based on clicks

**Real-time Subscriptions**
- Supabase real-time subscriptions for live updates to episodes and movies
- Automatic cache invalidation when content is updated in the admin panel

### Authentication & Authorization

**Authentication Provider: Supabase Auth**
- Email/password authentication
- Session management via Supabase client
- Auth state persistence across page refreshes

**Authorization**
- Role-based access control via `user_roles` table
- Admin role required for content management panel
- Protected routes check authentication status before rendering

### External Dependencies

**Third-Party APIs**

**The Movie Database (TMDB)**
- Primary source for movie and TV show metadata
- API key stored in `VITE_TMDB_API_KEY` environment variable
- Used for searching content, fetching details, images, and logos
- Base URL: `https://api.themoviedb.org/3`
- Image CDN: `https://image.tmdb.org/t/p`

**Supabase**
- Backend-as-a-Service for authentication and database
- Real-time subscriptions for live data updates
- Connection string via `DATABASE_URL`
- Client SDK: `@supabase/supabase-js`

**Firebase Cloud Messaging (FCM)**
- Push notifications for Android app
- Configuration in `android/app/google-services.json`
- Integration via Capacitor Push Notifications plugin

**Key Libraries**

**UI & Styling**
- `tailwindcss` - Utility-first CSS framework
- `tailwindcss-animate` - Animation utilities
- `class-variance-authority` - Component variant management
- `clsx` & `tailwind-merge` - Conditional class name utilities

**Data Fetching & State**
- `@tanstack/react-query` - Asynchronous state management
- `@supabase/supabase-js` - Supabase client library

**Forms & Validation**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation library

**Carousel & Media**
- `embla-carousel-react` - Carousel component
- `embla-carousel-autoplay` & `embla-carousel-fade` - Carousel plugins

**Mobile Platform**
- `@capacitor/core` - Core Capacitor runtime
- `@capacitor/android` - Android platform support
- `@capacitor/app` - App lifecycle events
- `@capacitor/screen-orientation` - Screen orientation control
- `@capacitor/splash-screen` - Splash screen management
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/push-notifications` - Push notification support

**Development Tools**
- `drizzle-orm` & `drizzle-kit` - Database ORM and migration tools
- `tsx` - TypeScript execution for Node.js
- `vite` - Build tool and dev server
- `eslint` - Code linting
- `typescript` - Type checking

**Content Protection**
- Custom hook (`useContentProtection`) disables right-click, developer tools shortcuts, and copy/paste
- Implemented to protect streaming content from easy extraction

**Architecture Decisions**

**Infinite Cache Strategy**
- Media content (movies, TV shows, sections) cached indefinitely to minimize API calls
- Improves performance and reduces TMDB API usage
- Manual cache invalidation on admin updates

**Session-Based Shuffling**
- Content order randomized per session (not per page load)
- Session key stored in `sessionStorage` for consistent ordering
- Provides variety while maintaining UX consistency

**Realtime Updates**
- Supabase realtime subscriptions update video URLs without page refresh
- Critical for admin workflow when adding streaming links

**Mobile-First Responsive Design**
- Separate mobile and desktop navigation components
- Touch-optimized UI with swipe gestures
- Native Android app capabilities via Capacitor