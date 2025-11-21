# FamilyQuiz Phone-to-Host Connection Flow Analysis

## Quick Summary

The FamilyQuiz app uses a **REST API for initial join + Pusher WebSocket for real-time events** architecture. Players can join via QR code scan or manual code entry, then receive live game updates via Pusher.

### Key Files:
- `/src/app/play/[code]/page.tsx` - Player join UI & Pusher subscription (1,189 lines)
- `/src/app/api/rooms/[code]/join/route.ts` - Join endpoint (73 lines)
- `/src/lib/pusher.ts` - Pusher configuration (85 lines)
- `/src/app/page.tsx` - Home page with code entry (227 lines)
- `/src/lib/gameStore.ts` - In-memory room state (910 lines)

---

## PLAYER JOIN FLOW (Entry Points)

### 1. Manual Code Entry
**Route:** Home page (/) → Input room code → Navigate to `/play/[code]`
- Minimum 4 characters
- Case-insensitive (converted to uppercase)
- No validation until join page

### 2. QR Code Scanning
**Generated on:** Host page (`/host/[code]`)
**Points to:** `/play/[code]` URL
- Generated client-side using `qrcode` library v1.5.4
- No authorization check (anyone with code can scan)

### 3. Join Page Flow (`/play/[code]`)
1. **Avatar Selection** - 26 emoji avatars (animals, food, objects)
2. **Name Input** - 2-20 characters, Hungarian chars allowed
3. **Join Button** - `POST /api/rooms/[code]/join`
4. **Waiting Screen** - Connection monitor + Pusher subscription
5. **Game Start** - Receive `game-started` event

---

## JOIN API ENDPOINT

**Path:** `POST /api/rooms/[code]/join`

### Validations:
1. Name non-empty ✓
2. Room exists ✓
3. Game status === 'waiting' ✓
4. Player added to in-memory store ✓

### Pusher Notification:
- Sends 'player-joined' event to `game-{roomCode}` channel
- Fire-and-forget: doesn't fail join if Pusher fails (GOOD!)

### Response:
```json
{
  "player": { "id": "uuid", "name": "string", "avatar": "string", "teamId": "optional" },
  "roomCode": "ABCDEF"
}
```

---

## PUSHER REAL-TIME LAYER

### Configuration:
- **Server:** Pusher v5.2.0 (TLS enabled)
- **Client:** Pusher-JS v8.4.0 (WebSocket + WSS)
- **Channel:** `game-{roomCode}` (one channel per room)
- **Initialization:** Lazy (only when needed)

### Events Subscribed:
- `room-updated` - Settings changes
- `game-started` - Game begins (countdown)
- `question-shown` - New question (with timer sync)
- `question-ended` - Results + streaks
- `game-ended` - Final leaderboard
- `voting-started/ended` - Category voting
- `game-paused/resumed` - Pause state
- `achievement-earned` - Unlocked achievements
- `player-joined` - (Host only)

### Connection Monitoring:
- Polled every 2 seconds (arbitrary)
- Three states: connected, connecting, disconnected
- Visual indicator on waiting screen (green/yellow/red dot)

---

## CRITICAL ISSUES FOUND

### 🚨 #1: NO RECONNECTION LOGIC (Worst)
- **Problem:** If network drops, player CANNOT auto-reconnect
- **Impact:** Must manually refresh page → Gets new player ID → Original player becomes "ghost"
- **Scenario:** 5-second network hiccup = duplicate players on leaderboard

### 🚨 #2: NO RATE LIMITING
- **Problem:** Anyone can hammer endpoint with 1,000 join attempts
- **Impact:** Memory exhaustion, server abuse
- **Risk:** DDoS vulnerability

### 🚨 #3: IN-MEMORY STORAGE ONLY
- **Problem:** `const rooms = new Map()` - Lost on server restart
- **Impact:** All games disappear on redeploy
- **Note:** `@vercel/postgres` is installed but unused

### ⚠️ #4: NO REQUEST TIMEOUT
- **Problem:** `fetch()` with no timeout - UI freezes if server hangs
- **Impact:** Mobile users stuck indefinitely
- **Solution:** Add AbortController with 10-second timeout

### ⚠️ #5: 2-SECOND POLLING INEFFICIENCY
- **Problem:** Polling for connection status every 2 seconds
- **Impact:** Battery drain, up to 2-second detection delay
- **Solution:** Listen to Pusher `state_change` events instead

### ⚠️ #6: SILENT ANSWER FAILURES
- **Problem:** Answer marked as sent BEFORE server confirmation
- **Impact:** If network fails, player thinks sent but wasn't
- **Solution:** Implement optimistic updates with rollback

---

## STRENGTHS

