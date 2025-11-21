'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { EarnedAchievement, ACHIEVEMENTS } from '@/types/game';
import { soundManager } from '@/lib/sounds';

interface AchievementToastProps {
  achievement: EarnedAchievement | null;
  onComplete?: () => void;
  duration?: number;
}

export default function AchievementToast({
  achievement,
  onComplete,
  duration = 4000
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Play a pleasant, short sound instead of full victory
      soundManager.play('streak');

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [achievement, duration, onComplete]);

  if (!achievement) return null;

  const achievementData = ACHIEVEMENTS[achievement.type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 p-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="text-4xl shrink-0">
                {achievementData.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-0.5">
                  Új Eredmény!
                </p>
                <h3 className="text-white font-bold text-lg leading-tight truncate">
                  {achievementData.name}
                </h3>
                <p className="text-white/60 text-xs truncate">
                  {achievementData.description}
                </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Queue component for multiple achievements
interface AchievementQueueProps {
  achievements: EarnedAchievement[];
  onAllComplete?: () => void;
}

export function AchievementQueue({ achievements, onAllComplete }: AchievementQueueProps) {
  const [queue, setQueue] = useState<EarnedAchievement[]>([]);
  const [current, setCurrent] = useState<EarnedAchievement | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (achievements.length > processedCount) {
      const newItems = achievements.slice(processedCount);
      setQueue(prev => [...prev, ...newItems]);
      setProcessedCount(achievements.length);
    } else if (achievements.length === 0 && processedCount > 0) {
      // Reset when parent clears
      setProcessedCount(0);
    }
  }, [achievements, processedCount]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue]);

  const handleComplete = () => {
    setCurrent(null);
    // Only notify completion if we've processed everything and queue is empty
    if (queue.length === 0 && achievements.length === processedCount) {
      onAllComplete?.();
    }
  };

  return (
    <AchievementToast
      achievement={current}
      onComplete={handleComplete}
      duration={3000}
    />
  );
}
