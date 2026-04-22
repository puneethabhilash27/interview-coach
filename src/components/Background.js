'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const MouseSpotlight = ({ mouseX, mouseY }) => {
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        x: springX,
        y: springY,
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 60%)', // Brighter opacity
        pointerEvents: 'none',
        translateX: '-50%',
        translateY: '-50%',
        zIndex: 5,
        filter: 'blur(40px)',
        mixBlendMode: 'screen',
      }}
    />
  );
};


export default function Background() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState([]);
  const [sparkles, setSparkles] = useState([]);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    setMounted(true);
    // Generate random particles for the background
    const particleCount = 40;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1, // 1px to 5px
      x: Math.random() * 100, // percentage
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10, // 10s to 30s
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    setParticles(newParticles);

    // Generate smaller, faster moving sparkles
    const sparkleCount = 25;
    const newSparkles = Array.from({ length: sparkleCount }).map((_, i) => ({
      id: i + particleCount,
      size: Math.random() * 2 + 1, // 1px to 3px
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 5, // 5s to 15s (faster)
      delay: Math.random() * 3,
      opacity: Math.random() * 0.8 + 0.2,
    }));
    setSparkles(newSparkles);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#020617' }}>
      {/* Animated Liquid Aurora Gradients */}
      <motion.div
        animate={{
          x: ['-25%', '25%', '-25%'],
          y: ['-25%', '25%', '-25%'],
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          borderRadius: ['60% 40% 30% 70% / 60% 30% 70% 40%', '30% 60% 70% 40% / 50% 60% 30% 60%', '60% 40% 30% 70% / 60% 30% 70% 40%']
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '70vw',
          height: '70vw',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 60%)',
          filter: 'blur(90px)',
          mixBlendMode: 'screen',
        }}
      />
      
      <motion.div
        animate={{
          x: ['25%', '-25%', '25%'],
          y: ['25%', '-25%', '25%'],
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
          borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%', '40% 60% 70% 30% / 40% 50% 60% 50%']
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-20%',
          width: '80vw',
          height: '80vw',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 60%)',
          filter: 'blur(100px)',
          mixBlendMode: 'screen',
        }}
      />

      <motion.div
        animate={{
          x: ['-10%', '10%', '-10%'],
          y: ['10%', '-10%', '10%'],
          scale: [1, 1.5, 1],
          borderRadius: ['50% 50% 50% 50%', '40% 60% 60% 40% / 60% 40% 60% 40%', '50% 50% 50% 50%']
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
          filter: 'blur(80px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Animated Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [`${p.y}vh`, `${p.y - 40}vh`, `${p.y}vh`],
            x: [`${p.x}vw`, `${p.x + (Math.random() * 15 - 7.5)}vw`, `${p.x}vw`],
            opacity: [p.opacity, p.opacity * 2.5, p.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: 'var(--cyan)',
            boxShadow: `0 0 ${p.size * 3}px var(--cyan)`,
            top: 0,
            left: 0,
          }}
        />
      ))}

      {/* Fast Moving Sparkles */}
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          animate={{
            y: [`${s.y}vh`, `${s.y - 60}vh`],
            x: [`${s.x}vw`, `${s.x + (Math.random() * 30 - 15)}vw`],
            opacity: [0, s.opacity, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "linear",
            delay: s.delay,
          }}
          style={{
            position: 'absolute',
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: 'var(--purple)',
            boxShadow: `0 0 ${s.size * 4}px var(--purple)`,
            top: 0,
            left: 0,
            filter: 'blur(1px)',
          }}
        />
      ))}

      {/* Mouse Spotlight */}
      <MouseSpotlight mouseX={mouseX} mouseY={mouseY} />
    </div>
  );
}
