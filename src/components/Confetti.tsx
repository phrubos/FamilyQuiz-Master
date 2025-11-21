'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
}

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
];

export default function Confetti({ isActive, duration = 3000, pieceCount = 100 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration, pieceCount]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: piece.rotation,
                scale: piece.scale,
              }}
              animate={{
                y: '110vh',
                rotate: piece.rotation + 720,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: piece.delay,
                ease: 'linear',
              }}
              className="absolute w-3 h-3"
              style={{
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Fireworks component for extra celebration
export function Fireworks({ isActive }: { isActive: boolean }) {
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (isActive) {
      const timeouts: NodeJS.Timeout[] = [];
      const createBurst = (index: number) => {
        // Create a unique ID using timestamp and index to avoid collisions
        const uniqueId = Date.now() + index;
        setBursts(prev => [...prev, {
          id: uniqueId,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 40,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }]);
      };

      // Create multiple bursts
      for (let i = 0; i < 5; i++) {
        const timeout = setTimeout(() => createBurst(i), i * 300);
        timeouts.push(timeout);
      }

      const cleanupTimer = setTimeout(() => setBursts([]), 3000);
      timeouts.push(cleanupTimer);

      return () => {
        timeouts.forEach(t => clearTimeout(t));
      };
    } else {
      setBursts([]);
    }
  }, [isActive]);

  return (
    <AnimatePresence>
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="fixed pointer-events-none z-50"
          style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                y: Math.sin((i * 30 * Math.PI) / 180) * 100,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: burst.color }}
            />
          ))}
        </div>
      ))}
    </AnimatePresence>
  );
}
