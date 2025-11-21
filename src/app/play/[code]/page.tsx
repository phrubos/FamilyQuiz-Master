'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Background from '@/components/layout/Background';
import { pusherClient, getGameChannel } from '@/lib/pusher';
import { ANSWER_COLORS, CategoryType, AVATARS, AvatarId, getAvatarEmoji, getRandomAvatar, PowerUpType, POWERUPS, TEAMS, TeamId, Room, GameSettings, QuestionType, Question } from '@/types/game';
import { soundManager } from '@/lib/sounds';
import Confetti from '@/components/Confetti';
import StreakIndicator from '@/components/StreakIndicator';
import { AchievementQueue } from '@/components/AchievementToast';
import { EarnedAchievement } from '@/types/game';

interface Props {
  params: Promise<{ code: string }>;
}

interface CategoryOption {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

interface RoundInfo {
    current: number;
    total: number;
    name: string;
    type: string;
}

interface ExtendedQuestion extends Question {
  categoryName?: string;
  isBonus?: boolean;
}

export default function PlayPage({ params }: Props) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const autoJoinAttempted = useRef(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>(() => getRandomAvatar());
  const [playerId, setPlayerId] = useState('');
  const [teamId, setTeamId] = useState<TeamId | undefined>();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'waiting' | 'playing' | 'voting' | 'paused' | 'finished'>('waiting');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [finalRank, setFinalRank] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [answerValue, setAnswerValue] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<ExtendedQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Voting state
  const [votingCategories, setVotingCategories] = useState<CategoryOption[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCategory, setVotedCategory] = useState<string | null>(null);
  const [votingWinner, setVotingWinner] = useState<{ name: string; icon: string; id: CategoryType } | null>(null);

  // Streak and celebration state
  const [streak, setStreak] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Achievement state
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([]);

  // Power-up state
  const [powerUp, setPowerUp] = useState<PowerUpType | undefined>();
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | undefined>();
  const [eliminatedAnswers, setEliminatedAnswers] = useState<number[]>([]);
  
  // FÁZIS 3: Bonus indicators
  const [lastSpeedBonus, setLastSpeedBonus] = useState<number>(0);
  const [isFinaleRound, setIsFinaleRound] = useState<boolean>(false);
  
  // FÁZIS 3: Personal statistics
  const [personalStats, setPersonalStats] = useState<{
    totalCorrect: number;
    totalAnswered: number;
    avgResponseTime?: number;
    bestCategory?: { name: string; correct: number };
  } | null>(null);

  // Round tracking (csak követés, nincs UI megjelenítés)
  const [currentRound, setCurrentRound] = useState<number>(0);
  
  // Sorting state
  const [sortingItems, setSortingItems] = useState<string[]>([]);
  
  // Countdown state
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  
  // FÁZIS 4: Connection state
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Load saved player data from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    const savedAvatar = localStorage.getItem('playerAvatar') as AvatarId | null;

    if (savedName) {
      setName(savedName);
    }
    if (savedAvatar && AVATARS[savedAvatar]) {
      setAvatar(savedAvatar);
    }
  }, []);

  // Auto-join if URL has autoJoin parameter and we have saved data
  useEffect(() => {
    if (autoJoinAttempted.current) return;

    const shouldAutoJoin = searchParams.get('autoJoin') === 'true';
    const savedName = localStorage.getItem('playerName');

    if (shouldAutoJoin && savedName && savedName.trim().length >= 2) {
      autoJoinAttempted.current = true;
      // Small delay to ensure state is loaded
      setTimeout(() => {
        joinRoom();
      }, 100);
    }
  }, [searchParams]);

  const joinRoom = async () => {
    const trimmedName = name.trim();
    
    // FÁZIS 2: Név validáció
    if (!trimmedName) {
      setError('Add meg a neved!');
      soundManager.play('wrong');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('A név legalább 2 karakter legyen!');
      soundManager.play('wrong');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('A név maximum 20 karakter lehet!');
      soundManager.play('wrong');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      console.log('Joining room:', code, 'with name:', trimmedName, 'avatar:', avatar);
      
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, avatar }),
      });

      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        // FÁZIS 4: Better error messages
        let errorMsg = 'Hiba történt a csatlakozás során';
        if (res.status === 404) {
          errorMsg = 'A szoba nem található';
        } else if (res.status === 400) {
          errorMsg = data.error || 'Érvénytelen adatok';
        } else if (data.error) {
          errorMsg = data.error;
        }
        console.error('Join failed:', errorMsg, data);
        setError(errorMsg);
        soundManager.play('wrong');
        return;
      }

      if (!data.player || !data.player.id) {
        console.error('Invalid response structure:', data);
        setError('Szerver hiba. Próbáld újra!');
        soundManager.play('wrong');
        return;
      }

      console.log('Join successful, player ID:', data.player.id);
      setPlayerId(data.player.id);
      setIsJoined(true);
      soundManager.play('correct');

      // Save player data for future quick joins
      localStorage.setItem('playerName', trimmedName);
      localStorage.setItem('playerAvatar', avatar);
    } catch (err) {
      // FÁZIS 4: Better network error handling
      console.error('Join room error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        type: err instanceof Error ? err.constructor.name : typeof err
      });
      
      let errorMsg = 'Hálózati hiba. Ellenőrizd az internetkapcsolatot!';
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMsg = 'Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot!';
      }
      
      setError(errorMsg);
      soundManager.play('wrong');
    } finally {
      setIsJoining(false);
    }
  };

  // Timer effect - KRITIKUS: timeRemaining NE legyen a dependency array-ben!
  useEffect(() => {
    if (status !== 'playing' || hasAnswered) return;
    
    const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, hasAnswered]);

  // Subscribe to Pusher events
  useEffect(() => {
    if (!isJoined) return;

    const channel = pusherClient.subscribe(getGameChannel(code));
    console.log('Subscribed to channel:', getGameChannel(code));
    
    // FÁZIS 4: Monitor connection status
    const checkConnection = () => {
      const state = pusherClient.getConnectionState();
      if (state === 'connected') {
        setConnectionStatus('connected');
      } else if (state === 'connecting' || state === 'unavailable') {
        setConnectionStatus('connecting');
      } else {
        setConnectionStatus('disconnected');
      }
    };
    
    // Check connection every 2 seconds
    const connectionInterval = setInterval(checkConnection, 2000);
    checkConnection(); // Initial check

    channel.bind('room-updated', (data: { room: Room }) => {
      setSettings(data.room.settings);
      const me = data.room.players.find(p => p.id === playerId);
      if (me) {
        setTeamId(me.teamId);
      }
    });

    channel.bind('game-started', () => {
      // Start countdown
      setStartCountdown(3);
      soundManager.play('tick');
      
      const countdownInterval = setInterval(() => {
        setStartCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            setStatus('playing');
            soundManager.play('whoosh');
            return null;
          }
          soundManager.play('tick');
          return prev - 1;
        });
      }, 1000);
      
      setHasAnswered(false);
      setSelectedAnswer(null);
    });

    channel.bind('question-shown', (data: { 
      question: ExtendedQuestion; 
      questionIndex: number; 
      totalQuestions: number; 
      roundInfo?: RoundInfo;
      serverTime?: number;
      timeLimit?: number;
    }) => {
      // Round transition csak a host képernyőn jelenjen meg, ne a telefonon
      // setTransitionRoundInfo és setShowRoundTransition ELTÁVOLÍTVA
      if (data.roundInfo) {
          setCurrentRound(data.roundInfo.current);
      }

      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setAnswerValue('');
      setShowCorrect(false);
      setCorrectAnswer(null);
      setEliminatedAnswers([]);
      setActivePowerUp(undefined);
      
      // FÁZIS 4: Better timer sync using server timestamp
      const timeLimit = data.timeLimit || settings?.timeLimit || 15;
      if (data.serverTime) {
        const now = Date.now();
        const latency = now - data.serverTime;
        const adjustedTime = Math.max(0, timeLimit - Math.floor(latency / 1000));
        setTimeRemaining(adjustedTime);
      } else {
        setTimeRemaining(timeLimit);
      }
      
      setQuestionType(data.question.type);
      
      if (data.question.type === 'sorting') {
          // Shuffle items for initial state
          const items = [...data.question.answers].sort(() => Math.random() - 0.5);
          setSortingItems(items);
      }
    });

    channel.bind('question-ended', (data: {
      correctAnswer: number;
      results: { 
        playerId: string; 
        points: number; 
        correct: boolean; 
        streak: number;
        powerUpEarned?: PowerUpType;
        powerUpUsed?: PowerUpType;
        speedBonus?: number;
        isFinaleRound?: boolean;
      }[];
      leaderboard: { playerId: string; score: number }[];
    }) => {
      setCorrectAnswer(data.correctAnswer);
      setShowCorrect(true);

      // Find player's result
      const myResult = data.results.find(r => r.playerId === playerId);
      if (myResult) {
        setLastPoints(myResult.points);

        // Update streak
        setStreak(myResult.streak);
        
        // FÁZIS 3: Update bonus indicators
        setLastSpeedBonus(myResult.speedBonus || 0);
        setIsFinaleRound(myResult.isFinaleRound || false);

        // Update power-up state
        if (myResult.powerUpEarned) {
          setPowerUp(myResult.powerUpEarned);
          // Play power-up earned sound?
        }
        if (myResult.powerUpUsed) {
          setPowerUp(undefined);
          setActivePowerUp(undefined);
        }

        // Play sound based on result
        if (myResult.correct) {
          soundManager.play('correct');
          if (myResult.streak >= 3) {
            soundManager.play('streak');
            setShowStreakAnimation(true);
            setTimeout(() => setShowStreakAnimation(false), 1000);
          }
        } else {
          soundManager.play('wrong');
        }
      }

      // Update score
      const myScore = data.leaderboard.find(p => p.playerId === playerId);
      if (myScore) {
        setScore(myScore.score);
      }
    });

    channel.bind('game-ended', (data: { 
      leaderboard: { playerId: string; score: number }[];
      stats?: {
        mvp: { id: string; name: string; score: number };
        speedster?: { playerId: string; playerName: string; avgTime: number };
        brainiac?: { playerId: string; playerName: string; accuracy: number };
        longestStreak?: { playerId: string; playerName: string; streak: number };
        categoryStats: Record<string, { name: string; correct: number; total: number }>;
      };
    }) => {
      setStatus('finished');
      const rank = data.leaderboard.findIndex(p => p.playerId === playerId) + 1;
      setFinalRank(rank);
      const myScore = data.leaderboard.find(p => p.playerId === playerId);
      if (myScore) {
        setScore(myScore.score);
      }
      
      // FÁZIS 3: Calculate personal statistics
      if (data.stats) {
        const categoryEntries = Object.entries(data.stats.categoryStats);
        let bestCat: { name: string; correct: number } | undefined;
        let maxCorrect = 0;
        
        categoryEntries.forEach(([_, cat]) => {
          if (cat.correct > maxCorrect) {
            maxCorrect = cat.correct;
            bestCat = { name: cat.name, correct: cat.correct };
          }
        });
        
        const totalAnswered = categoryEntries.reduce((sum, [_, cat]) => sum + cat.total, 0);
        const totalCorrect = categoryEntries.reduce((sum, [_, cat]) => sum + cat.correct, 0);
        
        setPersonalStats({
          totalCorrect,
          totalAnswered,
          avgResponseTime: data.stats.speedster?.playerId === playerId ? data.stats.speedster.avgTime : undefined,
          bestCategory: bestCat,
        });
      }
      // Victory celebration
      soundManager.play('victory');
      if (rank <= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    });

    // Voting events
    channel.bind('voting-started', (data: { categories: CategoryOption[] }) => {
      setStatus('voting');
      setVotingCategories(data.categories);
      setHasVoted(false);
      setVotedCategory(null);
    });

    channel.bind('voting-ended', (data: { winner: CategoryType; winnerName: string; winnerIcon: string }) => {
      // Show winner for 3 seconds
      setVotingWinner({ name: data.winnerName, icon: data.winnerIcon, id: data.winner });
      soundManager.play('whoosh');
      
      setTimeout(() => {
        setStatus('playing');
        setVotingCategories([]);
        setHasVoted(false);
        setVotedCategory(null);
        setVotingWinner(null);
      }, 3000);
    });

    // Pause events
    channel.bind('game-paused', () => {
      setStatus('paused');
    });

    channel.bind('game-resumed', () => {
      setStatus('playing');
    });

    // Achievement events - only show for this player
    channel.bind('achievement-earned', (data: EarnedAchievement) => {
      if (data.playerId === playerId) {
        setAchievements(prev => [...prev, data]);
      }
    });

    return () => {
      clearInterval(connectionInterval);
      pusherClient.unsubscribe(getGameChannel(code));
    };
  }, [code, isJoined, playerId, settings?.timeLimit]); // added settings?.timeLimit to deps

  const handleActivatePowerUp = async () => {
    if (!powerUp || activePowerUp || hasAnswered) return;

    // Optimistic update
    const currentPowerUp = powerUp;
    setActivePowerUp(currentPowerUp);
    setPowerUp(undefined);
    soundManager.play('click');

    try {
      const res = await fetch(`/api/rooms/${code}/powerup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', playerId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.powerUp === 'fifty_fifty' && data.eliminatedAnswers) {
           setEliminatedAnswers(data.eliminatedAnswers);
           soundManager.play('click'); // Cut sound?
        }
      } else {
        // Revert on failure
        setPowerUp(currentPowerUp);
        setActivePowerUp(undefined);
      }
    } catch {
      // Revert
      setPowerUp(currentPowerUp);
      setActivePowerUp(undefined);
    }
  };

  const submitAnswer = async (answerIndex?: number, value?: string) => {
    if (hasAnswered) return;

    soundManager.play('click');
    setHasAnswered(true);
    if (answerIndex !== undefined) setSelectedAnswer(answerIndex);
    if (value !== undefined) setAnswerValue(value);

    try {
      await fetch(`/api/rooms/${code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, answerIndex, answerValue: value }),
      });
    } catch {
      // Silent fail - answer already recorded locally
    }
  };

  const submitVote = async (categoryId: CategoryType) => {
    if (hasVoted) return;

    soundManager.play('click');
    setHasVoted(true);
    setVotedCategory(categoryId);

    try {
      await fetch(`/api/rooms/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cast', playerId, category: categoryId }),
      });
    } catch {
      // Silent fail
    }
  };

  // Join screen
  if (!isJoined) {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4">
        <Background theme={settings?.theme} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gold-gradient mb-2 font-[family-name:var(--font-playfair)]">Csatlakozás</h1>
            <p className="text-amber-200/80">Szoba: <span className="font-mono font-bold text-white">{code}</span></p>
          </div>

          <div className="christmas-card p-6 space-y-4">
            {/* Avatar selection - FÁZIS 2: Nagyobb gombok, jobb layout */}
            <div>
              <p className="text-white/80 text-base font-medium text-center mb-3">Válassz avatárt</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((av) => (
                  <motion.button
                    key={av.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setAvatar(av.id);
                      soundManager.play('click');
                    }}
                    className={`text-4xl p-4 rounded-xl transition-all ${
                      avatar === av.id
                        ? 'bg-amber-500/60 ring-4 ring-amber-300 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {av.emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Name input - FÁZIS 2: Validáció */}
            <div>
              <input
                type="text"
                placeholder="A neved (min. 2 karakter)"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow letters, numbers, spaces, and common Hungarian characters
                  if (/^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9\s]*$/.test(value)) {
                    setName(value);
                    if (error) setError('');
                  }
                }}
                maxLength={20}
                className={`w-full px-4 py-4 christmas-input rounded-xl text-xl text-center ${
                  error ? 'ring-2 ring-red-400' : ''
                }`}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
              {name.length > 0 && name.length < 2 && (
                <p className="text-amber-300 text-xs text-center mt-1">Még {2 - name.length} karakter</p>
              )}
            </div>

            {/* FÁZIS 2: Javított csatlakozási gomb */}
            <motion.button
              whileHover={!isJoining ? { scale: 1.02 } : {}}
              whileTap={!isJoining ? { scale: 0.98 } : {}}
              onClick={joinRoom}
              disabled={isJoining || !name.trim() || name.trim().length < 2}
              className="w-full py-4 btn-warm font-bold text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⌛
                  </motion.span>
                  Csatlakozás...
                </span>
              ) : (
                '🎄 Belépés'
              )}
            </motion.button>

            {/* FÁZIS 2: Javított hibaüzenet */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-center"
                >
                  <p className="text-red-300 text-sm font-medium">⚠️ {error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    );
  }

  // Countdown overlay
  if (startCountdown !== null) {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4">
        <Background theme={settings?.theme} />
        <motion.div
          key={startCountdown}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: 0 }}
            className="text-9xl font-bold text-white drop-shadow-2xl"
          >
            {startCountdown}
          </motion.div>
          <p className="text-2xl text-amber-200 mt-4 font-bold">Játék kezdődik!</p>
        </motion.div>
      </main>
    );
  }

  // Waiting screen
  if (status === 'waiting') {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4">
        <Background theme={settings?.theme} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-4"
          >
            ⏳
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-playfair)]">Várakozás...</h2>
          <p className="text-amber-200/80">A játék hamarosan kezdődik</p>
          <p className="text-white/40 text-sm mt-4">{name}</p>
          
          {/* FÁZIS 4: Connection status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            {connectionStatus === 'connected' && (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-green-400 text-xs">Kapcsolódva</p>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-yellow-400 text-xs">Kapcsolódás...</p>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <p className="text-red-400 text-xs">Kapcsolat megszakadt</p>
              </>
            )}
          </motion.div>
        </motion.div>
      </main>
    );
  }

  // Finished screen - FÁZIS 2: Fejlesztett eredmény képernyő
  if (status === 'finished') {
    const getRankMessage = () => {
      if (finalRank === 1) return '🎉 Gratulálunk! Te vagy a győztes!';
      if (finalRank === 2) return '🌟 Nagyszerű! Második lettél!';
      if (finalRank === 3) return '⭐ Szép munka! Harmadik helyezés!';
      if (finalRank <= 5) return '👏 Remek játék! Top 5!';
      return '🎮 Köszönjük a játékot!';
    };
    
    const getAccuracy = () => {
      if (!personalStats) return 0;
      return personalStats.totalAnswered > 0 
        ? Math.round((personalStats.totalCorrect / personalStats.totalAnswered) * 100)
        : 0;
    };

    return (
      <main className="min-h-screen relative flex items-center justify-center p-4">
        <Background theme={settings?.theme} />
        <Confetti isActive={showConfetti} pieceCount={finalRank <= 3 ? 150 : 50} duration={5000} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="christmas-card p-8 text-center space-y-6">
            <motion.div
              initial={{ rotate: 0, scale: 0 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="text-8xl"
            >
              {finalRank === 1 ? '🏆' : finalRank === 2 ? '🥈' : finalRank === 3 ? '🥉' : '🎮'}
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-white mb-2 font-[family-name:var(--font-playfair)]">
                {finalRank}. hely
              </h2>
              <p className="text-amber-200 text-lg">{getRankMessage()}</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 rounded-xl p-6 space-y-3"
            >
              <div>
                <p className="text-white/60 text-sm">Összpontszám</p>
                <p className="text-5xl font-bold text-gold-gradient">{score}</p>
              </div>
              
              {/* FÁZIS 3: Personal statistics */}
              {personalStats && (
                <div className="pt-3 border-t border-white/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-white/60 text-sm">Pontosság</p>
                    <p className="text-lg font-bold text-green-400">{getAccuracy()}%</p>
                  </div>
                  
                  {personalStats.bestCategory && (
                    <div className="flex justify-between items-center">
                      <p className="text-white/60 text-sm">Legjobb kategória</p>
                      <p className="text-sm font-medium text-amber-300">{personalStats.bestCategory.name}</p>
                    </div>
                  )}
                  
                  {personalStats.avgResponseTime && (
                    <div className="flex justify-between items-center">
                      <p className="text-white/60 text-sm">⚡ Átlag válaszidő</p>
                      <p className="text-sm font-medium text-blue-300">{(personalStats.avgResponseTime / 1000).toFixed(1)}s</p>
                    </div>
                  )}
                </div>
              )}
              
              {streak > 0 && (
                <div className="pt-3 border-t border-white/20">
                  <p className="text-white/60 text-sm">Leghosszabb sorozat</p>
                  <p className="text-2xl font-bold text-amber-400">🔥 {streak} válasz</p>
                </div>
              )}
            </motion.div>

            <motion.p
              className="text-white/60 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {name}
            </motion.p>
          </div>
        </motion.div>
      </main>
    );
  }

  // Voting screen
  if (status === 'voting' || votingWinner) {
    return (
      <main className="min-h-screen relative p-4 flex flex-col">
        <Background theme={settings?.theme} />
        
        {/* Voting Winner Display */}
        {votingWinner ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 360, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="text-8xl mb-6"
              >
                {votingWinner.icon}
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Győztes kategória!</h2>
              <p className="text-4xl font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">
                {votingWinner.name}
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/60 text-sm mt-4"
              >
                Következő kérdések ebből a kategóriából...
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-4 relative z-10">
              <p className="text-white/60 text-sm">{name}</p>
              <p className="text-gold-gradient text-xl font-bold font-[family-name:var(--font-playfair)]">Válassz kategóriát!</p>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-3">
          {votingCategories.map((category, i) => {
            const isSelected = votedCategory === category.id;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={!hasVoted ? { scale: 0.95 } : undefined}
                onClick={() => submitVote(category.id)}
                disabled={hasVoted}
                className={`
                  rounded-2xl p-6 text-white font-bold text-xl
                  transition-all duration-200
                  flex items-center justify-center gap-3
                  ${isSelected ? 'ring-4 ring-white' : ''}
                  ${hasVoted && !isSelected ? 'opacity-40' : ''}
                `}
                style={{ backgroundColor: category.color }}
              >
                <span className="text-3xl">{category.icon}</span>
                <span>{category.name}</span>
                {isSelected && ' ✓'}
              </motion.button>
            );
          })}
        </div>

            {hasVoted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <p className="text-white/60">Szavazat elküldve!</p>
              </motion.div>
            )}
          </>
        )}
      </main>
    );
  }

  // Paused screen
  if (status === 'paused') {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4">
        <Background theme={settings?.theme} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-4"
          >
            ⏸️
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Szünet</h2>
          <p className="text-blue-200">A játék hamarosan folytatódik</p>
          <p className="text-white/40 text-sm mt-4">{name}</p>
        </motion.div>
      </main>
    );
  }

  // Playing screen - answer buttons
  return (
    <main className="min-h-screen relative p-4 flex flex-col">
      <Background theme={settings?.theme} />
      {/* Achievement notifications */}
      <AchievementQueue
        achievements={achievements}
        onAllComplete={() => setAchievements([])}
      />

      {/* Round Transition ELTÁVOLÍTVA - csak host képernyőn legyen */}

      {/* Score header */}
      <div className={`text-center mb-4 p-2 rounded-xl transition-colors ${
        teamId ? TEAMS[teamId].color + '/20 border-2 border-' + TEAMS[teamId].color.replace('bg-', '') : ''
      }`}>
        {teamId && (
            <div className={`text-sm font-bold mb-1 text-${TEAMS[teamId].color.replace('bg-', '')}`}>
                {TEAMS[teamId].emoji} {TEAMS[teamId].name}
            </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">{getAvatarEmoji(avatar)}</span>
          <p className="text-white/60 text-sm">{name}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <p className="text-white text-2xl font-bold">{score} pont</p>
          {streak >= 2 && (
            <StreakIndicator streak={streak} showAnimation={showStreakAnimation} />
          )}
        </div>
        
        {/* Kérdés info - kategória és szám */}
        {currentQuestion && status === 'playing' && (
          <div className="mt-2 space-y-1">
            {currentQuestion.categoryName && (
              <p className="text-amber-200 text-xs flex items-center justify-center gap-1">
                <span>📚</span>
                <span>{currentQuestion.categoryName}</span>
              </p>
            )}
            <p className="text-white/60 text-xs">
              Kérdés {questionIndex + 1} / {totalQuestions}
            </p>
          </div>
        )}
        
        {/* Timer Display - KRITIKUS JAVÍTÁS: Minden módban látszik */}
        {status === 'playing' && !showCorrect && currentQuestion && (
          <div className="mt-3">
            <motion.div 
              key={timeRemaining}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`text-center text-5xl font-bold mb-2 ${
                timeRemaining <= 3 ? 'text-red-400 animate-pulse' : 
                timeRemaining <= 5 ? 'text-yellow-400' : 
                'text-white'
              }`}
            >
              {timeRemaining}
            </motion.div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
                animate={{ width: `${(timeRemaining / (settings?.timeLimit || 15)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        {showCorrect && lastPoints > 0 && (
          <div className="flex flex-col items-center gap-1">
            <motion.p
              initial={{ opacity: 0, y: -10, scale: 1.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="text-green-400 text-lg font-bold"
            >
              +{lastPoints}
            </motion.p>
            {/* FÁZIS 3: Speed bonus indicator */}
            {lastSpeedBonus > 0 && (
              <motion.p
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-amber-300 text-xs font-medium flex items-center gap-1"
              >
                <span>⚡</span>
                <span>Gyorsasági bónusz +{Math.round(lastSpeedBonus * 100)}%</span>
              </motion.p>
            )}
            {/* FÁZIS 3: Finale round indicator */}
            {isFinaleRound && (
              <motion.p
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-purple-300 text-xs font-medium flex items-center gap-1"
              >
                <span>🔥</span>
                <span>Finálé - Dupla pontok!</span>
              </motion.p>
            )}
          </div>
        )}
      </div>

      {/* Kérdés szövege ELTÁVOLÍTVA - csak válaszok kellenek telefonon */}
      {/* Kategória és kérdésszám megtartva a score headerben */}

      {/* Power Up Button - Hide in Kids Mode? Or keep it? Let's keep it but maybe simplified. */}
      {(powerUp || activePowerUp) && !settings?.kidsMode && (
        <div className="mb-4 flex justify-center">
          {/* ... existing power up button ... */}
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleActivatePowerUp}
            disabled={!powerUp || hasAnswered}
            className={`
              px-6 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2
              ${activePowerUp 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 ring-4 ring-yellow-200 animate-pulse' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'}
              ${(!powerUp && !activePowerUp) || hasAnswered ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-2xl">
              {activePowerUp 
                ? POWERUPS[activePowerUp].icon 
                : powerUp 
                  ? POWERUPS[powerUp].icon 
                  : ''}
            </span>
            <span>
              {activePowerUp 
                ? `${POWERUPS[activePowerUp].name} Aktív!` 
                : powerUp 
                  ? POWERUPS[powerUp].name 
                  : ''}
            </span>
          </motion.button>
        </div>
      )}

      {/* Answer buttons */}
      <div className={`flex-1 ${questionType === 'estimation' || questionType === 'sorting' ? 'flex items-center justify-center' : `grid grid-cols-1 gap-${settings?.kidsMode ? '4' : '3'}`}`}>
        {questionType === 'sorting' ? (
            <div className="w-full max-w-md space-y-4">
                <p className="text-white/60 text-center text-sm mb-2">Húzd a megfelelő sorrendbe!</p>
                <Reorder.Group axis="y" values={sortingItems} onReorder={setSortingItems} className="space-y-2">
                    {sortingItems.map((item) => (
                        <Reorder.Item key={item} value={item}>
                            <motion.div 
                                className={`p-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold flex items-center gap-3 touch-none cursor-grab active:cursor-grabbing ${hasAnswered ? 'opacity-60' : ''}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-xl opacity-50">☰</span>
                                {item}
                            </motion.div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => submitAnswer(undefined, JSON.stringify(sortingItems))}
                    disabled={hasAnswered}
                    className={`w-full py-4 rounded-xl font-bold text-xl text-white shadow-lg transition-colors mt-4
                        ${hasAnswered ? 'bg-gray-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}
                    `}
                >
                    {hasAnswered ? 'Beküldve' : 'Küldés'}
                </motion.button>
            </div>
        ) : questionType === 'estimation' ? (
            <div className="w-full max-w-md space-y-4">
                <input 
                    type="number" 
                    value={answerValue} 
                    onChange={(e) => setAnswerValue(e.target.value)} 
                    placeholder="Írd be a tippet..."
                    className="w-full p-4 rounded-xl bg-white/10 border-2 border-white/20 text-white text-2xl text-center focus:outline-none focus:border-white placeholder-white/30"
                    disabled={hasAnswered}
                />
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => submitAnswer(undefined, answerValue)}
                    disabled={hasAnswered || !answerValue}
                    className={`w-full py-4 rounded-xl font-bold text-xl text-white shadow-lg transition-colors
                        ${hasAnswered ? 'bg-gray-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}
                    `}
                >
                    {hasAnswered ? 'Beküldve' : 'Küldés'}
                </motion.button>
            </div>
        ) : (
            <AnimatePresence>
            {(questionType === 'true_false' ? [0, 1] : [0, 1, 2, 3]).map((i) => {
                const colors = ANSWER_COLORS[i as keyof typeof ANSWER_COLORS];
                const isSelected = selectedAnswer === i;
                const isCorrect = showCorrect && correctAnswer === i;
                const isWrong = showCorrect && selectedAnswer === i && correctAnswer !== i;
                const isEliminated = eliminatedAnswers.includes(i);
                
                let label: string = colors.text;
                if (questionType === 'true_false') {
                    label = i === 0 ? 'IGAZ' : 'HAMIS';
                }

                return (
                <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileTap={!hasAnswered && !isEliminated ? { scale: 0.95 } : undefined}
                    onClick={() => submitAnswer(i)}
                    disabled={hasAnswered || isEliminated}
                    className={`
                    ${colors.bg} ${!hasAnswered && !isEliminated ? colors.hover : ''}
                    ${isSelected ? 'ring-4 ring-white' : ''}
                    ${isCorrect ? 'ring-4 ring-green-300 animate-pulse' : ''}
                    ${isWrong ? 'opacity-40' : ''}
                    ${hasAnswered && !isSelected && !isCorrect ? 'opacity-60' : ''}
                    ${isEliminated ? 'opacity-20 cursor-not-allowed grayscale' : ''}
                    rounded-2xl ${settings?.kidsMode ? 'p-8 text-4xl' : 'p-6 text-3xl'} text-white font-bold
                    transition-all duration-200
                    flex items-center justify-center
                    `}
                >
                    {label}
                    {isCorrect && ' ✓'}
                    {isWrong && (settings?.kidsMode ? ' 🤔' : ' ✗')}
                </motion.button>
                );
            })}
            </AnimatePresence>
        )}
      </div>

      {/* Status message */}
      {hasAnswered && !showCorrect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <p className="text-white/60">
              {settings?.kidsMode ? 'Szuper! Várjuk a többieket...' : 'Válasz elküldve!'}
          </p>
        </motion.div>
      )}
    </main>
  );
}
