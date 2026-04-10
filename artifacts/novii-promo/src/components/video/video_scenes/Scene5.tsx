import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const noviiChars = 'Novii'.split('');

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: 'circOut' }}
    >
      <div className="relative z-10 text-center" dir="rtl">
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '30vw',
            height: '30vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Logo */}
        <motion.div
          className="mx-auto mb-6 relative"
          style={{ width: '8vw', height: '8vw' }}
          initial={{ scale: 0, rotate: 180, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: 180, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <div
            className="absolute inset-0 rounded-2xl blur-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed88, #ec489988)' }}
          />
          <div
            className="relative w-full h-full rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
          >
            <span
              className="font-black text-white"
              style={{ fontSize: '2.8vw', fontFamily: 'var(--font-display)' }}
            >
              N
            </span>
          </div>
        </motion.div>

        {/* Novii title */}
        <div className="flex items-center justify-center mb-3" dir="ltr">
          {noviiChars.map((char, i) => (
            <motion.span
              key={i}
              className="font-black"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-display)',
                fontSize: '8vw',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #c4b5fd, #f9a8d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              initial={{ opacity: 0, y: '2vh' }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: '2vh' }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 22,
                delay: phase >= 2 ? i * 0.06 : 0,
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          className="font-semibold mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2vw',
            color: 'rgba(255,255,255,0.7)',
          }}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: 'circOut' }}
        >
          شارك لحظاتك — تواصل مع من تحب
        </motion.p>

        {/* URL */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.35)',
          }}
          initial={{ opacity: 0, y: '1.5vh' }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: '1.5vh' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="rounded-full"
            style={{ width: '0.6vw', height: '0.6vw', background: '#10b981' }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.2vw',
              color: '#a78bfa',
              letterSpacing: '0.05em',
            }}
          >
            novii.netlify.app
          </span>
        </motion.div>
      </div>

      {/* Corner particle bursts */}
      {[
        { x: '10vw', y: '15vh', color: '#7c3aed' },
        { x: '85vw', y: '80vh', color: '#ec4899' },
        { x: '88vw', y: '12vh', color: '#06b6d4' },
        { x: '8vw', y: '82vh', color: '#a855f7' },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: dot.x, top: dot.y, width: '1vw', height: '1vw', background: dot.color, transform: 'translate(-50%,-50%)' }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
        />
      ))}
    </motion.div>
  );
}
