'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Background from '@/components/layout/Background';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const createRoom = async () => {
    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      const data = await res.json();

      if (data.code) {
        localStorage.setItem('hostId', data.hostId);
        router.push(`/host/${data.code}`);
      }
    } catch {
      setError('Hiba történt a szoba létrehozásakor');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = () => {
    if (joinCode.trim().length >= 4) {
      router.push(`/play/${joinCode.toUpperCase()}`);
    }
  };

  const spectateRoom = () => {
    if (joinCode.trim().length >= 4) {
      router.push(`/spectate/${joinCode.toUpperCase()}`);
    }
  };

  const viewHistory = () => {
    router.push('/history');
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      <Background />

      {/* Decorative Christmas elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-8 left-8 text-4xl animate-float hidden sm:block"
        style={{ animationDelay: '0s' }}
      >
        <span className="star">✦</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute top-16 right-12 text-2xl animate-float hidden sm:block"
        style={{ animationDelay: '1s' }}
      >
        <span className="star">✧</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center mb-12 relative z-10"
      >
        <div className="inline-block relative">
          {/* Decorative ornaments */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-8 text-3xl hidden sm:block"
          >
            <span className="text-red-400 drop-shadow-lg">🎄</span>
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-6 text-2xl hidden sm:block"
          >
            <span className="star">⭐</span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-bold text-gold-gradient drop-shadow-lg tracking-tight font-[family-name:var(--font-playfair)]">
            Családi Kvíz
          </h1>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-amber-200/80 text-lg sm:text-xl tracking-[0.3em] uppercase font-semibold mt-3"
        >
          Mester
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/40 text-sm mt-2 italic"
        >
          Karácsonyi Kiadás
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-4xl w-full relative z-10">
        {/* Join Section - Main Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-7 christmas-card p-8 flex flex-col justify-center relative overflow-hidden group"
        >
          {/* Gold accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"></div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 font-[family-name:var(--font-playfair)]">Csatlakozás</h2>
            <p className="text-white/50">Írd be a szoba kódját a játékhoz!</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="KÓD"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-6 py-4 christmas-input rounded-2xl text-center text-3xl font-mono tracking-widest uppercase"
            />

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={joinRoom}
                disabled={joinCode.length < 4}
                className="col-span-2 py-4 btn-warm font-bold text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                <span>Belépés</span>
                <span>🎁</span>
              </motion.button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-center text-sm mt-4 bg-red-500/10 py-2 rounded-lg animate-pulse">{error}</p>
          )}
        </motion.div>

        {/* Host & Extras Section */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Host Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 christmas-card p-6 flex flex-col justify-center items-center text-center cursor-pointer group hover:border-amber-500/40 transition-colors"
            onClick={!isCreating ? createRoom : undefined}
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform"
              animate={{
                boxShadow: ['0 0 20px rgba(212, 168, 83, 0.2)', '0 0 40px rgba(212, 168, 83, 0.4)', '0 0 20px rgba(212, 168, 83, 0.2)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🎅
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-1 font-[family-name:var(--font-playfair)]">Új Játék</h3>
            <p className="text-white/40 text-sm mb-4">Hozz létre egy új szobát</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isCreating}
              className="px-6 py-2 btn-pine font-semibold rounded-lg text-sm"
            >
              {isCreating ? 'Létrehozás...' : 'Indítás'}
            </motion.button>
          </motion.div>

          {/* Secondary Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="frost-glass p-4 rounded-3xl flex gap-3"
          >
            <button
              onClick={() => joinCode.length >= 4 && spectateRoom()}
              disabled={joinCode.length < 4}
              className="flex-1 py-3 px-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white/80 text-sm font-medium transition-all flex flex-col items-center gap-1 disabled:opacity-30 disabled:hover:bg-white/5"
            >
              <span className="text-xl">👁️</span>
              <span>Néző</span>
            </button>

            <button
              onClick={viewHistory}
              className="flex-1 py-3 px-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white/80 text-sm font-medium transition-all flex flex-col items-center gap-1"
            >
              <span className="text-xl">📜</span>
              <span>Előzmény</span>
            </button>
          </motion.div>
        </div>
      </div>

      <footer className="absolute bottom-4 text-white/20 text-xs text-center">
        © 2024 Családi Kvíz Mester • Boldog Karácsonyt!
      </footer>
    </main>
  );
}
