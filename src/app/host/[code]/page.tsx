'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import Background from '@/components/layout/Background';
import { pusherClient, getGameChannel } from '@/lib/pusher';
import { ANSWER_COLORS, CategoryType, AvatarId, getAvatarEmoji, GameStats, TEAMS, TeamId, GameSettings, Room, GameHistory, Question } from '@/types/game';
import { soundManager } from '@/lib/sounds';
import Confetti, { Fireworks } from '@/components/Confetti';
import { LeaderboardStreakBadge } from '@/components/StreakIndicator';

interface Player {
  id: string;
  name: string;
  avatar?: AvatarId;
  score: number;
  streak?: number;
  teamId?: TeamId;
}

interface ExtendedQuestion extends Question {
  categoryName?: string;
  isBonus?: boolean;
}

interface CategoryOption {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

interface VotingData {
  categories: CategoryOption[];
  endTime: number;
  votes: Record<string, number>;
}

interface RoundInfo {
    current: number;
    total: number;
    name: string;
    type: string;
}

interface Props {
  params: Promise<{ code: string }>;
}

const NEXT_QUESTION_DELAY = 3; // Optimized from 6 to match 4s backend delay

export default function HostPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<'waiting' | 'playing' | 'voting' | 'paused' | 'finished'>('waiting');
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<ExtendedQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(50);
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | string | null>(null);
  const [hostId, setHostId] = useState('');
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Voting state
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [votingTimeRemaining, setVotingTimeRemaining] = useState(0);
  const [votingWinner, setVotingWinner] = useState<{ name: string; icon: string; id: CategoryType } | null>(null);

  // Modal delay state
  const [showModal, setShowModal] = useState(false);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [transitionRoundInfo, setTransitionRoundInfo] = useState<RoundInfo | null>(null);

  // Sound and celebration state
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  
  // Countdown state
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  // Ref to prevent duplicate /next API calls
  const isCallingNextRef = useRef(false);

  // Get host ID
  useEffect(() => {
    const id = localStorage.getItem('hostId') || '';
    setHostId(id);
  }, []);

