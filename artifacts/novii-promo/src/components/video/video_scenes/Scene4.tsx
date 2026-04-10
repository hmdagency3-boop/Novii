import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const stats = [
  { value: '+10K', label: 'مستخدم', color: '#a78bfa' },
  { value: '+50K', label: 'منشور يومياً', color: '#f9a8d4' },
  { value: '+500K', label: 'إعجاب يومياً', color: '#67e8f9' },
];

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' }}
      animate={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      exit={{ clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' }}
      transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
      dir="rtl"
    >
      {/* Heading */}
      <motion.h2
        className="font-black text-center mb-[4vh]"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '5.5vw',
          lineHeight: 1.15,
          background: 'linear-gradient(135deg, #c4b5fd, #fbcfe8, #a5f3fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ opacity: 0, y: '3vh', filter: 'blur(10px)' }}
        animate={phase >= 1 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: '3vh', filter: 'blur(10px)' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        المجتمع ينمو<br />كل يوم
      </motion.h2>

      {/* Stats */}
      <div className="flex items-stretch gap-[3vw]">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center text-center px-[2vw] py-[2vh] rounded-2xl"
            style={{
              background: `${stat.color}11`,
              border: `1px solid ${stat.color}33`,
              minWidth: '12vw',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: i * 0.15 }}
          >
            {/* Pulsing dot */}
            <motion.div
              className="rounded-full mb-3"
              style={{ width: '0.8vw', height: '0.8vw', background: stat.color }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
            <motion.span
              className="font-black block"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '5vw',
                color: stat.color,
                lineHeight: 1,
              }}
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {stat.value}
            </motion.span>
            <span
              className="font-semibold mt-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5vw',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Decorative ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '40vw',
          height: '40vw',
          border: '1px solid rgba(124,58,237,0.12)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '55vw',
          height: '55vw',
          border: '1px solid rgba(236,72,153,0.08)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}
