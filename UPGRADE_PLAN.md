# Családi Kvíz Mester - Fejlesztési Terv v2

## Új Funkciók

### 1. Automatikus Játékmenet
- [ ] "Következő kérdés" gomb eltávolítása
- [ ] Automatikus továbblépés 5 másodperc múlva eredmény után
- [ ] Vizuális visszaszámláló (progress bar) a következő kérdésig
- [ ] Szünet gomb hozzáadása (pause/resume)
- [ ] Home gomb a főoldalra visszatéréshez

### 2. Témakör Választás (minden 3. kérdés után)
- [ ] 3 random témakör megjelenítése szavazásra
- [ ] Játékosok telefonon szavaznak
- [ ] Legtöbb szavazatot kapott témakör lesz a következő 3 kérdés
- [ ] Szavazási időlimit (10 másodperc)
- [ ] Döntetlen esetén random választás

### 3. Kérdések Randomizálása
- [ ] 1500 kérdés létrehozása (15 kategória × 100 kérdés)
- [ ] Random kérdés kiválasztás kategórián belül
- [ ] Válaszok (A, B, C, D) sorrendjének randomizálása
- [ ] Helyes válasz index frissítése a shuffle után

### 4. Kategóriák (15 db)
1. Történelem
2. Földrajz
3. Tudomány
4. Sport
5. Kultúra & Művészet
6. Zene
7. Film & TV
8. Irodalom
9. Természet & Állatok
10. Étel & Ital
11. Technológia
12. Politika
13. Gazdaság
14. Nyelvtan & Szólások
15. Vegyes (Dupla pont)

## Technikai Változások

### Frontend (Host képernyő)
```typescript
// Új state-ek
const [isPaused, setIsPaused] = useState(false);
const [nextQuestionCountdown, setNextQuestionCountdown] = useState(0);
const [isVoting, setIsVoting] = useState(false);
const [votingOptions, setVotingOptions] = useState<string[]>([]);
const [votes, setVotes] = useState<Record<string, number>>({});
```

### Frontend (Játékos képernyő)
```typescript
// Szavazás támogatása
const [isVotingMode, setIsVotingMode] = useState(false);
const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
```

### Backend (API)
- [ ] POST /api/rooms/[code]/pause - játék szüneteltetése
- [ ] POST /api/rooms/[code]/vote - kategória szavazás
- [ ] GET /api/rooms/[code]/categories - elérhető kategóriák

### Pusher Events
- `game-paused` - játék megállítva
- `game-resumed` - játék folytatva
- `voting-started` - szavazás kezdődik
- `vote-received` - szavazat érkezett
- `voting-ended` - szavazás vége, eredmény

## Játékmenet Flow

```
[Várakozás] → [Játék Indítás]
     ↓
[Kérdés #1] → 15mp válaszidő → [Eredmény] → 5mp várakozás
     ↓
[Kérdés #2] → 15mp válaszidő → [Eredmény] → 5mp várakozás
     ↓
[Kérdés #3] → 15mp válaszidő → [Eredmény] → 5mp várakozás
     ↓
[SZAVAZÁS] → 3 kategória megjelenik → 10mp szavazási idő
     ↓
[Kérdés #4] → (nyertes kategóriából) → ...
     ↓
... (ismétlés minden 3 kérdés után)
     ↓
[Végeredmény]
```

## UI Elemek

### Host Képernyő
- Progress bar a következő kérdésig
- Szünet gomb (⏸️)
- Home gomb (🏠)
- Szavazás eredmény kijelző

### Játékos Képernyő
- Kategória választó gombok szavazáskor
- Szünet üzenet megjelenítése

## Fájlstruktúra

```
src/
├── data/
│   └── questions.ts        # 1500 kérdés, 15 kategória
├── lib/
│   ├── gameStore.ts        # Szavazás logika
│   └── shuffle.ts          # Randomizálás utility
├── app/
│   ├── api/
│   │   └── rooms/[code]/
│   │       ├── pause/      # Szünet kezelés
│   │       └── vote/       # Szavazás
│   ├── host/[code]/
│   │   └── page.tsx        # Frissített host UI
│   └── play/[code]/
│       └── page.tsx        # Frissített játékos UI
```

## Implementációs Sorrend

### Phase 1: Alap UI javítások
1. Key warning fix
2. Következő gomb eltávolítása
3. Auto-advance progress bar
4. Szünet & Home gombok

### Phase 2: Randomizálás
1. Shuffle utility létrehozása
2. Válaszok randomizálása
3. Kérdések random sorrendje

