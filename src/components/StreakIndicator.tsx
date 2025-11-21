'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface StreakIndicatorProps {
  streak: number;
  showAnimation?: boolean;
}

export default function StreakIndicator({ streak, showAnimation = false }: StreakIndicatorProps) {
  if (streak < 2) return null;

  // Different fire emojis based on streak level
  const getStreakEmoji = (level: number) => {
    if (level >= 10) return '🌟';
    if (level >= 7) return '💥';
    if (level >= 5) return '🔥';
    if (level >= 3) return '⚡';
    return '✨';
  };

  const getStreakColor = (level: number) => {
    if (level >= 10) return 'from-yellow-400 to-orange-500';
    if (level >= 7) return 'from-orange-500 to-red-600';
    if (level >= 5) return 'from-red-500 to-orange-500';
    if (level >= 3) return 'from-yellow-500 to-yellow-600';
    return 'from-blue-400 to-blue-500';
  };

  const getStreakText = (level: number) => {
    if (level >= 10) return 'UNSTOPPABLE!';
    if (level >= 7) return 'ON FIRE!';
    if (level >= 5) return 'HOT STREAK!';
    if (level >= 3) return 'STREAK!';
    return '';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={showAnimation ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="flex items-center gap-2"
      >
        <motion.div
          animate={streak >= 5 ? {
            scale: [1, 1.2, 1],
            rotate: [0, -5, 5, 0],
          } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="text-2xl"
        >
          {getStreakEmoji(streak)}
        </motion.div>

        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getStreakColor(streak)} text-white font-bold text-sm`}>
          <span className="mr-1">{streak}x</span>
          {streak >= 3 && (
            <span className="text-xs opacity-90">{getStreakText(streak)}</span>
          )}
        </div>

        {/* Floating particles for high streaks */}
        {streak >= 5 && (
          <div className="absolute -z-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.5, 1, 0.5],
                  x: [0, (i - 1) * 10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.3,
                }}
                className="absolute text-sm"
              >
                ✨
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Leaderboard streak badge
export function LeaderboardStreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;

  const emoji = streak >= 5 ? '🔥' : streak >= 3 ? '⚡' : '✨';

  return (
    <motion.span
      animate={streak >= 3 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
      className="ml-1"
    >
      {emoji}
    </motion.span>
  );
}