✓ **Clean Architecture** - Separation of concerns (API, Pusher, UI)
✓ **Good Error Messages** - User-friendly Hungarian messages
✓ **Non-blocking Pusher** - Join succeeds even if Pusher fails
✓ **TLS Security** - All Pusher connections encrypted
✓ **Event-Driven** - Clean event binding pattern
✓ **Connection Visibility** - Status indicator for users
✓ **UUID Player IDs** - Non-sequential, hard to guess

---

## RECOMMENDED FIXES (Priority Order)

### IMMEDIATE (This Week)
1. **Add Reconnection with Backoff** - Attempt rejoin 5x with exponential delays
2. **Add Request Timeout** - 10 seconds max for join request
3. **Add Rate Limiting** - 5 joins per minute per IP
4. **Persist Rooms to Database** - Use @vercel/postgres to save room state

### SOON (Next Week)
1. **Response Validation** - Use Zod schema for type-safe parsing
2. **Offline Detection** - Listen to `navigator.onLine` events
3. **Optimistic Updates** - Rollback on network failure
4. **Duplicate Join Handling** - Detect & reuse existing player ID

### LATER (Next Month)
1. **Session Tokens** - Better player tracking
2. **Health Checks** - Periodic ping to verify connection
3. **Activity Tracking** - Detect inactive players
4. **Error Schema** - Consistent API error responses

---

## CODE SNIPPETS FOR FIXES

### Fix #1: Reconnection with Backoff
```typescript
const reconnectWithBackoff = async (attempt = 0) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  await new Promise(r => setTimeout(r, delay));
  
  try {
    const res = await fetchWithTimeout(`/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, oldPlayerId: playerId }),
    }, 10000);
    
    if (res.ok) {
      const data = await res.json();
      setPlayerId(data.player.id);
      setIsJoined(true);
      return true;
    }
  } catch (err) {
    if (attempt < 5) return reconnectWithBackoff(attempt + 1);
  }
  return false;
};

// Listen to disconnects
_pusherClient.connection.bind('disconnected', () => {
  setConnectionStatus('disconnected');
  reconnectWithBackoff();
});
```

### Fix #2: Request Timeout
```typescript
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
};

// Usage
const res = await fetchWithTimeout(`/api/rooms/${code}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: trimmedName, avatar }),
}, 10000);
```

### Fix #3: Offline Detection
```typescript
useEffect(() => {
  window.addEventListener('online', () => {
    if (isJoined && connectionStatus === 'disconnected') {
      reconnectWithBackoff();
    }
  });
  
  window.addEventListener('offline', () => {
    setConnectionStatus('disconnected');
  });
}, [isJoined, connectionStatus]);
```

---

## ARCHITECTURE DIAGRAM

```
┌──────────────┐
│  Home Page   │
│   (/)        │
└──────┬───────┘
       │ Code Entry or QR Scan
       ↓
┌──────────────────────┐
│   Join Page          │
│  (/play/[code])      │
│ 1. Avatar Select     │
│ 2. Name Input        │
│ 3. Join Button       │
└──────┬───────────────┘
       │ POST /api/rooms/[code]/join
       ↓
┌────────────────────────────────┐
│  Join API Endpoint             │
│  ✓ Validate room exists        │
│  ✓ Validate game status        │
│  ✓ Add player to gameStore     │
│  ✓ Send Pusher notification    │
└──────┬─────────────────────────┘
       │ Return playerId
       ↓
┌──────────────────────────────────┐
│ Player Joined Successfully       │
│ ✓ Store playerId in React state │
│ ✓ Subscribe to Pusher channel   │
│ ✓ Bind event handlers           │
│ ✓ Start connection monitor      │
└──────┬──────────────────────────┘
       │
       ↓ Listen to events
┌────────────────────┐
│ Waiting Screen     │
│ Show connection    │
│ indicator          │
└────┬───────────────┘
     │ game-started event
     ↓
┌────────────────────┐
│ Game Screen        │
│ Display questions  │
│ Submit answers     │
│ Show results       │
└────────────────────┘
```

---

## Files Analyzed

| File | Lines | Purpose | Health |
|------|-------|---------|--------|
| `/src/app/play/[code]/page.tsx` | 1,189 | Player join UI & game screen | ⚠️ Missing reconnection |
| `/src/app/api/rooms/[code]/join/route.ts` | 73 | Join endpoint | ⚠️ No rate limit |
| `/src/lib/pusher.ts` | 85 | Pusher config | ✓ Good |
| `/src/app/page.tsx` | 227 | Home with code entry | ✓ Good |
| `/src/lib/gameStore.ts` | 910 | Room state (in-memory) | 🚨 No persistence |
| `/src/types/game.ts` | 200+ | Type definitions | ✓ Good |

---

## Conclusion

**Current State:** Functional but fragile. Works well for ideal network conditions but breaks during typical mobile scenarios (brief disconnects, network switches).

**What's Needed:** Better resilience through reconnection logic, timeouts, persistence, and rate limiting.

**Effort:** Critical fixes = ~4-6 hours of development + testing

