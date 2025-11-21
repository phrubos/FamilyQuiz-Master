import { Room, Player, Answer, GameSettings, CategoryType, VotingState, PauseState, EarnedAchievement, AchievementType, AvatarId, getRandomAvatar, PowerUpType, GameStats, CATEGORY_META, TeamId, Spectator, GameLength, RoundConfig, Question, Difficulty } from '@/types/game';
import { categories, getRandomCategories } from '@/data/questions';
import { shuffleArray, shuffleQuestion, getRandomItems } from './shuffle';

// In-memory store (can be replaced with Vercel Postgres)
const rooms = new Map<string, Room>();

const DEFAULT_SETTINGS: GameSettings = {
  timeLimit: 15,
  basePoints: 1000,
  pointsPerQuestion: 1000,
  showAnswers: true,
  streakBonus: true,
  bonusMultiplier: 2,
  mode: 'classic',
  teamCount: 2,
  kidsMode: false,
  theme: 'default',
  gameLength: 'medium',
};

function generateRounds(length: GameLength): RoundConfig[] {
  switch (length) {
    case 'short':
      return [
        { id: 'r1', name: 'Bemelegítés', type: 'mixed', questionCount: 1, difficulty: 'easy' },
        { id: 'r2', name: 'Közönség Kedvence', type: 'category', questionCount: 1, difficulty: 'medium' },
        { id: 'r3', name: 'Finálé', type: 'finale', questionCount: 1, difficulty: 'hard', multiplier: 2 },
      ];
    case 'medium':
      return [
        { id: 'r1', name: 'Bemelegítés', type: 'mixed', questionCount: 1, difficulty: 'easy' },
        { id: 'r2', name: 'Kategória Választás 1', type: 'category', questionCount: 1, difficulty: 'medium' },
        { id: 'r3', name: 'Kategória Választás 2', type: 'category', questionCount: 1, difficulty: 'medium' },
        { id: 'r4', name: 'Finálé', type: 'finale', questionCount: 1, difficulty: 'hard', multiplier: 2 },
      ];
    case 'long':
      return [
        { id: 'r1', name: 'Bemelegítés', type: 'mixed', questionCount: 1, difficulty: 'easy' },
        { id: 'r2', name: 'Kategória Választás 1', type: 'category', questionCount: 1, difficulty: 'medium' },
        { id: 'r3', name: 'Kategória Választás 2', type: 'category', questionCount: 1, difficulty: 'medium' },
        { id: 'r4', name: 'Kategória Választás 3', type: 'category', questionCount: 1, difficulty: 'medium' },
        { id: 'r5', name: 'Finálé', type: 'finale', questionCount: 1, difficulty: 'hard', multiplier: 2 },
      ];
    default:
        return [];
  }
}

