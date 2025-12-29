# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"What's on tonight" is a collaborative movie/TV discovery app built with React Native (Expo). Users create or join rooms, swipe on movies together (Tinder-style), and find matches in real-time.

**Stack:**
- **Frontend**: Expo, NativeWind (Tailwind CSS), React Native Reanimated, Gesture Handler
- **Backend**: Convex (real-time sync, mutations, queries)
- **Data Sources**: TMDB API (movies/TV/streaming providers), Jellyfin (optional home server)
- **Routing**: Expo Router (file-based)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (choose platform in terminal)
npm start

# Platform-specific starts
npm run android
npm run ios
npm run web

# Type checking
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format
```

## Architecture

### File-Based Routing (Expo Router)
- `app/index.tsx` - Home screen (create/join/resume room)
- `app/room/config.tsx` - Room configuration (genres, providers, settings)
- `app/room/join.tsx` - Join room by code
- `app/room/[id].tsx` - Active room with swiping interface
- `app/movie/[id].tsx` - Movie detail modal
- `app/settings/index.tsx` - User settings (region, platforms, home server)

### Convex Backend (`convex/`)
Real-time collaborative backend with mutations and queries:

**Schema (`schema.ts`):**
- `rooms` - Room state, config (code, status, filters, randomSeed)
- `users` - Users in rooms (sessionId, name)
- `swipes` - User swipes on movies (direction: left/right/super)
- `matches` - Detected matches when all users like the same movie

**Mutations:**
- `rooms.create` - Creates room with 4-digit code and randomSeed
- `rooms.join` - Joins existing room (or returns existing user)
- `rooms.leave` - Leaves room, cleans up swipes/matches if last user
- `swipes.submit` - Records swipe, checks for match, updates room status

**Queries:**
- `rooms.get` - Get room details
- `rooms.listUsers` - Get all users in room
- `rooms.getUserSwipes` - Get user's swipe history (for filtering)
- `rooms.getMatch` / `getMatches` - Get match(es) for room

### Key Patterns

**Session Management (`utils/session.ts`):**
- Session ID: UUID generated once and persisted in AsyncStorage
- User preferences stored: name, country, platforms, home server config
- Active room tracking for resume functionality

**Deterministic Shuffle (`utils/random.ts`):**
- Uses seeded random number generator for consistent shuffling
- Room's `randomSeed` ensures all users see movies in the same order
- Critical for "shared deck" experience

**Room Lifecycle:**
1. `waiting` - Room created, users joining
2. `active` - Game started, users swiping
3. `matched` - Match found (in "first match" mode only)

**Match Detection (`convex/swipes.ts`):**
- On right/super swipe, checks if all room users liked the movie
- In "first match" mode: sets room status to `matched`
- In "all" (full deck) mode: continues collecting matches

**Encryption (`utils/crypto.ts`):**
- Home server configs (Jellyfin/Plex credentials) encrypted before storing in Convex
- Uses crypto-js AES encryption with session-based key

**TMDB Integration (`services/tmdb/`):**
- API client using Bearer token from `EXPO_PUBLIC_TMDB_READ_TOKEN`
- Fetches movies/TV with filters (genre, region, providers)
- Provider data for "where to watch" information

**Jellyfin Integration (`services/jellyfin/`):**
- Optional home server integration
- Checks if TMDB movies exist in user's local library
- Discovery service maps TMDB IDs to Jellyfin items

### Component Organization

**Room Components (`components/Room/`):**
- `CardStack.tsx` - Swipeable card deck using Reanimated/Gesture Handler
- `WaitingRoom.tsx` - Pre-game lobby showing joined users
- `MatchFound.tsx` - Single match display screen
- `Results.tsx` - Full deck mode results with all matches

**Movie Components (`components/Movie/`):**
- `MovieHeader.tsx`, `MovieInfo.tsx` - Detail screen layout
- `CastList.tsx`, `CrewList.tsx` - Cast/crew displays

**Utility Components:**
- `CountrySelector.tsx` - Region picker for TMDB
- `ProviderSelector.tsx` - Streaming service multi-select
- `ProviderAttribution.tsx` - "Where to watch" logos

### Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
EXPO_PUBLIC_TMDB_READ_TOKEN=your_tmdb_bearer_token
```

### Important Implementation Details

**Swipe Persistence:**
- User swipes stored in Convex to prevent re-showing movies
- Filtered client-side using `rooms.getUserSwipes` query

**Room Codes:**
- 4-digit numeric codes generated randomly
- Indexed in Convex for fast lookup

**Styling:**
- NativeWind (Tailwind) with `className` prop
- Primary colors: slate (background), indigo (primary), green (success)
- Dark theme default

**Navigation:**
- Stack navigation in `app/_layout.tsx`
- Modals for room config and movie details
- ConvexProvider wraps entire app for real-time queries

### Common Gotchas

- **TypeScript**: Run `npm run typecheck` before committing
- **Convex Types**: Auto-generated in `convex/_generated/` - don't edit manually
- **Platform Differences**: Test both iOS/Android when using native features (haptics, linking)
- **AsyncStorage**: All operations are async, await them properly
- **Seeded Random**: Always use room's randomSeed for deterministic behavior across clients
- **Session IDs**: Used to identify users across app restarts, not room-specific
