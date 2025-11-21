// Game Types

// Achievement types
export type AchievementType =
  | 'speed_demon'      // First correct answer in a question
  | 'comeback_king'    // Biggest rank jump (3+ positions)
  | 'perfect_round'    // 3/3 correct in a category
  | 'hot_streak'       // 5+ correct answers in a row
  | 'first_blood';     // First correct answer of the game

export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<AchievementType, Achievement> = {
  speed_demon: {
    id: 'speed_demon',
    name: 'Villámgyors',
    description: 'Első helyes válasz a kérdésre',
    icon: '⚡',
  },
  comeback_king: {
    id: 'comeback_king',
    name: 'Visszatérő Király',
    description: '3+ helyet ugrott a ranglistán',
    icon: '👑',
  },
  perfect_round: {
    id: 'perfect_round',
    name: 'Tökéletes Kör',
    description: '3/3 helyes válasz egy kategóriában',
    icon: '🎯',
  },
  hot_streak: {
    id: 'hot_streak',
    name: 'Lángoló Sorozat',
    description: '5+ helyes válasz egymás után',
    icon: '🔥',
  },
  first_blood: {
    id: 'first_blood',
    name: 'Első Vér',
    description: 'A játék első helyes válasza',
    icon: '🥇',
  },
};

export interface EarnedAchievement {
  type: AchievementType;
  playerId: string;
  playerName: string;
  questionIndex: number;
  timestamp: number;
}

// Avatar types
export const AVATARS = [
  // Animals
  { id: 'dog', emoji: '🐕', name: 'Kutya' },
  { id: 'cat', emoji: '🐱', name: 'Macska' },
  { id: 'fox', emoji: '🦊', name: 'Róka' },
  { id: 'bear', emoji: '🐻', name: 'Medve' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'lion', emoji: '🦁', name: 'Oroszlán' },
  { id: 'wolf', emoji: '🐺', name: 'Farkas' },
  { id: 'rabbit', emoji: '🐰', name: 'Nyúl' },
  // Sea creatures
  { id: 'whale', emoji: '🐋', name: 'Bálna' },
  { id: 'dolphin', emoji: '🐬', name: 'Delfin' },
  { id: 'octopus', emoji: '🐙', name: 'Polip' },
  // Birds
  { id: 'owl', emoji: '🦉', name: 'Bagoly' },
  { id: 'eagle', emoji: '🦅', name: 'Sas' },
  { id: 'penguin', emoji: '🐧', name: 'Pingvin' },
  // Food
  { id: 'pizza', emoji: '🍕', name: 'Pizza' },
  { id: 'burger', emoji: '🍔', name: 'Hamburger' },
  { id: 'icecream', emoji: '🍦', name: 'Fagyi' },
  { id: 'cake', emoji: '🎂', name: 'Torta' },
  // Objects
  { id: 'rocket', emoji: '🚀', name: 'Rakéta' },
  { id: 'star', emoji: '⭐', name: 'Csillag' },
  { id: 'rainbow', emoji: '🌈', name: 'Szivárvány' },
  { id: 'crown', emoji: '👑', name: 'Korona' },
  { id: 'robot', emoji: '🤖', name: 'Robot' },
  { id: 'alien', emoji: '👽', name: 'Űrlény' },
] as const;

export type AvatarId = typeof AVATARS[number]['id'];

export function getRandomAvatar(): AvatarId {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)].id;
}

export function getAvatarEmoji(id: AvatarId): string {
  return AVATARS.find(a => a.id === id)?.emoji || '👤';
}

// Power-up types
export type PowerUpType = 'double_points' | 'time_freeze' | 'fifty_fifty';

export interface PowerUp {
  id: PowerUpType;
  name: string;
  description: string;
  icon: string;
}

export const POWERUPS: Record<PowerUpType, PowerUp> = {
  double_points: {
    id: 'double_points',
    name: 'Dupla Pont',
    description: '2x pont a következő helyes válaszra',
    icon: '✨',
  },
  time_freeze: {
    id: 'time_freeze',
    name: 'Idő Fagyasztás',
    description: '+5 másodperc válaszolásra',
    icon: '❄️',
  },
  fifty_fifty: {
    id: 'fifty_fifty',
    name: '50/50',
    description: '2 rossz válasz eltávolítása',
    icon: '✂️',
  },
};