function generateQuestionsForRound(round: RoundConfig, categoryOverride?: CategoryType): Question[] {
    let potentialQuestions: Question[] = [];

    // Filter by category
    if (round.type === 'category' && categoryOverride) {
        const cat = categories.find(c => c.id === categoryOverride);
        if (cat) potentialQuestions = cat.questions;
    } else {
        // Mixed / Lightning / Finale uses all questions (or mixed category?)
        // Let's use all categories for variety, except for specific difficulty
        potentialQuestions = categories.flatMap(c => c.questions);
    }

    // Filter by difficulty if specified
    if (round.difficulty) {
        potentialQuestions = potentialQuestions.filter(q => q.difficulty === round.difficulty);
    }

    // Shuffle and pick
    const selected = getRandomItems(potentialQuestions, round.questionCount);
    
    // Shuffle answers
    return selected.map(q => shuffleQuestion(q));
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(hostId: string): Room {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const rounds = generateRounds(DEFAULT_SETTINGS.gameLength);
  // Generate questions for first round
  const questions = rounds.length > 0 ? generateQuestionsForRound(rounds[0]) : [];

  const room: Room = {
    code,
    hostId,
    players: [],
    spectators: [],
    status: 'waiting',
    currentQuestionIndex: 0,
    currentCategoryIndex: 0,
    questions,
    answers: [],
    settings: { ...DEFAULT_SETTINGS },
    achievements: [],
    firstCorrectGiven: false,
    createdAt: Date.now(),
    rounds,
    currentRoundIndex: 0
  };

  rooms.set(code, room);
  console.log(`Room created: ${code}, Total rooms: ${rooms.size}`);
  return room;
}

export function updateRoomSettings(roomCode: string, settings: Partial<GameSettings>): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  // Handle Kids Mode time limit
  if (settings.kidsMode !== undefined) {
      if (settings.kidsMode) {
          settings.timeLimit = 25;
      } else {
          settings.timeLimit = 15;
      }
  }

  // Handle Lightning Mode time limit
  if (settings.mode === 'lightning') {
      settings.timeLimit = 5;
  } else if (settings.mode === 'classic' || settings.mode === 'team') {
      // Reset to default if not kids mode (kids mode logic above handles its own default)
      // Actually, we should respect kids mode if enabled? No, lightning mode overrides.
      if (!settings.kidsMode && !room.settings.kidsMode) {
          settings.timeLimit = 15;
      }
  }

  room.settings = { ...room.settings, ...settings };
  
  // If switching to team mode or changing team count, reassign teams
  if (settings.mode === 'team' || (room.settings.mode === 'team' && settings.teamCount)) {
      assignTeams(room);
  } else if (settings.mode === 'classic') {
      // Clear team data
      room.players.forEach(p => p.teamId = undefined);
      room.teamScores = undefined;
  }
  
  return room;
}

function assignTeams(room: Room) {
    const teamIds: TeamId[] = ['red', 'blue', 'green', 'yellow'];
    const count = room.settings.teamCount || 2;
    const availableTeams = teamIds.slice(0, count);
    
    room.players.forEach((p, i) => {
        p.teamId = availableTeams[i % count];
    });
    
    // Initialize team scores
    room.teamScores = {} as Record<TeamId, number>;
    availableTeams.forEach(t => {
        room.teamScores![t] = 0;
    });
}

export function debugRooms(): void {
  console.log('Current rooms:', Array.from(rooms.keys()));
}

export function getRoom(code: string): Room | undefined {
  const room = rooms.get(code);
  console.log(`Getting room ${code}: ${room ? 'found' : 'NOT FOUND'}, Total rooms: ${rooms.size}`);
  return room;
}

export function addPlayer(roomCode: string, player: { id: string; name: string; avatar?: AvatarId }): Player | null {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'waiting') return null;

  const newPlayer: Player = {
    id: player.id,
    name: player.name,
    avatar: player.avatar || getRandomAvatar(),
    score: 0,
    roomCode,
    isConnected: true,
    streak: 0,
    maxStreak: 0,
    previousRank: room.players.length + 1,
    categoryCorrect: {},
    totalResponseTime: 0,
    totalCorrect: 0,
  };

  if (room.settings.mode === 'team') {
      const teamIds: TeamId[] = ['red', 'blue', 'green', 'yellow'];
      const count = room.settings.teamCount || 2;
      const availableTeams = teamIds.slice(0, count);
      
      // Calculate team counts
      const teamCounts = availableTeams.map(t => ({ 
          id: t, 
          count: room.players.filter(p => p.teamId === t).length 
      }));
      
      // Sort by count ascending to balance
      teamCounts.sort((a, b) => a.count - b.count);
      newPlayer.teamId = teamCounts[0].id;
  }

  room.players.push(newPlayer);
  return newPlayer;
}

export function removePlayer(roomCode: string, playerId: string): boolean {
  const room = rooms.get(roomCode);
  if (!room) return false;

  room.players = room.players.filter(p => p.id !== playerId);
  return true;
}

export function addSpectator(roomCode: string, spectator: { id: string; name: string }): Spectator | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const newSpectator: Spectator = {
    id: spectator.id,
    name: spectator.name,
    roomCode,
    isConnected: true,
  };

  room.spectators.push(newSpectator);
  return newSpectator;
}

