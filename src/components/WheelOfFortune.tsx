'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CategoryType } from '@/types/game';

interface WheelOption {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

interface WheelProps {
  options: WheelOption[];
  winner?: CategoryType;
  onSpinComplete?: () => void;
  isSpinning: boolean;
}

export default function WheelOfFortune({ options, winner, onSpinComplete, isSpinning }: WheelProps) {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isSpinning && winner) {
      const spinWheel = async () => {
        // Find winner index
        const winnerIndex = options.findIndex(o => o.id === winner);
        if (winnerIndex === -1) return;

        // Calculate rotation
        // Each slice is 360 / length
        const sliceAngle = 360 / options.length;
        // Winner should be at the top (270 degrees or -90 degrees)
        // But let's say pointer is at 0 degrees (right) or top? Usually top.
        // If pointer is at top (270deg in standard circle math), and we rotate the container.
        // To get index i to top: rotation = - (i * sliceAngle) + offset?
        
        // Let's simplify: pointer is at TOP.
        // Slice 0 starts at -90deg?
        
        // Let's just do pure rotation math.
        // We want the final rotation % 360 to align the winner with the pointer.
        
        const rotations = 5 + Math.random() * 3; // 5-8 full spins
        const totalAngle = 360 * rotations;
        
        // Align winner to top
        // If we render slices starting from 0deg clockwise.
        // Slice i is at [i*slice, (i+1)*slice]. Center is (i+0.5)*slice.
        // We want center of slice to be at -90deg (top).
        // Current pos = (i+0.5)*slice. Target = -90.
        // Delta = -90 - current.
        // Final Rotation = totalAngle + Delta.
        
        const currentAngle = (winnerIndex + 0.5) * sliceAngle;
        const targetAngle = 270; // 270 is top in CSS rotate if 0 is right? No, 0 is usually top or right depending on start.
        // Let's assume 0 is top for our rendering logic.
        
        // Actually, easier:
        // Just spin a lot, and stop at specific angle.
        // Angle per slice = 360 / n
        // We want index `winnerIndex` to be at top.
        // That means we rotate such that `winnerIndex` * sliceAngle + offset comes to 0.
        // Rotation = -(winnerIndex * sliceAngle) + offset?
        
        // Let's assume pointer is at top (0deg).
        // Slice 0 is at 0deg.
        // To get Slice 1 to top, we rotate -sliceAngle.
        // To get Slice K to top, we rotate -K * sliceAngle.
        
        const finalRotation = -(winnerIndex * sliceAngle);
        // Add extra full spins
        const targetRotation = finalRotation - (360 * 5); // 5 spins backward (clockwise visually?)
        
        // Randomize slightly within the slice to feel organic
        const jitter = (Math.random() - 0.5) * (sliceAngle * 0.8);
        
        await controls.start({
          rotate: targetRotation + jitter,
          transition: {
            duration: 4,
            ease: [0.1, 0, 0.2, 1], // Custom easeOutCirc-ish
          }
        });
        
        if (onSpinComplete) {
          onSpinComplete();
        }
      };
      
      spinWheel();
    }
  }, [isSpinning, winner, options, controls, onSpinComplete]);

  const sliceAngle = 360 / options.length;

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-4xl text-white drop-shadow-lg">
        ⬇️
      </div>

      {/* Wheel */}
      <motion.div
        className="w-full h-full rounded-full border-4 border-white shadow-2xl overflow-hidden relative bg-white"
        animate={controls}
        style={{ rotate: rotation }}
      >
        {options.map((option, index) => {
          const rotate = index * sliceAngle;
          const skew = 90 - sliceAngle; 
          // This CSS trick for sectors only works well for specific angles.
          // Better to use SVG or Conic Gradient.
          
          return (
            <div
              key={option.id}
              className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left flex items-center justify-center"
              style={{
                transform: `rotate(${rotate}deg) skewY(0deg)`, // Skew approach is tricky
                // Let's use Conic Gradient for background colors? 
                // Or absolute positioning with clip-path
              }}
            >
               {/* We'll use a simpler approach: absolute positioned items with rotation */}
            </div>
          );
        })}
        
        {/* Better Wheel Rendering with SVG */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90">
            {options.map((option, index) => {
                const startAngle = index * (360 / options.length);
                const endAngle = (index + 1) * (360 / options.length);
                
                // Convert polar to cartesian
                const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                
                const pathData = options.length === 1 
                    ? `M 50 50 L 50 0 A 50 50 0 1 1 49.99 0 Z` // Full circle
                    : `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                return (
                    <path 
                        key={option.id} 
                        d={pathData} 
                        fill={option.color} 
                        stroke="white" 
                        strokeWidth="0.5"
                    />
                );
            })}
        </svg>
        
        {/* Icons/Text */}
        {options.map((option, index) => {
            const angle = (index + 0.5) * (360 / options.length);
            return (
                <div
                    key={option.id}
                    className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-4 pointer-events-none"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <div className="text-2xl transform -rotate-90" style={{ transform: `rotate(-${angle}deg)` }}>
                        {/* Counter-rotate text to keep it upright? No, usually text radiates */}
                        <span className="drop-shadow-md">{option.icon}</span>
                    </div>
                </div>
            );
        })}
      </motion.div>
      
      {/* Center Cap */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full z-10 shadow-md flex items-center justify-center">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}