// Category types
export type CategoryType =
  | 'history'
  | 'geography'
  | 'science'
  | 'sport'
  | 'culture'
  | 'music'
  | 'film'
  | 'literature'
  | 'nature'
  | 'food'
  | 'technology'
  | 'politics'
  | 'economy'
  | 'language'
  | 'mixed';

export interface CategoryMeta {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
  pointMultiplier: number;
}

export const CATEGORY_META: Record<CategoryType, CategoryMeta> = {
  history: { id: 'history', name: 'Történelem', icon: '🏛️', color: '#8B4513', pointMultiplier: 1 },
  geography: { id: 'geography', name: 'Földrajz', icon: '🌍', color: '#228B22', pointMultiplier: 1 },
  science: { id: 'science', name: 'Tudomány', icon: '🔬', color: '#4169E1', pointMultiplier: 1 },
  sport: { id: 'sport', name: 'Sport', icon: '⚽', color: '#FF6347', pointMultiplier: 1 },
  culture: { id: 'culture', name: 'Kultúra & Művészet', icon: '🎨', color: '#9932CC', pointMultiplier: 1 },
  music: { id: 'music', name: 'Zene', icon: '🎵', color: '#FF69B4', pointMultiplier: 1 },
  film: { id: 'film', name: 'Film & TV', icon: '🎬', color: '#FFD700', pointMultiplier: 1 },
  literature: { id: 'literature', name: 'Irodalom', icon: '📚', color: '#8B0000', pointMultiplier: 1 },
  nature: { id: 'nature', name: 'Természet & Állatok', icon: '🦁', color: '#32CD32', pointMultiplier: 1 },
  food: { id: 'food', name: 'Étel & Ital', icon: '🍽️', color: '#FF8C00', pointMultiplier: 1 },
  technology: { id: 'technology', name: 'Technológia', icon: '💻', color: '#00CED1', pointMultiplier: 1 },
  politics: { id: 'politics', name: 'Politika', icon: '🏛️', color: '#708090', pointMultiplier: 1 },
  economy: { id: 'economy', name: 'Gazdaság', icon: '💰', color: '#DAA520', pointMultiplier: 1 },
  language: { id: 'language', name: 'Nyelvtan & Szólások', icon: '📝', color: '#6B8E23', pointMultiplier: 1 },
  mixed: { id: 'mixed', name: 'Vegyes', icon: '🎲', color: '#FF1493', pointMultiplier: 2 },
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'multiple_choice' | 'true_false' | 'image' | 'estimation' | 'sorting';

export interface Question {
  id: string;
  category: CategoryType;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  answers: string[]; // For sorting: items to sort in correct order (or shuffled? Usually correct order here and shuffled in UI)
  correct: number | string | string[]; // For sorting: array of correct answer strings in order? Or just rely on 'answers' being correct order and we shuffle them for display?
  // Let's say 'answers' in Question object is the CORRECT ORDER.
  // We need to shuffle them when presenting to user.
  imageUrl?: string; 
  tolerance?: number; 
  explanation?: string;
}

export interface Category {
  id: CategoryType;
  name: string;
  questions: Question[];
  isBonus?: boolean; // dupla pontok
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarId;
  score: number;
  roomCode: string;
  isConnected: boolean;
  streak: number; // Current correct answer streak
  maxStreak: number; // Best streak this game
  previousRank: number; // For comeback tracking
  categoryCorrect: Record<string, number>; // category -> correct count
  totalResponseTime?: number; // Total time in ms to answer correct questions
  totalCorrect?: number;
  powerUp?: PowerUpType; // Available power-up (one per game)
  activePowerUp?: PowerUpType; // Currently active power-up effect
  teamId?: TeamId;
}

export interface Spectator {
  id: string;
  name: string;
  roomCode: string;
  isConnected: boolean;
}

export type TeamId = 'red' | 'blue' | 'green' | 'yellow';

export const TEAMS: Record<TeamId, { name: string; color: string; emoji: string }> = {
  red: { name: 'Piros Csapat', color: 'bg-red-500', emoji: '🔴' },
  blue: { name: 'Kék Csapat', color: 'bg-blue-500', emoji: '🔵' },
  green: { name: 'Zöld Csapat', color: 'bg-green-500', emoji: '🟢' },
  yellow: { name: 'Sárga Csapat', color: 'bg-yellow-500', emoji: '🟡' },
};

export interface Answer {
  playerId: string;
  questionId: string;
  answerIndex?: number; // For multiple choice / true false / image
  answerValue?: string | number; // For estimation or open ended
  timestamp: number;
}

export interface VotingState {
  isActive: boolean;
  options: CategoryType[];
  votes: Record<string, CategoryType>; // playerId -> category
  endTime: number;
  winner?: CategoryType;
}

export interface PauseState {
  isPaused: boolean;
  pausedAt?: number;
  remainingTime?: number;
}

export type GameMode = 'classic' | 'team' | 'lightning' | 'elimination';

export type GameLength = 'short' | 'medium' | 'long';

export type Theme = 'default' | 'space' | 'jungle' | 'ocean' | 'candy';

export interface RoundConfig {
  id: string;
  name: string;
  type: 'mixed' | 'category' | 'lightning' | 'finale';
  questionCount: number;
  difficulty?: Difficulty;
  multiplier?: number;
  timeLimit?: number;
}

export interface GameSettings {
  timeLimit: number;
  showAnswers: boolean;
  basePoints: number;
  pointsPerQuestion: number;
  streakBonus: boolean;
  bonusMultiplier: number; // For mixed category or finale
  mode: GameMode;
  teamCount?: number; // 2-4
  kidsMode?: boolean;
  theme?: Theme;
  gameLength: GameLength;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  spectators: Spectator[];
  status: 'waiting' | 'playing' | 'voting' | 'paused' | 'finished';
  currentQuestionIndex: number;
  currentCategoryIndex: number;
  currentCategory?: CategoryType;
  questions: Question[];
  answers: Answer[];
  settings: GameSettings;
  teamScores?: Record<TeamId, number>;
  
  // Round state
  rounds: RoundConfig[];
  currentRoundIndex: number;

  votingState?: VotingState;
  pauseState?: PauseState;
  achievements: EarnedAchievement[];
  firstCorrectGiven: boolean; // Track if first_blood was given
  questionStartTime?: number;
  createdAt: number;
  eliminatedPlayers?: string[]; // For Elimination mode
}

export interface GameHistory {
  id: string;
  date: number;
  players: { name: string; score: number; avatar: AvatarId }[];
  winner: { name: string; score: number; avatar: AvatarId };
  teamScores?: Record<TeamId, number>;
  gameMode: GameMode;
}

export interface GameStats {
  mvp: Player;
  speedster?: { playerId: string; playerName: string; avgTime: number };
  brainiac?: { playerId: string; playerName: string; accuracy: number };
  longestStreak?: { playerId: string; playerName: string; streak: number };
  categoryStats: Record<string, { name: string; correct: number; total: number }>;
  winningTeam?: { teamId: TeamId; score: number };
}

export interface GameState {
  room: Room | null;
  currentQuestion: Question | null;
  timeRemaining: number;
  showResults: boolean;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  playerId: string;
  playerName: string;
  correct: boolean;
  points: number;
  answerTime: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

// Pusher Events
export type PusherEvent =
  | 'player-joined'
  | 'player-left'
  | 'game-started'
  | 'question-shown'
  | 'answer-received'
  | 'question-ended'
  | 'game-ended'
  | 'game-paused'
  | 'game-resumed'
  | 'voting-started'
  | 'vote-cast'
  | 'voting-ended'
  | 'achievement-earned';

export interface PusherMessage<T = unknown> {
  event: PusherEvent;
  data: T;
}

// Answer colors
export const ANSWER_COLORS = {
  0: { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'A' },
  1: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'B' },
  2: { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', text: 'C' },
  3: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'D' },
} as const;