export function removeSpectator(roomCode: string, spectatorId: string): boolean {
  const room = rooms.get(roomCode);
  if (!room) return false;

  room.spectators = room.spectators.filter(s => s.id !== spectatorId);
  return true;
}

export function startGame(roomCode: string): boolean {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'waiting' || room.players.length === 0) return false;

  room.status = 'playing';
  room.currentQuestionIndex = 0;
  return true;
}

export function submitAnswer(roomCode: string, answer: Answer): boolean {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'playing') return false;

  // Check if player already answered this question
  const existingAnswer = room.answers.find(
    a => a.playerId === answer.playerId && a.questionId === answer.questionId
  );
  if (existingAnswer) return false;

  room.answers.push(answer);
  return true;
}

export interface QuestionResultWithAchievements {
  results: { 
    playerId: string; 
    points: number; 
    correct: boolean; 
    streak: number; 
    powerUpEarned?: PowerUpType; 
    powerUpUsed?: PowerUpType;
    speedBonus?: number; // 0-0.30 (percentage)
    isFinaleRound?: boolean; // Double points indicator
  }[];
  achievements: EarnedAchievement[];
}

export function calculateQuestionResults(roomCode: string): QuestionResultWithAchievements {
  const room = rooms.get(roomCode);
  if (!room) return { results: [], achievements: [] };

  const currentQuestion = room.questions[room.currentQuestionIndex];
  if (!currentQuestion) return { results: [], achievements: [] };

  // Store previous ranks for comeback detection
  const previousRanks: Record<string, number> = {};
  const sortedByScore = [...room.players].sort((a, b) => b.score - a.score);
  sortedByScore.forEach((p, i) => {
    previousRanks[p.id] = i + 1;
  });

  const questionAnswers = room.answers
    .filter(a => a.questionId === currentQuestion.id)
    .sort((a, b) => a.timestamp - b.timestamp);

  const results: { 
    playerId: string; 
    points: number; 
    correct: boolean; 
    streak: number; 
    powerUpEarned?: PowerUpType; 
    powerUpUsed?: PowerUpType;
    speedBonus?: number;
    isFinaleRound?: boolean;
  }[] = [];
  const newAchievements: EarnedAchievement[] = [];
  let correctCount = 0;
  let firstCorrectPlayerId: string | null = null;

  for (const answer of questionAnswers) {
    let isCorrect = false;

    if (currentQuestion.type === 'estimation') {
       const val = Number(answer.answerValue);
       const correctVal = Number(currentQuestion.correct);
       const tolerance = currentQuestion.tolerance || 0;
       if (!isNaN(val) && !isNaN(correctVal)) {
           isCorrect = Math.abs(val - correctVal) <= tolerance;
       }
    } else if (currentQuestion.type === 'sorting') {
        try {
            const userOrder = typeof answer.answerValue === 'string' ? JSON.parse(answer.answerValue) : answer.answerValue;
            const correctOrder = currentQuestion.correct as string[];
            if (Array.isArray(userOrder) && Array.isArray(correctOrder)) {
                isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
            }
        } catch (e) {
            isCorrect = false;
        }
    } else {
       // Standard check
       isCorrect = answer.answerIndex === currentQuestion.correct;
    }

    let points = 0;
    let playerStreak = 0;
    let powerUpEarned: PowerUpType | undefined;
    let powerUpUsed: PowerUpType | undefined;
    let speedBonus = 0;
    let isFinaleRound = false;

    const player = room.players.find(p => p.id === answer.playerId);

    if (isCorrect) {
      // Track first correct for speed_demon
      if (correctCount === 0) {
        firstCorrectPlayerId = answer.playerId;
      }

      // Update streak
      if (player) {
        player.streak += 1;
        playerStreak = player.streak;
        if (player.streak > player.maxStreak) {
          player.maxStreak = player.streak;
        }

        // Update category correct count
        const cat = currentQuestion.category;
        player.categoryCorrect[cat] = (player.categoryCorrect[cat] || 0) + 1;

        // Update total correct & time
        player.totalCorrect = (player.totalCorrect || 0) + 1;
        if (room.questionStartTime) {
          const timeTaken = answer.timestamp - room.questionStartTime;
          if (timeTaken > 0 && timeTaken < 30000) {
            player.totalResponseTime = (player.totalResponseTime || 0) + timeTaken;
          }
        }
      }

      // Points decrease with position
      const positionMultiplier = Math.max(0.5, 1 - (correctCount * 0.1));
      points = Math.round(room.settings.basePoints * positionMultiplier);

      // FÁZIS 3: Gyorsasági bónusz - Gyorsabb válaszért extra pontok
      if (room.questionStartTime) {
        const timeTaken = answer.timestamp - room.questionStartTime;
        const timeLimit = (room.settings.timeLimit || 15) * 1000;
        const timeRatio = timeTaken / timeLimit;
        
        // Speed bonus: 0-30% based on speed
        // < 25% time: +30% bonus
        // < 50% time: +20% bonus
        // < 75% time: +10% bonus
        if (timeRatio < 0.25) speedBonus = 0.30;
        else if (timeRatio < 0.50) speedBonus = 0.20;
        else if (timeRatio < 0.75) speedBonus = 0.10;
      }

      // FÁZIS 3: Comeback mechanika - Utolsó kérdések dupla pontot érnek
      isFinaleRound = room.rounds ? room.currentRoundIndex === room.rounds.length - 1 : false;
      const comebackMultiplier = isFinaleRound ? 2 : 1;

      // Streak bonus: +10% per streak level (max 50%)
      const streakBonus = Math.min(0.5, (playerStreak - 1) * 0.1);
      
      // Apply all bonuses
      points = Math.round(points * (1 + streakBonus + speedBonus));
      
      // Apply comeback multiplier
      points = Math.round(points * comebackMultiplier);

      // Bonus multiplier for mixed category
      const category = categories.find(c => c.questions.some(q => q.id === currentQuestion.id));
      if (category?.isBonus) {
        points *= room.settings.bonusMultiplier;
      }

      // Lightning Mode Multiplier (2x)
      if (room.settings.mode === 'lightning') {
          points *= 2;
      }

      // Apply double_points power-up if active
      if (player?.activePowerUp === 'double_points') {
        points *= 2;
        powerUpUsed = 'double_points';
        player.activePowerUp = undefined;
      }

      correctCount++;

      // Update player score
      if (player) {
        player.score += points;
        
        // Update team score
        if (room.settings.mode === 'team' && player.teamId && room.teamScores) {
            room.teamScores[player.teamId] = (room.teamScores[player.teamId] || 0) + points;
        }
      }

      // Award power-up at streak 3 (if player doesn't have one)
      if (player && playerStreak === 3 && !player.powerUp) {
        player.powerUp = getRandomPowerUp();
        powerUpEarned = player.powerUp;
      }
    } else {
      // Reset streak on wrong answer
      if (player) {
        player.streak = 0;
        playerStreak = 0;
        // Clear active power-up on wrong answer
        if (player.activePowerUp === 'double_points') {
          powerUpUsed = 'double_points';
          player.activePowerUp = undefined;
        }
      }
    }

    results.push({ 
      playerId: answer.playerId, 
      points, 
      correct: isCorrect, 
      streak: playerStreak, 
      powerUpEarned, 
      powerUpUsed,
      speedBonus: isCorrect ? speedBonus : undefined,
      isFinaleRound: isCorrect && isFinaleRound ? true : undefined
    });
  }

  // Add zero points for players who didn't answer (also resets streak)
  for (const player of room.players) {
    if (!results.some(r => r.playerId === player.id)) {
      player.streak = 0;
      // Clear active double_points on no answer
      const powerUpUsed = player.activePowerUp === 'double_points' ? 'double_points' as PowerUpType : undefined;
      if (powerUpUsed) {
        player.activePowerUp = undefined;
      }
      results.push({ playerId: player.id, points: 0, correct: false, streak: 0, powerUpUsed });
    }
  }

  // Detect achievements
  const now = Date.now();

  // First Blood - first correct answer of the game
  if (firstCorrectPlayerId && !room.firstCorrectGiven) {
    const player = room.players.find(p => p.id === firstCorrectPlayerId);
    if (player) {
      newAchievements.push({
        type: 'first_blood',
        playerId: firstCorrectPlayerId,
        playerName: player.name,
        questionIndex: room.currentQuestionIndex,
        timestamp: now,
      });
      room.firstCorrectGiven = true;
    }
  }

  // Speed Demon - first correct answer on this question
  if (firstCorrectPlayerId) {
    const player = room.players.find(p => p.id === firstCorrectPlayerId);
    if (player) {
      // Only give if not already first_blood on same question
      const hasFirstBlood = newAchievements.some(
        a => a.type === 'first_blood' && a.playerId === firstCorrectPlayerId
      );
      if (!hasFirstBlood) {
        newAchievements.push({
          type: 'speed_demon',
          playerId: firstCorrectPlayerId,
          playerName: player.name,
          questionIndex: room.currentQuestionIndex,
          timestamp: now,
        });
      }
    }
  }

  // Hot Streak - 5+ correct in a row
  for (const player of room.players) {
    if (player.streak === 5) {
      newAchievements.push({
        type: 'hot_streak',
        playerId: player.id,
        playerName: player.name,
        questionIndex: room.currentQuestionIndex,
        timestamp: now,
      });
    }
  }

  // Perfect Round - 3/3 in a category
  for (const player of room.players) {
    const cat = currentQuestion.category;
    if (player.categoryCorrect[cat] === 3) {
      newAchievements.push({
        type: 'perfect_round',
        playerId: player.id,
        playerName: player.name,
        questionIndex: room.currentQuestionIndex,
        timestamp: now,
      });
    }
  }

  // Comeback King - jumped 3+ positions
  const newSortedByScore = [...room.players].sort((a, b) => b.score - a.score);
  newSortedByScore.forEach((player, index) => {
    const newRank = index + 1;
    const oldRank = previousRanks[player.id] || newRank;
    const rankJump = oldRank - newRank;

    if (rankJump >= 3) {
      newAchievements.push({
        type: 'comeback_king',
        playerId: player.id,
        playerName: player.name,
        questionIndex: room.currentQuestionIndex,
        timestamp: now,
      });
    }

    // Update previous rank for next question
    player.previousRank = newRank;
  });

  // Add achievements to room
  room.achievements.push(...newAchievements);

  return { results, achievements: newAchievements };
}

