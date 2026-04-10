import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const avatarColors = [
  ['#7c3aed', '#a855f7'],
  ['#ec4899', '#f43f5e'],
  ['#06b6d4', '#0ea5e9'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#8b5cf6', '#c084fc'],
];

const avatarPositions = [
  { x: '20vw', y: '30vh' },
  { x: '70vw', y: '25vh' },
  { x: '15vw', y: '60vh' },
  { x: '75vw', y: '65vh' },
  { x: '45vw', y: '75vh' },
  { x: '50vw', y: '20vh' },
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const words = ['تواصل', 'مع', 'من', 'تحب'];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      exit={{ clipPath: 'inset(0 0 0 100%)' }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Avatar circles */}
      {avatarColors.map((colors, i) => (
        <motion.div
          key={i}
          className="absolute flex items-center justify-center rounded-full shadow-2xl"
          style={{
            left: avatarPositions[i].x,
            top: avatarPositions[i].y,
            width: '5.5vw',
            height: '5.5vw',
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            phase >= 1
              ? { scale: 1, opacity: 1 }
              : { scale: 0, opacity: 0 }
          }
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 18,
            delay: phase >= 1 ? i * 0.1 : 0,
          }}
        >
          <motion.div
            className="rounded-full opacity-40"
            style={{
              width: '140%',
              height: '140%',
              position: 'absolute',
              background: `radial-gradient(circle, ${colors[0]}66, transparent)`,
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
          <span
            className="text-white font-bold relative z-10"
            style={{ fontSize: '1.8vw', fontFamily: 'var(--font-display)' }}
          >
            {String.fromCharCode(0x0627 + i)}
          </span>
        </motion.div>
      ))}

      {/* SVG connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {[[0, 5], [5, 1], [1, 3], [2, 4], [4, 3], [0, 2]].map(([a, b], i) => (
          <motion.line
            key={i}
            x1={avatarPositions[a].x}
            y1={avatarPositions[a].y}
            x2={avatarPositions[b].x}
            y2={avatarPositions[b].y}
            stroke={`url(#grad${i})`}
            strokeWidth="1.5"
            strokeDasharray="8 4"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={phase >= 2 ? { opacity: 0.4, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
          />
        ))}
        <defs>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <linearGradient key={i} id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Center headline */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center" dir="rtl">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="font-black"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '6.5vw',
                  lineHeight: 1.1,
                  background: i === 0 || i === 3
                    ? 'linear-gradient(135deg, #a78bfa, #f9a8d4)'
                    : 'none',
                  color: i === 0 || i === 3 ? 'transparent' : 'white',
                  WebkitBackgroundClip: i === 0 || i === 3 ? 'text' : 'none',
                  WebkitTextFillColor: i === 0 || i === 3 ? 'transparent' : 'white',
                }}
                initial={{ opacity: 0, y: '3vh', filter: 'blur(8px)' }}
                animate={
                  phase >= 3
                    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                    : { opacity: 0, y: '3vh', filter: 'blur(8px)' }
                }
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
