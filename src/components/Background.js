'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Background() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Dynamic Orbs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      
      <motion.div
        animate={{
          x: [0, -150, 50, 0],
          y: [0, 100, -50, 0],
          scale: [1, 1.5, 0.9, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />
      
      <motion.div
        animate={{
          x: [0, 50, -100, 0],
          y: [0, 50, 100, 0],
          scale: [0.8, 1.2, 1, 0.8],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '40%',
          right: '30%',
          width: '30vw',
          height: '30vw',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
        }}
      />
    </div>
  );
}