// Legacy wrapper for backwards compatibility
export function calculateQuestionResultsLegacy(roomCode: string): { playerId: string; points: number; correct: boolean; streak: number }[] {
  return calculateQuestionResults(roomCode).results;
}

export function nextQuestion(roomCode: string): boolean {
  const room = rooms.get(roomCode);
  if (!room) return false;

  room.currentQuestionIndex++;
  
  // Check if we ran out of questions
  if (room.currentQuestionIndex >= room.questions.length) {
    // Check if there are more rounds
    if (room.rounds && room.currentRoundIndex < room.rounds.length - 1) {
        const nextRoundIndex = room.currentRoundIndex + 1;
        const nextRound = room.rounds[nextRoundIndex];
        
        room.currentRoundIndex = nextRoundIndex;
        
        if (nextRound.type === 'category') {
            // Trigger voting phase
            startVoting(roomCode);
            return false; // Pausing question flow for voting
        } else {
            // Generate questions for fixed round
            const newQs = generateQuestionsForRound(nextRound);
            room.questions.push(...newQs);
            return true; // Continue to next question (which is now valid)
        }
    } else {
        // No more rounds
        room.status = 'finished';
        return false;
    }
  }
  return true;
}

export function getLeaderboard(roomCode: string): { playerId: string; playerName: string; score: number; rank: number }[] {
  const room = rooms.get(roomCode);
  if (!room) return [];

  return room.players
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      score: player.score,
      rank: index + 1,
    }));
}

