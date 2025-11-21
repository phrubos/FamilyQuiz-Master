'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Theme } from '@/types/game';

// Generate snowflakes with random properties
const generateSnowflakes = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 20,
    size: Math.random() * 0.5 + 0.3,
    opacity: Math.random() * 0.6 + 0.2,
  }));
};

// Generate twinkling stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 60,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 3,
    size: Math.random() * 2 + 1,
  }));
};

export default function Background({ theme = 'default' }: { theme?: Theme }) {
  const [snowflakes, setSnowflakes] = useState<ReturnType<typeof generateSnowflakes>>([]);
  const [stars, setStars] = useState<ReturnType<typeof generateStars>>([]);

  useEffect(() => {
    // Reduced count for better mobile performance
    setSnowflakes(generateSnowflakes(20));
    setStars(generateStars(15));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0c1524]">
      {/* Base gradient - deep winter night */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1524] via-[#142238] to-[#1a1a3e]" />

      {/* Aurora Borealis effect - simplified for performance */}
      <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl opacity-30" />

      {/* Warm glow from below */}
      <div className="absolute bottom-0 left-[20%] right-[20%] h-[30%] bg-gradient-to-t from-amber-500/10 via-orange-500/5 to-transparent blur-3xl opacity-20" />

      {/* Twinkling stars - reduced animation complexity */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.delay,
          }}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${Math.min(star.size, 2)}px`,
            height: `${Math.min(star.size, 2)}px`,
          }}
        />
      ))}

      {/* Snowfall - simplified animation */}
      {snowflakes.map((flake) => (
        <motion.div
          key={`snow-${flake.id}`}
          initial={{
            y: '-10vh',
            x: 0,
          }}
          animate={{
            y: '110vh',
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            ease: "linear",
            delay: flake.delay,
          }}
          className="absolute text-white pointer-events-none opacity-40"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}rem`,
          }}
        >
          ❄
        </motion.div>
      ))}

      {/* Gold accent orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[20%] right-[10%] w-32 h-32 rounded-full bg-amber-500/20 blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[30%] left-[5%] w-40 h-40 rounded-full bg-red-500/10 blur-3xl"
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />
    </div>
  );
}
