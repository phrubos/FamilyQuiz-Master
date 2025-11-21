# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FamilyQuiz Master is a real-time multiplayer quiz game built with Next.js 16. Players join rooms via QR code or room code on their phones and answer questions while the host displays questions on a shared screen.

**Language**: Hungarian UI, code comments in English

## Commands

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Real-time Communication
- **Pusher** for WebSocket events between host and players
- Channel naming: `private-game-{roomCode}`
- Events: `player-joined`, `question-shown`, `answer-received`, `question-ended`, `game-ended`, `voting-started`, `vote-cast`, `voting-ended`, `game-paused`, `game-resumed`

### State Management
- **In-memory Map** in `src/lib/gameStore.ts` stores all room state
- ⚠️ Rooms are lost on server restart/hot reload - create new room after code changes
- Can be migrated to Vercel Postgres (dependency already included)

### Key Files
- `src/types/game.ts` - All TypeScript types, CategoryType enum, CATEGORY_META with icons/colors
- `src/lib/gameStore.ts` - Room CRUD, voting, pause, scoring logic
- `src/data/questions.ts` - 300 questions across 15 categories (20 per category)
- `src/lib/pusher.ts` - Pusher client/server configuration
- `src/lib/shuffle.ts` - Fisher-Yates shuffle for questions/answers

### Pages
- `/` - Home page with "New Game" and "Join Game"
- `/host/[code]` - Host view with QR code, questions, leaderboard
- `/play/[code]` - Player view with answer buttons

### API Routes
All in `src/app/api/rooms/`:
- `POST /api/rooms` - Create room
- `GET /api/rooms/[code]` - Get room state
- `POST /api/rooms/[code]/join` - Player joins
- `POST /api/rooms/[code]/start` - Start game
- `POST /api/rooms/[code]/answer` - Submit answer
- `POST /api/rooms/[code]/next` - Move to next question (called when timer ends)
- `POST /api/rooms/[code]/vote` - Category voting (actions: start, cast, end)
- `POST /api/rooms/[code]/pause` - Pause/resume (actions: pause, resume)

### Game Flow
1. Host creates room → gets 6-character code
2. Players join via QR/code
3. Host starts game → first question shown
4. 15-second answer timer → results calculated → 8-second delay → next question
5. Every 3 questions: category voting (10 seconds)
6. Game ends → final leaderboard

### Scoring
- Base: 1000 points for correct answer
- Position multiplier: decreases 10% per correct answer (min 50%)
- Mixed category: 2x bonus multiplier

## Tech Stack
- Next.js 16 with App Router
- React 19
- Tailwind CSS 4
- Framer Motion for animations
- Pusher for real-time
- QRCode for code generation

## Environment Variables
Required in `.env.local`:
```
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```