### Phase 3: Kérdések bővítése
1. **Kategória típusok definiálása**
   - TypeScript enum/type a 15 kategóriához
   - Kategória metaadatok (név, ikon, szín, pont szorzó)
   - Vegyes kategória dupla pont logika

2. **Kérdés struktúra frissítése**
   ```typescript
   interface Question {
     id: string;
     category: CategoryType;
     difficulty: 'easy' | 'medium' | 'hard';
     question: string;
     answers: string[];
     correctIndex: number;
     explanation?: string;
   }
   ```

3. **Kérdésbank létrehozása (1500 kérdés)**
   - 100 kérdés kategóriánként
   - Nehézségi szintek: 40 easy, 40 medium, 20 hard
   - JSON fájl struktúra kategóriánként csoportosítva
   - AI generálás + manuális ellenőrzés

4. **Kérdés betöltés optimalizálás**
   - Lazy loading kategóriánként
   - Kérdés cache rendszer
   - Már feltett kérdések követése (session)

5. **Validáció és tesztelés**
   - Duplikátum ellenőrzés
   - Válasz helyesség validálás
   - Kategória egyensúly ellenőrzés

### Phase 4: Szavazás rendszer

#### 4.1 Backend API
1. **POST /api/rooms/[code]/vote/start**
   - 3 random kategória kiválasztása
   - Szavazás időzítő indítása (10mp)
   - Pusher event küldése játékosoknak

2. **POST /api/rooms/[code]/vote/cast**
   - Játékos szavazat fogadása
   - Validálás (1 szavazat/játékos)
   - Aktuális szavazatok frissítése

3. **POST /api/rooms/[code]/vote/end**
   - Szavazatok összesítése
   - Győztes kategória meghatározása
   - Döntetlen esetén random választás
   - Következő 3 kérdés betöltése

4. **POST /api/rooms/[code]/pause**
   - Játék állapot megállítása
   - Időzítők felfüggesztése
   - Resume funkcionalitás

#### 4.2 Pusher Events
```typescript
// Szavazás események
'voting-started': {
  categories: string[];      // 3 kategória
  duration: number;          // 10000ms
  endTime: number;           // timestamp
}

'vote-cast': {
  playerId: string;
  category: string;
  currentVotes: Record<string, number>;
}

'voting-ended': {
  winner: string;
  votes: Record<string, number>;
  nextCategory: string;
}

// Pause események
'game-paused': {
  pausedAt: number;
  pausedBy: string;
}

'game-resumed': {
  resumedAt: number;
}
```

#### 4.3 Host UI szavazás megjelenítő
1. **Szavazás képernyő komponens**
   - 3 kategória kártya megjelenítése
   - Élő szavazat számláló minden kategóriánál
   - Visszaszámláló (10mp)
   - Animált progress bar

2. **Szavazás eredmény animáció**
   - Győztes kategória kiemelése
   - Konfetti effekt
   - 3mp várakozás eredmény után

3. **Pause overlay**
   - Teljes képernyős szünet jelző
   - Resume gomb
   - Aktuális állás megjelenítése

#### 4.4 Játékos UI szavazás
1. **Szavazás mód komponens**
   - 3 nagy gomb a kategóriákhoz
   - Kategória ikonok és színek
   - Visszaszámláló megjelenítés

2. **Szavazat visszajelzés**
   - Kiválasztott kategória megerősítése
   - Várakozás a többi játékosra
   - "Szavazatod: [kategória]" üzenet

3. **Szünet kezelés**
   - "Játék szünetel" üzenet
   - Várakozás a folytatásra

#### 4.5 GameStore frissítések
```typescript
// Új mezők
votingState: {
  isActive: boolean;
  options: string[];
  votes: Record<string, string>;  // playerId -> category
  endTime: number;
  winner?: string;
}

pauseState: {
  isPaused: boolean;
  pausedAt?: number;
  remainingTime?: number;
}

// Új műveletek
startVoting(categories: string[]): void;
castVote(playerId: string, category: string): void;
endVoting(): string;  // returns winner
pauseGame(): void;
resumeGame(): void;
```

#### 4.6 Játékmenet integráció
1. **Kérdés számláló logika**
   - Minden 3. kérdés után szavazás trigger
   - questionIndex % 3 === 0 && questionIndex > 0

2. **Automatikus átmenet**
   - Eredmény → 5mp → Szavazás/Következő kérdés
   - Szavazás vége → 3mp → Első kérdés új kategóriából

3. **Kategória tracking**
   - Aktuális kategória megjelenítése
   - Hátralévő kérdések számolása

## Becsült Méret
- Kérdések JSON: ~500KB (1500 kérdés)
- Új kód: ~1000 sor

---

**Készen állsz a fejlesztésre?**
