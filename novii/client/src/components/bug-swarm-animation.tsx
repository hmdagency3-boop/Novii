import { useEffect, useRef } from 'react';

export function BugSwarmAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Animation loop - smooth typing effect with glow
    const animate = () => {
      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frameCountRef.current++;
      const frame = frameCountRef.current;

      // Characters to type
      const fullText = 'Bug Hunter';
      const framePerChar = 60;
      const pauseFrames = 150; // Pause before restarting
      const totalCycleDuration = framePerChar * (fullText.length + 1) + pauseFrames;
      
      // Calculate which character to show
      const charIndex = Math.floor(frame / framePerChar) % (fullText.length + 1);
      
      // Reset animation after pause
      if (frame % totalCycleDuration === 0 && frame > 0) {
        frameCountRef.current = 0;
      }

      // Text to display
      const displayText = fullText.substring(0, charIndex);

      // Responsive font size based on screen width
      const fontSize = Math.min(90, Math.max(40, canvas.width * 0.25));
      const yPosition = canvas.height * 0.45; // Adjust vertical position for mobile

      // Create gradient for text
      const gradient = ctx.createLinearGradient(0, yPosition - 50, 0, yPosition + 50);
      gradient.addColorStop(0, '#ff6b9d');      // Pink
      gradient.addColorStop(0.5, '#ffaa00');    // Orange/Yellow
      gradient.addColorStop(1, '#ff6b9d');      // Pink

      // Draw multiple layers for glow effect
      ctx.font = `bold ${fontSize}px Arial Black, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.3)';

      // Outer glow layers
      for (let i = 8; i > 0; i--) {
        const alpha = (8 - i) * 0.08;
        ctx.shadowColor = `rgba(255, 107, 157, ${alpha})`;
        ctx.shadowBlur = i * 2;
        ctx.globalAlpha = 0.5;
        ctx.strokeText(displayText, canvas.width / 2, yPosition);
      }

      // Main text with gradient
      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(displayText, canvas.width / 2, yPosition);
      ctx.strokeText(displayText, canvas.width / 2, yPosition);

      // Draw smooth cursor with animation
      if (charIndex < fullText.length) {
        const cursorOpacity = (Math.sin(frame / 8) + 1) / 2; // Smooth pulsing cursor
        
        ctx.strokeStyle = `rgba(255, 170, 0, ${cursorOpacity})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        const textWidth = ctx.measureText(displayText).width;
        const x = canvas.width / 2 + textWidth / 2 + 5;
        const y = yPosition;
        
        // Animated cursor with glow
        ctx.shadowColor = `rgba(255, 170, 0, ${cursorOpacity * 0.8})`;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(x, y - fontSize * 0.6);
        ctx.lineTo(x, y + fontSize * 0.6);
        ctx.stroke();

        // Cursor glow effect
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y - fontSize * 0.6);
        ctx.lineTo(x, y + fontSize * 0.6);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
