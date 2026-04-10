import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  intro: 3500,
  connect: 4000,
  features: 4500,
  stats: 3500,
  outro: 4500,
};

const orbPositions = [
  { x: '-5vw', y: '-5vh', scale: 1 },
  { x: '60vw', y: '10vh', scale: 1.3 },
  { x: '20vw', y: '50vh', scale: 0.8 },
  { x: '70vw', y: '60vh', scale: 1.1 },
  { x: '30vw', y: '-8vh', scale: 0.9 },
];

const orb2Positions = [
  { x: '80vw', y: '70vh', scale: 1 },
  { x: '5vw', y: '60vh', scale: 0.8 },
  { x: '65vw', y: '20vh', scale: 1.2 },
  { x: '10vw', y: '10vh', scale: 0.9 },
  { x: '50vw', y: '75vh', scale: 1.1 },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: '#0d0d14' }}
    >
      {/* Persistent background — drifts continuously */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            width: '50vw',
            height: '50vw',
            background: 'radial-gradient(circle, #7c3aed, transparent 70%)',
          }}
          animate={orbPositions[currentScene]}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: '40vw',
            height: '40vw',
            background: 'radial-gradient(circle, #ec4899, transparent 70%)',
          }}
          animate={orb2Positions[currentScene]}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Slow drift cyan orb */}
        <motion.div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            width: '30vw',
            height: '30vw',
            background: 'radial-gradient(circle, #06b6d4, transparent 70%)',
          }}
          animate={{ x: ['-10vw', '80vw', '40vw', '10vw', '60vw'][currentScene], y: ['80vh', '20vh', '60vh', '40vh', '10vh'][currentScene] }}
          transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Persistent accent line that morphs across scenes */}
      <motion.div
        className="absolute"
        style={{ height: '2px', background: 'linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4)', opacity: 0.6 }}
        animate={{
          left: ['5%', '60%', '10%', '40%', '25%'][currentScene],
          width: ['30%', '20%', '50%', '25%', '40%'][currentScene],
          top: ['15%', '80%', '50%', '30%', '88%'][currentScene],
        }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Persistent floating square */}
      <motion.div
        className="absolute rounded-lg opacity-10"
        style={{ width: '3vw', height: '3vw', border: '2px solid #a78bfa' }}
        animate={{
          x: ['75vw', '10vw', '85vw', '5vw', '55vw'][currentScene],
          y: ['10vh', '75vh', '45vh', '20vh', '65vh'][currentScene],
          rotate: [0, 60, 120, 180, 240][currentScene],
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Scene foreground content */}
      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="connect" />}
        {currentScene === 2 && <Scene3 key="features" />}
        {currentScene === 3 && <Scene4 key="stats" />}
        {currentScene === 4 && <Scene5 key="outro" />}
      </AnimatePresence>
    </div>
  );
}