export function updateRoomStatus(roomCode: string, status: Room['status']): boolean {
  const room = rooms.get(roomCode);
  if (!room) return false;
  room.status = status;
  return true;
}

export function deleteRoom(roomCode: string): boolean {
  return rooms.delete(roomCode);
}

// Voting functions
export function startVoting(roomCode: string): VotingState | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const options = getRandomCategories(3);
  const votingState: VotingState = {
    isActive: true,
    options,
    votes: {},
    endTime: Date.now() + 10000, // 10 seconds
  };

  room.votingState = votingState;
  room.status = 'voting';
  return votingState;
}

export function castVote(roomCode: string, playerId: string, category: CategoryType): boolean {
  const room = rooms.get(roomCode);
  if (!room || !room.votingState || !room.votingState.isActive) return false;

  // Validate category is in options
  if (!room.votingState.options.includes(category)) return false;

  // Only one vote per player
  if (room.votingState.votes[playerId]) return false;

  room.votingState.votes[playerId] = category;
  return true;
}

export function endVoting(roomCode: string): CategoryType | null {
  const room = rooms.get(roomCode);
  if (!room || !room.votingState) return null;

  // Count votes
  const voteCounts: Record<string, number> = {};
  for (const category of room.votingState.options) {
    voteCounts[category] = 0;
  }

  for (const category of Object.values(room.votingState.votes)) {
    voteCounts[category] = (voteCounts[category] || 0) + 1;
  }

  // Find winner (or random on tie)
  let maxVotes = 0;
  let winners: CategoryType[] = [];

  for (const [category, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winners = [category as CategoryType];
    } else if (count === maxVotes) {
      winners.push(category as CategoryType);
    }
  }

  const winner = winners[Math.floor(Math.random() * winners.length)];
  room.votingState.winner = winner;
  room.votingState.isActive = false;
  room.currentCategory = winner;
  
  // Generate questions for the new round
  if (room.rounds) {
      const currentRound = room.rounds[room.currentRoundIndex];
      const newQs = generateQuestionsForRound(currentRound, winner);
      room.questions.push(...newQs);
  }
  
  room.status = 'playing';

  return winner;
}

