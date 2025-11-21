'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Background from '@/components/layout/Background';
import { GameHistory, getAvatarEmoji, TEAMS, TeamId } from '@/types/game';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('quiz_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (confirm('Biztosan törlöd az előzményeket?')) {
        localStorage.removeItem('quiz_history');
        setHistory([]);
    }
  };

  return (
    <main className="min-h-screen relative p-8">
      <Background />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => router.push('/')}
                className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20"
            >
                ⬅️ Vissza
            </button>
            <h1 className="text-3xl font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">Játék Előzmények</h1>
          </div>

          {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 btn-berry text-sm rounded-lg"
              >
                Törlés
              </button>
          )}
        </div>

        {history.length === 0 ? (
            <div className="text-center py-12 text-white/40">
                <p className="text-xl">Még nincsenek mentett játékok</p>
            </div>
        ) : (
            <div className="space-y-4">
                {history.map((game) => (
                    <motion.div 
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="christmas-card p-6"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-white/40 text-sm">
                                    {new Date(game.date).toLocaleDateString('hu-HU', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white font-bold text-lg">
                                        {game.gameMode === 'team' ? '👥 Csapat Játék' : '👤 Klasszikus Játék'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white/60 text-sm mb-1">Győztes</p>
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-2xl">{getAvatarEmoji(game.winner.avatar)}</span>
                                    <span className="text-gold-gradient font-bold text-xl">{game.winner.name}</span>
                                </div>
                                <p className="text-white font-mono">{game.winner.score} pont</p>
                            </div>
                        </div>

                        {/* Team Scores if applicable */}
                        {game.gameMode === 'team' && game.teamScores && (
                            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.entries(game.teamScores).map(([teamId, score]) => (
                                    <div key={teamId} className={`p-2 rounded-lg text-center ${TEAMS[teamId as TeamId].color} text-white`}>
                                        <div className="text-xs opacity-80">{TEAMS[teamId as TeamId].name}</div>
                                        <div className="font-bold">{score}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-white/40 text-sm mb-2">Játékosok ({game.players.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {game.players.map((p, i) => (
                                    <div key={i} className="bg-white/5 px-3 py-1 rounded-full text-sm text-white/80 flex items-center gap-2">
                                        <span>{getAvatarEmoji(p.avatar)}</span>
                                        <span>{p.name}</span>
                                        <span className="text-white/40 font-mono">{p.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}