  // Fetch initial room data and generate QR code only after room is verified
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 500; // ms

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`);

        if (!res.ok) {
          if (res.status === 404) {
            // Room not found - maybe serverless cold start, retry
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Room not found, retrying (${retryCount}/${maxRetries})...`);
              setTimeout(fetchRoom, retryDelay * retryCount);
              return;
            }
            setRoomError('A szoba nem található. Kérlek hozz létre egy új játékot.');
            setIsLoadingRoom(false);
            return;
          }
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data = await res.json();

        if (data.error) {
          setRoomError(data.error);
          setIsLoadingRoom(false);
          return;
        }

        // Room exists - set data and generate QR code
        setPlayers(data.players || []);
        setStatus(data.status);
        if (data.currentQuestion) {
          setCurrentQuestion(data.currentQuestion);
        }
        setQuestionIndex(data.currentQuestionIndex || 0);
        setTotalQuestions(data.totalQuestions || 50);
        setSettings(data.settings || null);

        // Generate QR code only after room is confirmed to exist
        const url = `${window.location.origin}/play/${code}?autoJoin=true`;
        const qr = await QRCode.toDataURL(url, { width: 200, margin: 1 });
        setQrCode(qr);

        setRoomError(null);
        setIsLoadingRoom(false);

      } catch (error) {
        console.error('Failed to fetch room:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Fetch failed, retrying (${retryCount}/${maxRetries})...`);
          setTimeout(fetchRoom, retryDelay * retryCount);
          return;
        }
        setRoomError('Hiba történt a szoba betöltésekor. Kérlek próbáld újra.');
        setIsLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [code]);

  // Subscribe to Pusher events
  useEffect(() => {
    const channel = pusherClient.subscribe(getGameChannel(code));

    channel.bind('room-updated', (data: { room: Room }) => {
      setSettings(data.room.settings);
      setPlayers(data.room.players);
    });

    channel.bind('player-joined', (data: { player: Player }) => {
      setPlayers(prev => [...prev, data.player]);
    });

    channel.bind('player-left', (data: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });

    channel.bind('answer-received', (data: { answeredCount: number }) => {
      setAnsweredCount(data.answeredCount);
    });

    channel.bind('question-shown', (data: { question: ExtendedQuestion; questionIndex: number; totalQuestions: number; roundInfo?: RoundInfo; showDelay?: number }) => {
      const showQuestion = () => {
        // KRITIKUS: Állítsuk be a status-t 'playing'-re, hogy a játék képernyő megjelenjen
        setStatus('playing');

        // Tisztítsuk meg a voting state-et
        setVotingData(null);
        setVotingWinner(null);
        setVotingTimeRemaining(0);

        if (data.roundInfo) {
            // Check for round change
            setRoundInfo(prev => {
                if (prev && prev.current !== data.roundInfo!.current) {
                    setTransitionRoundInfo(data.roundInfo!);
                    setShowRoundTransition(true);
                    soundManager.play('whoosh'); // Or some fanfare
                    setTimeout(() => setShowRoundTransition(false), 3000);
                }
                return data.roundInfo!;
            });
        } else {
            setRoundInfo(null);
        }

        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        setTimeRemaining(settings?.timeLimit || 15);
        setAnsweredCount(0);
        setShowResults(false);
        setCorrectAnswer(null);
        setNextQuestionCountdown(0);
      };

      // Handle delay from server (for Vercel serverless compatibility)
      if (data.showDelay) {
        setTimeout(showQuestion, data.showDelay);
      } else {
        showQuestion();
      }
    });

    channel.bind('question-ended', (data: { correctAnswer: number | string; leaderboard: Player[] }) => {
      setCorrectAnswer(data.correctAnswer);
      setShowResults(true);
      setPlayers(data.leaderboard);
      setNextQuestionCountdown(NEXT_QUESTION_DELAY);
    });

    channel.bind('game-ended', (data: { leaderboard: Player[]; stats: GameStats }) => {
      setStatus('finished');
      setPlayers(data.leaderboard);
      setGameStats(data.stats);
      
      // Save history
      if (data.leaderboard.length > 0) {
          const winner = data.leaderboard[0];
          const historyItem: GameHistory = {
              id: code + Date.now(),
              date: Date.now(),
              players: data.leaderboard.map(p => ({ name: p.name, score: p.score, avatar: p.avatar || 'dog' })),
              winner: { name: winner.name, score: winner.score, avatar: winner.avatar || 'dog' },
              gameMode: settings?.mode || 'classic',
              teamScores: settings?.mode === 'team' ? data.stats.winningTeam ? { [data.stats.winningTeam.teamId]: data.stats.winningTeam.score } as any : undefined : undefined
          };
          
          const existingHistory = JSON.parse(localStorage.getItem('quiz_history') || '[]');
          localStorage.setItem('quiz_history', JSON.stringify([historyItem, ...existingHistory]));
      }

      // Victory celebration
      soundManager.play('victory');
      setShowConfetti(true);
      setShowFireworks(true);
      setTimeout(() => {
        setShowConfetti(false);
        setShowFireworks(false);
      }, 5000);
    });

    // Voting events
    channel.bind('voting-started', (data: { categories: CategoryOption[]; duration: number; endTime: number; showDelay?: number }) => {
      const showVoting = () => {
        setStatus('voting');
        setVotingData({
          categories: data.categories,
          endTime: data.endTime,
          votes: {}
        });
        setVotingTimeRemaining(Math.ceil(data.duration / 1000));
        setVotingWinner(null);
      };

      // Handle delay from server (for Vercel serverless compatibility)
      if (data.showDelay) {
        setTimeout(showVoting, data.showDelay);
      } else {
        showVoting();
      }
    });

    channel.bind('vote-cast', (data: { currentVotes: Record<string, number> }) => {
      setVotingData(prev => prev ? { ...prev, votes: data.currentVotes } : null);
    });

    channel.bind('voting-ended', (data: { winner: CategoryType; winnerName: string; winnerIcon: string; votes: Record<string, number> }) => {
      setVotingWinner({ name: data.winnerName, icon: data.winnerIcon, id: data.winner });
      setVotingData(prev => prev ? { ...prev, votes: data.votes } : null);
      soundManager.play('victory'); // Play victory sound for winner reveal
    });

    // Pause events
    channel.bind('game-paused', () => {
      setStatus('paused');
    });

    channel.bind('game-resumed', () => {
      setStatus('playing');
    });

    channel.bind('powerup-activated', (data: { playerId: string; powerUp: string }) => {
      if (data.powerUp === 'time_freeze') {
        setTimeRemaining(prev => prev + 5);
        soundManager.play('whoosh');
        // Optional: Show toast notification for host
      }
    });

    return () => {
      pusherClient.unsubscribe(getGameChannel(code));
    };
  }, [code]);

  // Answer timer with sound effects
  useEffect(() => {
    if (status !== 'playing' || !currentQuestion || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        // Play countdown sound for last 5 seconds
        if (prev <= 6 && prev > 1) {
          soundManager.play('countdown');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, currentQuestion, showResults]);

  // Auto-show results when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !showResults && status === 'playing' && hostId && !isCallingNextRef.current) {
      isCallingNextRef.current = true;
      console.log('Timer ended, calling /next API', { hostId, code });
      fetch(`/api/rooms/${code}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      })
        .then(res => res.json())
        .then(data => console.log('Next API response:', data))
        .catch(err => console.error('Next API error:', err));
    }
  }, [timeRemaining, showResults, status, code, hostId]);

  // Reset the ref when a new question is shown
  useEffect(() => {
    if (currentQuestion) {
      isCallingNextRef.current = false;
    }
  }, [currentQuestion]);

  // Automatikus következő kérdés - nincs szükség gombra
  // A backend automatikusan küldi a következő kérdést 4 másodperc után

  // Modal már nem kell - automatikus a következő kérdés

  const updateSettings = async (newSettings: Partial<GameSettings>) => {
    try {
      await fetch(`/api/rooms/${code}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId, settings: newSettings }),
      });
    } catch (error) {
      console.error('Failed to update settings', error);
    }
  };

  const startGame = useCallback(async () => {
    soundManager.play('whoosh');

    await fetch(`/api/rooms/${code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId }),
    });

    const res = await fetch(`/api/rooms/${code}`);
    const data = await res.json();

    if (data.currentQuestion) {
      setCurrentQuestion(data.currentQuestion);
    }
    setQuestionIndex(data.currentQuestionIndex || 0);
    setTotalQuestions(data.totalQuestions || 50);
    setTimeRemaining(settings?.timeLimit || 15);
    setAnsweredCount(0);
    setShowResults(false);
    setCorrectAnswer(null);
    
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
  }, [code, hostId, settings]);

  const toggleMute = useCallback(() => {
    const newMuted = soundManager.toggle();
    setIsMuted(newMuted);
  }, []);

  const togglePause = useCallback(async () => {
    if (status === 'playing') {
      await fetch(`/api/rooms/${code}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', remainingTime: timeRemaining }),
      });
    } else if (status === 'paused') {
      await fetch(`/api/rooms/${code}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
    }
  }, [status, code, timeRemaining]);

  // Winner reveal automatikusan megy, nincs szükség külön kezelőre

  // Voting timer
  useEffect(() => {
    if (status !== 'voting' || votingTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setVotingTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // End voting
          fetch(`/api/rooms/${code}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'end' }),
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, votingTimeRemaining, code]);

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Loading screen
  if (isLoadingRoom) {
    return (
      <main className="min-h-screen relative p-8 flex items-center justify-center">
        <Background theme={settings?.theme} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            ⌛
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Szoba betöltése...</h2>
          <p className="text-white/60">Kód: <span className="font-mono">{code}</span></p>
        </motion.div>
      </main>
    );
  }

  // Error screen
  if (roomError) {
    return (
      <main className="min-h-screen relative p-8 flex items-center justify-center">
        <Background theme={settings?.theme} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="christmas-card p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">Hiba történt</h2>
          <p className="text-red-300 mb-6">{roomError}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="px-6 py-3 btn-warm font-bold rounded-xl"
          >
            🏠 Vissza a főoldalra
          </motion.button>
        </motion.div>
      </main>
    );
  }

  // Waiting screen
  if (status === 'waiting') {
    return (
      <main className="min-h-screen relative p-8">
        <Background theme={settings?.theme} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">Családi Kvíz Mester</h1>
            <div className="flex gap-2">
              <button
                onClick={toggleMute}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                title={isMuted ? "Hang be" : "Hang ki"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                title="Beállítások"
              >
                ⚙️
              </button>
              <button
                onClick={goHome}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                title="Főoldal"
              >
                🏠
              </button>
            </div>
          </div>

          <p className="text-2xl text-amber-200/80 text-center mb-8">
            Szoba kód: <span className="font-mono font-bold text-white">{code}</span>
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="christmas-card p-8 text-center">
              <h2 className="text-xl text-white mb-4 font-[family-name:var(--font-playfair)]">Csatlakozz QR kóddal</h2>
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="mx-auto rounded-lg" />
              )}
              <p className="text-white/40 mt-4 text-sm">
                vagy írd be: <span className="font-mono text-amber-200">{code}</span>
              </p>
            </div>

            <div className="christmas-card p-8">
              <h2 className="text-xl text-white mb-4 font-[family-name:var(--font-playfair)]">Játékosok ({players.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((player) => (
                  <motion.div
                    key={`waiting-${player.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 rounded-lg p-3 ${
                        player.teamId ? TEAMS[player.teamId].color + '/40 border-2 border-' + TEAMS[player.teamId].color.replace('bg-', '') : 'bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{player.avatar ? getAvatarEmoji(player.avatar) : '👤'}</span>
                    <span className="text-white font-medium flex-1">{player.name}</span>
                    {player.teamId && (
                        <span className="text-xl">{TEAMS[player.teamId].emoji}</span>
                    )}
                  </motion.div>
                ))}
                {players.length === 0 && (
                  <p className="text-white/40 text-center py-4">Várakozás játékosokra...</p>
                )}
              </div>

              {/* FÁZIS 2: Minimum játékos ellenőrzés */}
              {players.length > 0 && (
                <div className="mt-6 space-y-2">
                  {players.length < 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-amber-500/20 border border-amber-400/50 rounded-lg p-3 text-center"
                    >
                      <p className="text-amber-200 text-sm">
                        ⚠️ Ajánlott minimum 2 játékos
                      </p>
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startGame}
                    className={`w-full py-4 font-bold text-xl rounded-xl ${
                      players.length >= 2 
                        ? 'btn-pine' 
                        : 'bg-amber-600/80 hover:bg-amber-600 text-white'
                    }`}
                  >
                    🎄 Játék Indítása {players.length >= 2 ? '' : '(1 játékos)'}
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Countdown Overlay */}
        <AnimatePresence>
            {startCountdown !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center"
                >
                    <motion.div
                        key={startCountdown}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-[12rem] font-bold text-white drop-shadow-2xl"
                        >
                            {startCountdown}
                        </motion.div>
                        <p className="text-4xl text-amber-200 mt-8 font-bold">Játék kezdődik!</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Round Transition Overlay */}
        <AnimatePresence>
            {showRoundTransition && transitionRoundInfo && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.5, y: -50 }}
                        className="text-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="text-8xl mb-6"
                        >
                            {transitionRoundInfo.type === 'lightning' ? '⚡' : 
                             transitionRoundInfo.type === 'finale' ? '🏆' : 
                             transitionRoundInfo.type === 'category' ? '🎲' : '🎯'}
                        </motion.div>
                        <h2 className="text-4xl font-bold text-white mb-2 font-[family-name:var(--font-playfair)]">
                            {transitionRoundInfo.current}. Forduló
                        </h2>
                        <h1 className="text-6xl font-bold text-gold-gradient mb-4 font-[family-name:var(--font-playfair)]">
                            {transitionRoundInfo.name}
                        </h1>
                        <p className="text-xl text-white/60">
                            {transitionRoundInfo.current} / {transitionRoundInfo.total}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && settings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="christmas-card p-8 max-w-md w-full"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-playfair)]">Játék Beállítások</h2>
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="text-white/60 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    
                    {/* FÁZIS 2: Egyszerűsített beállítások */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-white mb-3 font-semibold text-lg">🎮 Játékmód</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => updateSettings({ mode: 'classic' })}
                                    className={`p-4 rounded-xl font-bold transition-all ${
                                        settings.mode === 'classic' 
                                            ? 'bg-blue-500 text-white ring-2 ring-white shadow-lg' 
                                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">👤</div>
                                    <div className="text-sm">Klasszikus</div>
                                </button>
                                <button 
                                    onClick={() => updateSettings({ mode: 'team' })}
                                    className={`p-4 rounded-xl font-bold transition-all ${
                                        settings.mode === 'team' 
                                            ? 'bg-blue-500 text-white ring-2 ring-white shadow-lg' 
                                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">👥</div>
                                    <div className="text-sm">Csapat</div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-white mb-3 font-semibold text-lg">⏱️ Játékhossz</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['short', 'medium', 'long'].map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => updateSettings({ gameLength: l as any })}
                                        className={`p-3 rounded-lg font-bold transition-all ${
                                            settings.gameLength === l || (!settings.gameLength && l === 'medium')
                                                ? 'bg-green-500 text-white ring-2 ring-white shadow-lg'
                                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                    >
                                        <div className="text-xs">{l === 'short' ? '🏃 Rövid' : l === 'medium' ? '🚶 Normál' : '🐢 Hosszú'}</div>
                                        <div className="text-xs opacity-60 mt-1">{l === 'short' ? '~5 perc' : l === 'medium' ? '~10 perc' : '~20 perc'}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {settings.mode === 'lightning' && (
                            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                <p className="text-sm text-yellow-200">
                                    ⚡ 5 másodperc gondolkodási idő, de dupla pontok!
                                </p>
                            </div>
                        )}
                        
                        {settings.mode === 'team' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <label className="block text-white/80 mb-2 font-medium">
                                    Csapatok száma: <span className="text-blue-300 font-bold">{settings.teamCount}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="2" 
                                    max="4" 
                                    step="1"
                                    value={settings.teamCount || 2}
                                    onChange={(e) => updateSettings({ teamCount: parseInt(e.target.value) })}
                                    className="w-full accent-blue-500 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-white/40 mt-2">
                                    <span>2 Csapat</span>
                                    <span>3 Csapat</span>
                                    <span>4 Csapat</span>
                                </div>
                                
                                <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <p className="text-sm text-blue-200">
                                        ℹ️ A játékosok automatikusan lesznek elosztva a csapatok között a létszám kiegyensúlyozása érdekében.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        
                        <button
                             onClick={() => setShowSettings(false)}
                             className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl mt-4"
                        >
                            Kész
                        </button>
                    </div>
                </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  }

  // Finished screen
  if (status === 'finished') {
    return (
      <main className="min-h-screen relative p-8 flex items-center justify-center">
        <Background theme={settings?.theme} />
        <Confetti isActive={showConfetti} pieceCount={150} duration={5000} />
        <Fireworks isActive={showFireworks} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full christmas-card p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <motion.h1
              className="text-4xl font-bold text-gold-gradient font-[family-name:var(--font-playfair)]"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              🎄 Végeredmény 🎄
            </motion.h1>
            <button
              onClick={goHome}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
              title="Főoldal"
            >
              🏠
            </button>
          </div>
          <div className="space-y-4">
            {players.map((player, i) => (
              <motion.div
                key={`finished-${player.id}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 100 }}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  i === 0 ? 'bg-yellow-500/30 border-2 border-yellow-400' :
                  i === 1 ? 'bg-gray-400/30 border-2 border-gray-300' :
                  i === 2 ? 'bg-orange-600/30 border-2 border-orange-500' :
                  'bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <motion.span
                    className="text-3xl font-bold text-white"
                    animate={i === 0 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </motion.span>
                  <span className="text-2xl">{player.avatar ? getAvatarEmoji(player.avatar) : ''}</span>
                  <span className="text-xl text-white font-medium">{player.name}</span>
                </div>
                <span className="text-2xl font-bold text-white">{player.score} pont</span>
              </motion.div>
            ))}
          </div>

          {/* Game Stats Dashboard */}
          {gameStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="mt-8 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white text-center">Különdíjak & Statisztikák</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* Brainiac */}
                {gameStats.brainiac && (
                  <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">🧠</div>
                    <div className="font-bold text-blue-200">Agytröszt</div>
                    <div className="text-xl text-white font-bold">{gameStats.brainiac.playerName}</div>
                    <div className="text-sm text-white/60">{gameStats.brainiac.accuracy}% pontosság</div>
                  </div>
                )}
                {/* Speedster */}
                {gameStats.speedster && (
                  <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">⚡</div>
                    <div className="font-bold text-yellow-200">Villám</div>
                    <div className="text-xl text-white font-bold">{gameStats.speedster.playerName}</div>
                    <div className="text-sm text-white/60">{gameStats.speedster.avgTime} ms átlag</div>
                  </div>
                )}
                {/* Streak */}
                {gameStats.longestStreak && (
                  <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">🔥</div>
                    <div className="font-bold text-red-200">Megállíthatatlan</div>
                    <div className="text-xl text-white font-bold">{gameStats.longestStreak.playerName}</div>
                    <div className="text-sm text-white/60">{gameStats.longestStreak.streak} sorozat</div>
                  </div>
                )}
              </div>

              {/* Category Stats */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-bold mb-3">Kategória Statisztikák</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(gameStats.categoryStats)
                    .filter(s => s.total > 0)
                    .sort((a, b) => (b.correct / b.total) - (a.correct / a.total))
                    .slice(0, 6)
                    .map((stat, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3 flex flex-col">
                         <span className="text-white/80 text-sm">{stat.name}</span>
                         <span className="text-green-400 font-bold text-lg">
                           {Math.round((stat.correct / stat.total) * 100)}%
                         </span>
                         <span className="text-white/40 text-xs">{stat.correct}/{stat.total} helyes</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    );
  }

  // Voting screen
  if (status === 'voting' && votingData) {
    return (
      <main className="min-h-screen relative p-8">
        <Background theme={settings?.theme} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">
                {votingWinner ? 'Győztes Kategória!' : 'Válassz kategóriát!'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={goHome}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                title="Főoldal"
              >
                🏠
              </button>
            </div>
          </div>

          {votingWinner ? (
              <div className="flex flex-col items-center justify-center py-12">
                  {/* Cool Winner Reveal Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      duration: 0.8 
                    }}
                    className="relative"
                  >
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full blur-3xl"
                      style={{ backgroundColor: votingWinner.id === 'history' ? '#ef4444' : 
                               votingWinner.id === 'science' ? '#3b82f6' :
                               votingWinner.id === 'geography' ? '#10b981' :
                               votingWinner.id === 'sport' ? '#f59e0b' :
                               votingWinner.id === 'film' ? '#ec4899' :
                               votingWinner.id === 'culture' ? '#8b5cf6' : '#6366f1' }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                    
                    {/* Winner card */}
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="relative bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 rounded-3xl p-12 text-center shadow-2xl border-4 border-white"
                    >
                      {/* Sparkles */}
                      <motion.div
                        className="absolute -top-4 -left-4 text-4xl"
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        ✨
                      </motion.div>
                      <motion.div
                        className="absolute -top-4 -right-4 text-4xl"
                        animate={{ 
                          rotate: [360, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      >
                        ⭐
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-4 -left-4 text-4xl"
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      >
                        🌟
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-4 -right-4 text-4xl"
                        animate={{ 
                          rotate: [360, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                      >
                        💫
                      </motion.div>
                      
                      {/* Trophy */}
                      <motion.div
                        className="text-9xl mb-4"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      >
                        🏆
                      </motion.div>
                      
                      {/* Winner text */}
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-2xl font-bold text-gray-800 mb-2"
                      >
                        GYŐZTES KATEGÓRIA
                      </motion.h2>
                      
                      {/* Category icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                        className="text-8xl my-4"
                      >
                        {votingWinner.icon}
                      </motion.div>
                      
                      {/* Category name */}
                      <motion.h1
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9, type: 'spring' }}
                        className="text-5xl font-bold text-gray-900 mb-4"
                      >
                        {votingWinner.name}
                      </motion.h1>
                      
                      {/* Vote count */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-xl text-gray-700 font-semibold"
                      >
                        {votingData.votes[votingWinner.id] || 0} szavazat
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Confetti effect */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-2xl"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -100, 100],
                          x: [0, Math.random() * 100 - 50],
                          rotate: [0, 360],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      >
                        {['🎉', '🎊', '✨', '⭐', '🌟'][Math.floor(Math.random() * 5)]}
                      </motion.div>
                    ))}
                  </motion.div>
              </div>
          ) : (
            <>
                {/* Timer */}
                <div className="text-center mb-8">
                    <motion.div
                    key={votingTimeRemaining}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-6xl font-bold ${
                        votingTimeRemaining <= 3 ? 'text-red-400' : 'text-white'
                    }`}
                    >
                    {votingTimeRemaining}
                    </motion.div>
                    <div className="w-full max-w-md mx-auto h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <motion.div
                        className="h-full bg-yellow-400"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(votingTimeRemaining / 10) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                    </div>
                </div>

                {/* Category options */}
                <div className="grid grid-cols-3 gap-6">
                    {votingData.categories.map((category, i) => {
                    const voteCount = votingData.votes[category.id] || 0;
                    
                    return (
                        <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-2xl text-center bg-white/10"
                        style={{ borderColor: category.color }}
                        >
                        <div className="text-5xl mb-3">{category.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                        <div className="text-3xl font-bold text-white">{voteCount}</div>
                        <p className="text-white/60 text-sm">szavazat</p>
                        </motion.div>
                    );
                    })}
                </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // Paused screen
  if (status === 'paused') {
    return (
      <main className="min-h-screen relative p-8 flex items-center justify-center">
        <Background theme={settings?.theme} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-8xl mb-6"
          >
            ⏸️
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-6">Szünet</h2>
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePause}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-xl"
            >
              ▶️ Folytatás
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goHome}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-xl"
            >
              🏠 Főoldal
            </motion.button>
          </div>
        </motion.div>
      </main>
    );
  }

  // Playing screen
  return (
    <main className="min-h-screen relative p-6">
      <Background theme={settings?.theme} />
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white flex items-center gap-4">
            <button
              onClick={togglePause}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
              title="Szünet"
            >
              ⏸️
            </button>
            <button
              onClick={goHome}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
              title="Főoldal"
            >
              🏠
            </button>
            <div className="flex flex-col">
                <span className="text-lg font-bold">
                    {currentQuestion?.categoryName}
                    {currentQuestion?.isBonus && ' ⭐ 2x'}
                </span>
                {roundInfo && (
                    <span className="text-sm opacity-60">
                        {roundInfo.current}. Forduló: {roundInfo.name}
                    </span>
                )}
            </div>
          </div>
          <div className="text-white text-lg text-right">
            <div>Kérdés {questionIndex + 1} / {totalQuestions}</div>
            {roundInfo && (
                <div className="text-sm opacity-60">
                    {roundInfo.current} / {roundInfo.total} forduló
                </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Timer */}
            {!showResults && (
              <div className="flex flex-col items-center">
                <div
                  className={`text-6xl font-bold ${
                    timeRemaining <= 5 ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {timeRemaining}
                </div>
                {/* Timer progress bar - smooth animation */}
                <div className="w-full max-w-md h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    key={`progress-${currentQuestion?.id}`}
                    className="h-full bg-white"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: settings?.timeLimit || 15, ease: 'linear' }}
                  />
                </div>
              </div>
            )}

            {/* Automatikus következő kérdés - nincs modal */}

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="christmas-card p-8"
              >
                {currentQuestion?.imageUrl && (
                    <div className="mb-6 flex justify-center">
                        <img 
                            src={currentQuestion.imageUrl} 
                            alt="Question" 
                            className="max-h-64 rounded-lg shadow-lg border border-white/20"
                        />
                    </div>
                )}
                <h2 className="text-3xl font-bold text-white text-center">
                  {currentQuestion?.question}
                </h2>
                {currentQuestion?.type === 'estimation' && (
                    <div className="mt-4 text-center">
                        <p className="text-white/60 mb-2">Becslés</p>
                        {showResults && (
                            <div className="text-4xl font-bold text-green-400">
                                Helyes válasz: {correctAnswer}
                            </div>
                        )}
                    </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Automatikus következő kérdés - nincs szükség gombra */}

            {/* Answers */}
            {currentQuestion?.type !== 'estimation' && currentQuestion && (
                <div className="grid grid-cols-2 gap-4">
                {(currentQuestion.type === 'true_false' 
                    ? currentQuestion.answers.slice(0, 2) 
                    : currentQuestion.answers
                ).map((answer, i) => {
                    const colors = ANSWER_COLORS[i as keyof typeof ANSWER_COLORS];
                    const isCorrect = showResults && correctAnswer === i;
                    const isWrong = showResults && correctAnswer !== i;
                    
                    // Igaz/Hamis kérdéseknél custom label
                    let displayLabel: string = colors.text;
                    let displayAnswer = answer;
                    if (currentQuestion.type === 'true_false') {
                        displayLabel = i === 0 ? '✓' : '✗';
                        displayAnswer = i === 0 ? 'IGAZ' : 'HAMIS';
                    }

                    return (
                    <motion.div
                        key={`answer-${currentQuestion.id}-${i}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`${colors.bg} ${
                        isCorrect ? 'ring-4 ring-white animate-pulse' : ''
                        } ${
                        isWrong ? 'opacity-40' : ''
                        } rounded-xl p-6 text-white`}
                    >
                        <span className="font-bold text-2xl mr-3">{displayLabel}</span>
                        <span className="text-xl">{displayAnswer}</span>
                    </motion.div>
                    );
                })}
                </div>
            )}
          </div>

          {/* Leaderboard & Teams */}
          <div className="space-y-4">
            {/* Team Scores (if Team Mode) */}
            {settings?.mode === 'team' && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <h3 className="text-white font-bold mb-3 text-center">Csapatok Állása</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {['red', 'blue', 'green', 'yellow'].slice(0, settings.teamCount || 2).map(teamId => {
                            const teamPlayers = players.filter(p => p.teamId === teamId);
                            const teamScore = teamPlayers.reduce((sum, p) => sum + p.score, 0);
                            const team = TEAMS[teamId as TeamId];
                            return (
                                <div key={teamId} className={`${team.color} p-3 rounded-xl text-white shadow-lg flex justify-between items-center`}>
                                    <span className="font-bold">{team.emoji} {team.name}</span>
                                    <span className="text-xl font-bold">{teamScore}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Leaderboard */}
            <div className="christmas-card p-4">
              <h3 className="text-white font-bold mb-4 text-center font-[family-name:var(--font-playfair)]">
                Eredmények ({answeredCount}/{players.length})
              </h3>
              <div className="space-y-2">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, i) => (
                    <motion.div
                      key={`leaderboard-${player.id}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex justify-between items-center rounded-lg p-2 text-sm ${
                          player.teamId ? TEAMS[player.teamId].color + '/40 border border-' + TEAMS[player.teamId].color.replace('bg-', '') : 'bg-white/10'
                      }`}
                    >
                      <span className="text-white truncate flex items-center gap-1">
                        <span>{player.avatar ? getAvatarEmoji(player.avatar) : ''}</span>
                        {i + 1}. {player.name}
                        {player.streak && player.streak >= 2 && (
                          <LeaderboardStreakBadge streak={player.streak} />
                        )}
                      </span>
                      <span className="text-white font-bold">{player.score}</span>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
