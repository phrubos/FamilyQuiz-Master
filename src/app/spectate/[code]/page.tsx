'use client';

import { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from '@/components/layout/Background';
import { pusherClient, getGameChannel } from '@/lib/pusher';
import { ANSWER_COLORS, CategoryType, getAvatarEmoji, GameSettings, Room, TEAMS, TeamId } from '@/types/game';
import Confetti from '@/components/Confetti';
import { LeaderboardStreakBadge } from '@/components/StreakIndicator';

interface Props {
  params: Promise<{ code: string }>;
}

interface Question {
  id: string;
  question: string;
  answers: string[];
  categoryName?: string;
  isBonus?: boolean;
}

interface Player {
  id: string;
  name: string;
  avatar?: any;
  score: number;
  streak?: number;
  teamId?: TeamId;
}

export default function SpectatePage({ params }: Props) {
  const { code } = use(params);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'waiting' | 'playing' | 'voting' | 'paused' | 'finished'>('waiting');
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(50);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const joinSpectator = async () => {
        try {
            const res = await fetch(`/api/rooms/${code}/spectate`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (res.ok) {
                setIsJoined(true);
                
                // Fetch initial state
                const roomRes = await fetch(`/api/rooms/${code}`);
                const roomData = await roomRes.json();
                
                setPlayers(roomData.players || []);
                setStatus(roomData.status);
                setSettings(roomData.settings);
                if (roomData.currentQuestion) {
                    setCurrentQuestion(roomData.currentQuestion);
                }
                setQuestionIndex(roomData.currentQuestionIndex || 0);
                setTotalQuestions(roomData.totalQuestions || 50);
                
            } else {
                setError(data.error || 'Hiba történt');
            }
        } catch {
            setError('Hálózati hiba');
        }
    };
    
    joinSpectator();
  }, [code]);

  // Timer effect
  useEffect(() => {
    if (status !== 'playing' || showResults || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, showResults, timeRemaining]);

  // Subscribe to events
  useEffect(() => {
    if (!isJoined) return;

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

    channel.bind('game-started', () => {
      setStatus('playing');
    });

    channel.bind('question-shown', (data: { question: Question; questionIndex: number; totalQuestions: number }) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setShowResults(false);
      setCorrectAnswer(null);
      setTimeRemaining(settings?.timeLimit || 15);
    });

    channel.bind('question-ended', (data: { correctAnswer: number; leaderboard: Player[] }) => {
      setCorrectAnswer(data.correctAnswer);
      setShowResults(true);
      setPlayers(data.leaderboard);
    });

    channel.bind('game-ended', (data: { leaderboard: Player[] }) => {
      setStatus('finished');
      setPlayers(data.leaderboard);
    });
    
    return () => {
      pusherClient.unsubscribe(getGameChannel(code));
    };
  }, [code, isJoined, settings?.timeLimit]);

  // Waiting screen
  // ... (Actually SpectatePage uses isJoined too)
  // Wait, SpectatePage has:
  // if (error) ...
  // if (!isJoined) ...
  // return ...
  // I should update all of them.

  if (error) {
      return (
        <main className="min-h-screen relative flex items-center justify-center p-4">
            <Background theme={settings?.theme} />
            <div className="text-white text-center relative z-10">
                <h1 className="text-2xl font-bold mb-2">Hiba</h1>
                <p>{error}</p>
            </div>
        </main>
      );
  }

  if (!isJoined) {
      return (
        <main className="min-h-screen relative flex items-center justify-center p-4">
            <Background theme={settings?.theme} />
            <div className="text-white text-center relative z-10">
                <p>Csatlakozás...</p>
            </div>
        </main>
      );
  }

  return (
    <main className="min-h-screen relative p-4 flex flex-col">
      <Background theme={settings?.theme} />
      <div className="text-center mb-4 relative z-10">
        <div className="bg-white/10 inline-block px-4 py-1 rounded-full text-sm text-white/60 mb-2">
            👁️ Néző Mód
        </div>
        {currentQuestion && (
            <div className="text-white text-xl font-bold mb-4">
                {currentQuestion.question}
            </div>
        )}
        
        {/* Timer Bar */}
        {status === 'playing' && !showResults && (
            <div className="w-full max-w-md mx-auto h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
                <motion.div 
                    className="h-full bg-white"
                    animate={{ width: `${(timeRemaining / (settings?.timeLimit || 15)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        )}
      </div>

      {/* Content based on state */}
      <div className="flex-1 max-w-4xl mx-auto w-full grid md:grid-cols-2 gap-6">
        {/* Question/Answers */}
        <div className="space-y-3">
            {currentQuestion?.answers.map((answer, i) => {
                const colors = ANSWER_COLORS[i as keyof typeof ANSWER_COLORS];
                const isCorrect = showResults && correctAnswer === i;
                
                return (
                    <div 
                        key={i}
                        className={`
                            p-4 rounded-xl text-white font-bold text-lg flex items-center
                            ${isCorrect ? 'ring-4 ring-green-400 bg-green-500' : 'bg-white/10'}
                            ${showResults && !isCorrect ? 'opacity-50' : ''}
                        `}
                    >
                        <span className="mr-3 opacity-60">{colors.text}</span>
                        {answer}
                    </div>
                );
            })}
            
            {status === 'waiting' && (
                <div className="text-center text-white/60 py-8">
                    Várakozás a játék indítására...
                </div>
            )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 rounded-2xl p-4 h-fit">
            <h3 className="text-white font-bold mb-3">Élő Eredmények</h3>
            <div className="space-y-2">
                {[...players].sort((a, b) => b.score - a.score).map((player, i) => (
                    <div 
                        key={player.id}
                        className={`flex justify-between items-center p-2 rounded-lg text-sm ${
                            player.teamId ? TEAMS[player.teamId].color + '/40 border border-' + TEAMS[player.teamId].color.replace('bg-', '') : 'bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2 text-white">
                            <span className="w-5 text-center text-white/40">{i + 1}.</span>
                            <span>{getAvatarEmoji(player.avatar)}</span>
                            <span className="font-medium">{player.name}</span>
                            {player.streak && player.streak >= 3 && (
                                <LeaderboardStreakBadge streak={player.streak} />
                            )}
                        </div>
                        <span className="text-white font-bold">{player.score}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </main>
  );
}
