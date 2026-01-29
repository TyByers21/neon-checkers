# NeoCheckers

## Overview

NeoCheckers is a cyberpunk-themed checkers game built as a full-stack TypeScript application. Players compete against an AI opponent with configurable difficulty levels. The game features a futuristic neon aesthetic with animations, sound effects, and victory celebrations. Game history is stored locally and can optionally be persisted to a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom cyberpunk theme using CSS variables
- **UI Components**: shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for board animations and transitions
- **Special Effects**: canvas-confetti for victory celebrations

The frontend follows a pages-based structure with three main routes:
- Home (`/`) - Player setup and difficulty selection
- Game (`/game`) - Main gameplay board
- History (`/history`) - Past game records

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Build Tool**: Vite for development, esbuild for production bundling
- **API Style**: REST endpoints defined in shared route definitions

The server uses a simple storage interface pattern that abstracts database operations, making it easy to swap storage implementations.

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Local Fallback**: localStorage for game history (used when offline or for quick access)
- **Schema Location**: `shared/schema.ts` with Drizzle table definitions
- **Migrations**: Generated via `drizzle-kit push`

### Game Logic
- Client-side game engine implementing standard checkers rules
- AI opponent with difficulty-based move selection
- Move validation includes regular moves, jumps, and king promotions
- Game state managed via custom `useGameEngine` hook

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Database schema and Zod validation schemas
- `routes.ts` - API route definitions with type-safe input/output schemas

### Build Configuration
- Development uses Vite with HMR
- Production builds client to `dist/public` and bundles server with esbuild
- Path aliases: `@/` for client source, `@shared/` for shared code

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage (available but not currently active)

### Frontend Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Framer Motion**: Animation library for smooth transitions
- **canvas-confetti**: Particle effects for victory celebrations
- **date-fns**: Date formatting for game history display
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Development server with hot module replacement
- **Replit plugins**: Dev banner, cartographer, and error overlay for Replit environment
- **TypeScript**: Strict mode enabled with bundler module resolution