export function getVotingState(roomCode: string): VotingState | null {
  const room = rooms.get(roomCode);
  return room?.votingState || null;
}

// Pause functions
export function pauseGame(roomCode: string, remainingTime?: number): PauseState | null {
  const room = rooms.get(roomCode);
  if (!room || room.status === 'finished') return null;

  const pauseState: PauseState = {
    isPaused: true,
    pausedAt: Date.now(),
    remainingTime,
  };

  room.pauseState = pauseState;
  room.status = 'paused';
  return pauseState;
}

export function resumeGame(roomCode: string): boolean {
  const room = rooms.get(roomCode);
  if (!room || !room.pauseState) return false;

  room.pauseState.isPaused = false;
  room.status = 'playing';
  return true;
}

export function getPauseState(roomCode: string): PauseState | null {
  const room = rooms.get(roomCode);
  return room?.pauseState || null;
}

export function getAchievements(roomCode: string): EarnedAchievement[] {
  const room = rooms.get(roomCode);
  return room?.achievements || [];
}

// Power-up functions
const POWERUP_TYPES: PowerUpType[] = ['double_points', 'time_freeze', 'fifty_fifty'];

function getRandomPowerUp(): PowerUpType {
  return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
}

export function activatePowerUp(roomCode: string, playerId: string): { success: boolean; powerUp?: PowerUpType } {
  const room = rooms.get(roomCode);
  if (!room) return { success: false };

  const player = room.players.find(p => p.id === playerId);
  if (!player || !player.powerUp) return { success: false };

  player.activePowerUp = player.powerUp;
  player.powerUp = undefined;

  return { success: true, powerUp: player.activePowerUp };
}

