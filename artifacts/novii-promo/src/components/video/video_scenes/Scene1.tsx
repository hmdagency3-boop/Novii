import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const chars = 'Novii'.split('');

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 text-center" dir="rtl">
        {/* Logo circle */}
        <motion.div
          className="mx-auto mb-8 relative"
          style={{ width: '10vw', height: '10vw' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-80"
            style={{ background: 'radial-gradient(circle, #7c3aed, #ec4899)' }}
          />
          <div
            className="relative w-full h-full rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
          >
            <span
              className="text-white font-black"
              style={{ fontSize: '3.5vw', fontFamily: 'var(--font-display)' }}
            >
              N
            </span>
          </div>
        </motion.div>

        {/* Title chars */}
        <div className="flex items-center justify-center gap-0 mb-4" dir="ltr">
          {chars.map((char, i) => (
            <motion.span
              key={i}
              className="font-black text-white"
              style={{
                display: 'inline-block',
                fontSize: '9vw',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
              initial={{ opacity: 0, y: '4vh', rotateX: -60 }}
              animate={
                phase >= 2
                  ? { opacity: 1, y: 0, rotateX: 0 }
                  : { opacity: 0, y: '4vh', rotateX: -60 }
              }
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 22,
                delay: phase >= 2 ? i * 0.07 : 0,
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Accent line */}
        <motion.div
          className="mx-auto mb-6"
          style={{ height: '2px', background: 'linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4)' }}
          initial={{ width: 0 }}
          animate={phase >= 2 ? { width: '40vw' } : { width: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />

        {/* Tagline Arabic */}
        <motion.p
          className="font-semibold"
          style={{
            fontSize: '2.5vw',
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(90deg, #a78bfa, #f9a8d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          initial={{ opacity: 0, filter: 'blur(12px)' }}
          animate={
            phase >= 3
              ? { opacity: 1, filter: 'blur(0px)' }
              : { opacity: 0, filter: 'blur(12px)' }
          }
          transition={{ duration: 0.8, ease: 'circOut' }}
        >
          شارك لحظاتك — تواصل مع من تحب
        </motion.p>
      </div>

      {/* Floating accent shapes */}
      <motion.div
        className="absolute top-[15%] left-[10%] rounded-full opacity-30"
        style={{ width: '8vw', height: '8vw', background: 'radial-gradient(circle, #7c3aed, transparent)' }}
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[8%] rounded-full opacity-25"
        style={{ width: '12vw', height: '12vw', background: 'radial-gradient(circle, #ec4899, transparent)' }}
        animate={{ y: [0, 15, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-[60%] left-[5%] rounded-full opacity-20"
        style={{ width: '6vw', height: '6vw', background: 'radial-gradient(circle, #06b6d4, transparent)' }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </motion.div>
  );
}
