import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const features = [
  { ar: 'قصص يومية', color: '#a78bfa' },
  { ar: 'منشورات مصورة', color: '#f9a8d4' },
  { ar: 'تعليقات & إعجابات', color: '#67e8f9' },
  { ar: 'رسائل مباشرة', color: '#86efac' },
];

export function Scene3() {
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
      className="absolute inset-0 flex items-center justify-center gap-[6vw]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      dir="rtl"
    >
      {/* Phone mockup */}
      <motion.div
        className="relative shrink-0"
        style={{ width: '16vw', height: '30vw' }}
        initial={{ x: '-8vw', opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: '-8vw', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-[3vw] blur-3xl opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed55, #ec489955)' }}
        />
        {/* Frame */}
        <div
          className="relative w-full h-full rounded-[2.2vw] flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: '#0d0d14',
            border: '2px solid rgba(124,58,237,0.4)',
          }}
        >
          {/* Notch */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-[30%] h-[0.6vw] bg-zinc-700 rounded-full" />
          </div>
          {/* Screen */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* App bar */}
            <div
              className="flex items-center justify-between px-3 py-2 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span
                className="font-black"
                style={{
                  fontSize: '1.4vw',
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(90deg, #a78bfa, #f9a8d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Novii
              </span>
              <div className="flex gap-1">
                {['#7c3aed', '#ec4899'].map((c, i) => (
                  <div key={i} className="rounded-full" style={{ width: '1vw', height: '1vw', background: c }} />
                ))}
              </div>
            </div>
            {/* Stories row */}
            <div className="flex gap-[0.6vw] px-2 py-2 shrink-0">
              {['#7c3aed', '#ec4899', '#06b6d4', '#10b981'].map((c, i) => (
                <motion.div
                  key={i}
                  className="rounded-full shrink-0"
                  style={{
                    width: '2.2vw',
                    height: '2.2vw',
                    border: `2px solid ${c}`,
                    background: `${c}22`,
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
            {/* Posts */}
            {[
              { from: '#7c3aed', to: '#a855f7' },
              { from: '#ec4899', to: '#f43f5e' },
              { from: '#06b6d4', to: '#0ea5e9' },
            ].map((grad, i) => (
              <motion.div
                key={i}
                className="mx-2 mb-2 rounded-xl overflow-hidden shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                initial={{ x: '2vw', opacity: 0 }}
                animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: '2vw', opacity: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="flex items-center gap-2 p-2">
                  <div
                    className="rounded-full shrink-0"
                    style={{ width: '1.5vw', height: '1.5vw', background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                  />
                  <div className="h-[0.5vw] w-[4vw] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                </div>
                <div
                  className="mx-2 mb-2 rounded-lg"
                  style={{
                    height: '4vw',
                    background: `linear-gradient(135deg, ${grad.from}44, ${grad.to}22)`,
                  }}
                />
                <div className="flex items-center gap-2 px-2 pb-2">
                  <span style={{ fontSize: '1.2vw', color: grad.from }}>♥</span>
                  <span style={{ fontSize: '0.8vw', color: 'rgba(255,255,255,0.4)' }}>💬</span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Bottom nav */}
          <div
            className="flex justify-around items-center py-2 shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {['⌂', '⊙', '+', '♡', '◯'].map((icon, i) => (
              <span
                key={i}
                style={{ fontSize: '1.5vw', color: i === 0 ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}
              >
                {icon}
              </span>
            ))}
          </div>
          {/* Home indicator */}
          <div className="flex justify-center py-2 shrink-0">
            <div className="rounded-full" style={{ width: '30%', height: '0.4vw', background: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      </motion.div>

      {/* Features list */}
      <div className="flex flex-col gap-[1.8vh]">
        <motion.p
          className="font-semibold mb-2"
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.2vw', fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          كل ما تحتاجه في مكان واحد
        </motion.p>
        {features.map((f, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            initial={{ x: '4vw', opacity: 0 }}
            animate={phase >= 3 ? { x: 0, opacity: 1 } : { x: '4vw', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.12 }}
          >
            <motion.div
              className="rounded-full shrink-0"
              style={{ width: '0.8vw', height: '0.8vw', background: f.color }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
            <span
              className="font-semibold"
              style={{ fontSize: '2.2vw', fontFamily: 'var(--font-display)', color: f.color }}
            >
              {f.ar}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