export function getFiftyFiftyAnswers(roomCode: string): number[] {
  const room = rooms.get(roomCode);
  if (!room) return [];

  const currentQuestion = room.questions[room.currentQuestionIndex];
  if (!currentQuestion) return [];

  // Get indices of wrong answers and randomly select 2
  const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
  const shuffled = shuffleArray(wrongIndices);
  return shuffled.slice(0, 2);
}

export function getPlayerPowerUp(roomCode: string, playerId: string): PowerUpType | undefined {
  const room = rooms.get(roomCode);
  if (!room) return undefined;

  const player = room.players.find(p => p.id === playerId);
  return player?.powerUp;
}

export function setQuestionStartTime(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.questionStartTime = Date.now();
  }
}

export function getGameStats(roomCode: string): GameStats | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  // MVP
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const mvp = sortedPlayers[0];

  // Speedster calculation
  let speedster: GameStats['speedster'];
  // Find player with lowest average time (min 3 correct answers to qualify)
  const candidates = room.players.filter(p => (p.totalCorrect || 0) >= 3 && (p.totalResponseTime || 0) > 0);
  if (candidates.length > 0) {
    const fastest = candidates.sort((a, b) => {
      const avgA = (a.totalResponseTime || 0) / (a.totalCorrect || 1);
      const avgB = (b.totalResponseTime || 0) / (b.totalCorrect || 1);
      return avgA - avgB;
    })[0];
    
    if (fastest) {
        speedster = {
            playerId: fastest.id,
            playerName: fastest.name,
            avgTime: Math.round(((fastest.totalResponseTime || 0) / (fastest.totalCorrect || 1)))
        };
    }
  }

  // Brainiac (Best Accuracy)
  let brainiac: GameStats['brainiac'];
  const accCandidates = room.players.filter(p => (p.categoryCorrect && Object.values(p.categoryCorrect).reduce((a,b)=>a+b,0) >= 3));
  // Note: we use totalCorrect now
  
  let bestAcc = -1;
  room.players.forEach(p => {
      const answered = room.answers.filter(a => a.playerId === p.id).length;
      if (answered >= 5) { // Min 5 answers
          const correct = p.totalCorrect || 0;
          const acc = correct / answered;
          if (acc > bestAcc) {
              bestAcc = acc;
              brainiac = { playerId: p.id, playerName: p.name, accuracy: Math.round(acc * 100) };
          }
      }
  });

  // Longest Streak
  let longestStreak: GameStats['longestStreak'];
  let maxS = -1;
  room.players.forEach(p => {
      if (p.maxStreak > maxS && p.maxStreak >= 3) {
          maxS = p.maxStreak;
          longestStreak = { playerId: p.id, playerName: p.name, streak: maxS };
      }
  });

  // Category Stats
  const categoryStats: GameStats['categoryStats'] = {};
  // Initialize
  room.questions.forEach(q => {
    if (!categoryStats[q.category]) {
        categoryStats[q.category] = { 
            name: CATEGORY_META[q.category]?.name || q.category, 
            correct: 0, 
            total: 0 
        };
    }
  });
  
  // Populate
  room.answers.forEach(a => {
      const q = room.questions.find(q => q.id === a.questionId);
      if (q && categoryStats[q.category]) {
          categoryStats[q.category].total++;
          if (a.answerIndex === q.correct) {
              categoryStats[q.category].correct++;
          }
      }
  });

  let winningTeam: { teamId: TeamId; score: number } | undefined;
  if (room.settings.mode === 'team' && room.teamScores) {
    let bestTeam: TeamId | undefined;
    let bestScore = -1;
    Object.entries(room.teamScores).forEach(([t, s]) => {
        if (s > bestScore) {
            bestScore = s;
            bestTeam = t as TeamId;
        }
    });
    if (bestTeam) {
        winningTeam = { teamId: bestTeam, score: bestScore };
    }
  }

  return {
    mvp,
    speedster,
    brainiac,
    longestStreak,
    categoryStats,
    winningTeam,
  };
}
